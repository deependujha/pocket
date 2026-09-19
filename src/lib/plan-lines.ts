import type { Goal, PlanPhase, Settings } from "@/generated/prisma/client";
import type { AccountWithGoal, LoanWithPayments } from "@/lib/finance";
import { loanOutstanding } from "@/lib/finance";
import { GOAL_KINDS } from "@/lib/constants";
import { simulatePlan, type DebtLine, type GoalLine, type Shares } from "@/lib/plan";

export function buildDebts( loans: LoanWithPayments[] ): DebtLine[] {
    return loans
        .filter( l => l.status === "ACTIVE" && l.direction === "BORROWED" && loanOutstanding( l ) > 0 )
        .map( l => ( { id: l.id, name: l.counterparty, outstanding: loanOutstanding( l ), monthly: l.emi ?? 0 } ) );
}

export function buildGoalLines( goals: Goal[], accounts: AccountWithGoal[] ): GoalLine[] {
    return goals
        .filter( g => g.status === "ACTIVE" )
        .map( g => {
            const current = accounts.filter( a => a.goalId === g.id && !a.archived ).reduce( ( s, a ) => s + a.balance, 0 );
            return { id: g.id, name: g.name, emoji: g.emoji ?? GOAL_KINDS[ g.kind ].emoji, remaining: Math.max( 0, g.target - current ), isWealth: g.kind === "WEALTH" };
        } );
}

export const phaseShares = ( phases: PlanPhase[] ): Shares[] =>
    [ ...phases ].sort( ( a, b ) => a.order - b.order ).map( p => ( p.shares ?? {} ) as Shares );

export const surplusOf = ( s: Pick<Settings, "monthlyIncome" | "monthlyExpense"> | null | undefined ) =>
    Math.max( 0, ( s?.monthlyIncome ?? 0 ) - ( s?.monthlyExpense ?? 0 ) );

/** One call for screens that only need the result. */
export function planFor( goals: Goal[], accounts: AccountWithGoal[], loans: LoanWithPayments[], phases: PlanPhase[], settings: Settings | null | undefined ) {
    return simulatePlan( surplusOf( settings ), buildDebts( loans ), buildGoalLines( goals, accounts ), phaseShares( phases ) );
}
