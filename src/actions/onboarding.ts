"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { invalidateUser } from "@/lib/data";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { suggestSplit, type PlanLine } from "@/lib/plan";
import { type ActionResult, fail, optInt, optStr, parseForm, reqInt } from "./_shared";

const schema = z.object( {
    monthlyIncome: reqInt,
    monthlyExpense: reqInt,
    emergencyMonths: reqInt.pipe( z.number().min( 1 ).max( 24 ) ),
    // starter goals (unchecked = not created)
    goals: z.array( z.string() ).optional().default( [] ),
    jobLossTarget: optInt,
    healthTarget: optInt,
    funTarget: optInt,
    // optional existing debt
    debtAmount: optInt,
    debtTo: optStr,
    debtEmi: optInt,
    // starter accounts
    starters: z.array( z.string() ).optional().default( [] ),
    savingsBalance: optInt,
} );

export async function completeOnboarding( _: ActionResult | null, fd: FormData ): Promise<ActionResult> {
    let user;
    try {
        user = await requireUser();
        const p = parseForm( schema, fd );
        if ( "error" in p ) return { ok: false, error: p.error };
        const d = p.data;
        const has = ( list: string[], k: string ) => list.includes( k );
        const surplus = Math.max( 0, d.monthlyIncome - d.monthlyExpense );

        await prisma.$transaction( async tx => {
            await tx.settings.upsert( {
                where: { userId: user!.id },
                update: { monthlyIncome: d.monthlyIncome, monthlyExpense: d.monthlyExpense, emergencyMonths: d.emergencyMonths, onboarded: true },
                create: { userId: user!.id, monthlyIncome: d.monthlyIncome, monthlyExpense: d.monthlyExpense, emergencyMonths: d.emergencyMonths, onboarded: true },
            } );
            if ( await tx.goal.count( { where: { userId: user!.id } } ) > 0 ) return; // re-running must not duplicate

            const mkGoal = ( data: { name: string; kind: "EMERGENCY" | "HEALTH" | "FUN" | "WEALTH"; emoji: string; target: number; priority: number; note: string } ) =>
                tx.goal.create( { data: { userId: user!.id, ...data } } );

            const wealth = has( d.goals, "wealth" ) ? await mkGoal( { name: "Long-term wealth", kind: "WEALTH", emoji: "🌱", priority: 2, target: Math.max( 5000000, d.monthlyExpense * 12 * 25 ), note: "Nifty 50 + a little gold, every month, forever. 25× yearly expenses is the classic freedom number." } ) : null;
            const jobLoss = has( d.goals, "jobLoss" ) ? await mkGoal( { name: "Job-loss cover", kind: "EMERGENCY", emoji: "🛟", priority: 1, target: d.jobLossTarget ?? Math.max( 100000, d.monthlyExpense * d.emergencyMonths ), note: "If salary stops. Only for that." } ) : null;
            const health = has( d.goals, "health" ) ? await mkGoal( { name: "Health emergency", kind: "HEALTH", emoji: "🏥", priority: 1, target: d.healthTarget ?? 1000000, note: "Hospital, surgery, family. Insurance premiums are an expense, not part of this." } ) : null;
            const fun = has( d.goals, "fun" ) ? await mkGoal( { name: "Fun fund", kind: "FUN", emoji: "🎉", priority: 3, target: d.funTarget ?? 300000, note: "Travel, a gadget, anything. Guilt-free once it's there." } ) : null;

            const mkAccount = async ( name: string, type: keyof typeof ACCOUNT_TYPES, extra: { balance?: number; goalId?: string | null; institution?: string } ) => {
                const balance = extra.balance ?? 0;
                const a = await tx.account.create( { data: { userId: user!.id, name, type, liquidity: ACCOUNT_TYPES[ type ].liquidity, balance, invested: ACCOUNT_TYPES[ type ].hasInvested ? balance : null, goalId: extra.goalId ?? null, institution: extra.institution } } );
                await tx.movement.create( { data: { userId: user!.id, accountId: a.id, kind: "ADJUST", amount: balance, balanceAfter: balance, note: "Opening balance" } } );
            };
            if ( has( d.starters, "savings" ) ) await mkAccount( "Savings account", "SAVINGS", { balance: d.savingsBalance ?? 0 } );
            if ( has( d.starters, "nifty" ) ) await mkAccount( "Nifty 50 SIP", "EQUITY_SIP", { goalId: wealth?.id } );
            if ( has( d.starters, "gold" ) ) await mkAccount( "Gold ETF SIP", "GOLD_SIP", { goalId: wealth?.id } );
            if ( has( d.starters, "card" ) ) await mkAccount( "Credit card", "CREDIT_CARD", {} );
            if ( jobLoss && has( d.starters, "jobLossFd" ) ) await mkAccount( "Job-loss cover RD", "RD", { goalId: jobLoss.id } );
            if ( health && has( d.starters, "healthFd" ) ) await mkAccount( "Health fund RD", "RD", { goalId: health.id } );
            if ( fun && has( d.starters, "funFd" ) ) await mkAccount( "Fun fund RD", "RD", { goalId: fun.id } );

            let debtId: string | null = null;
            if ( d.debtAmount && d.debtAmount > 0 ) {
                const l = await tx.loan.create( { data: { userId: user!.id, direction: "BORROWED", counterparty: d.debtTo ?? "Debt", principal: d.debtAmount, emi: d.debtEmi ?? null, overflowGoalId: jobLoss?.id ?? null } } );
                debtId = l.id;
            }

            // A first split so the Plan screen isn't empty. Debt first, then 40% wealth / 60% safety by size and priority.
            const lines: PlanLine[] = [];
            if ( debtId ) lines.push( { id: `loan:${debtId}`, name: "debt", emoji: "", kind: "debt", target: d.debtAmount!, current: 0, monthly: d.debtEmi ?? 0, overflowId: null, priority: 0 } );
            for ( const g of [ wealth, jobLoss, health, fun ] ) if ( g ) lines.push( { id: g.id, name: g.name, emoji: "", kind: g.kind === "WEALTH" ? "wealth" : "goal", target: g.target, current: 0, monthly: 0, overflowId: null, priority: g.priority } );
            const split = suggestSplit( lines, surplus );
            for ( const g of [ wealth, jobLoss, health, fun ] ) if ( g && split[ g.id ] != null ) await tx.goal.update( { where: { id: g.id }, data: { monthlyPlan: split[ g.id ] } } );
            if ( debtId && split[ `loan:${debtId}` ] != null ) await tx.loan.update( { where: { id: debtId }, data: { emi: split[ `loan:${debtId}` ] || null } } );
            // overflow chain: job-loss → health → fun → wealth(default)
            if ( jobLoss && health ) await tx.goal.update( { where: { id: jobLoss.id }, data: { overflowGoalId: health.id } } );
            if ( health && fun ) await tx.goal.update( { where: { id: health.id }, data: { overflowGoalId: fun.id } } );
        } );
    } catch ( e ) { return fail( e ); }
    invalidateUser( user.id ); revalidatePath( "/", "layout" );
    redirect( "/?tab=plan" );
}
