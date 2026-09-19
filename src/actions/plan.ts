"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { invalidateUser } from "@/lib/data";
import { simulatePlan, type Shares } from "@/lib/plan";
import { buildDebts, buildGoalLines, surplusOf } from "@/lib/plan-lines";
import { type ActionResult, fail } from "./_shared";

const payload = z.object( {
    phases: z.array( z.record( z.string(), z.number().min( 0 ).max( 100 ) ) ).max( 20 ),
    debts: z.record( z.string(), z.number().int().min( 0 ).max( 100000000 ) ),
} );

/** Saves every decided phase and each debt's monthly payment in one go. */
export async function savePlan( _: ActionResult | null, fd: FormData ): Promise<ActionResult> {
    try {
        const user = await requireUser();
        const parsed = payload.safeParse( JSON.parse( String( fd.get( "plan" ) ?? "{}" ) ) );
        if ( !parsed.success ) return { ok: false, error: "Could not read the plan" };
        const { phases, debts } = parsed.data;

        const goals = await prisma.goal.findMany( { where: { userId: user.id } } );
        const goalIds = new Set( goals.map( g => g.id ) );
        const clean: Shares[] = phases.map( p => Object.fromEntries( Object.entries( p ).filter( ( [ id ] ) => goalIds.has( id ) ).map( ( [ id, v ] ) => [ id, Math.round( v ) ] ) ) );

        await prisma.$transaction( async tx => {
            await tx.planPhase.deleteMany( { where: { userId: user.id } } );
            for ( let i = 0; i < clean.length; i++ ) await tx.planPhase.create( { data: { userId: user.id, order: i + 1, shares: clean[ i ] } } );
            for ( const [ id, monthly ] of Object.entries( debts ) ) {
                await tx.loan.updateMany( { where: { id, userId: user.id, direction: "BORROWED" }, data: { emi: monthly || null } } );
            }
            // derive each goal's monthly amount from phase 1 so goal screens agree with the plan
            const [ accounts, loans, settings ] = await Promise.all( [
                tx.account.findMany( { where: { userId: user.id }, include: { goal: { select: { id: true, name: true, kind: true, status: true } } } } ),
                tx.loan.findMany( { where: { userId: user.id }, include: { payments: true } } ),
                tx.settings.findUnique( { where: { userId: user.id } } ),
            ] );
            const r = simulatePlan( surplusOf( settings ), buildDebts( loans ), buildGoalLines( goals, accounts ), clean );
            const first = r.phases[ 0 ];
            for ( const g of goals ) {
                if ( g.status !== "ACTIVE" ) continue;
                await tx.goal.update( { where: { id: g.id }, data: { monthlyPlan: first?.amounts[ g.id ] ?? 0 } } );
            }
        } );
        invalidateUser( user.id ); revalidatePath( "/", "layout" );
        return { ok: true };
    } catch ( e ) { return fail( e ); }
}
