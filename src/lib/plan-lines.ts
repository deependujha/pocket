import type { Goal, Settings } from "@/generated/prisma/client";
import type { AccountWithGoal, LoanWithPayments } from "@/lib/finance";
import { loanOutstanding, loanPaid } from "@/lib/finance";
import { GOAL_KINDS } from "@/lib/constants";
import type { PlanLine } from "@/lib/plan";

export const loanLineId = ( id: string ) => `loan:${id}`;
export const isLoanLine = ( id: string ) => id.startsWith( "loan:" );

/** Turn goals + borrowed loans into plan lines. Current amounts come from linked accounts / repayments. */
export function buildPlanLines( goals: Goal[], accounts: AccountWithGoal[], loans: LoanWithPayments[] ): PlanLine[] {
    const lines: PlanLine[] = [];
    for ( const l of loans ) {
        if ( l.status !== "ACTIVE" || l.direction !== "BORROWED" || loanOutstanding( l ) <= 0 ) continue;
        lines.push( { id: loanLineId( l.id ), name: `Repay ${l.counterparty}`, emoji: "💳", kind: "debt", target: l.principal, current: loanPaid( l ), monthly: l.emi ?? 0, overflowId: l.overflowGoalId, priority: 0 } );
    }
    for ( const g of goals ) {
        if ( g.status !== "ACTIVE" ) continue;
        const linked = accounts.filter( a => a.goalId === g.id && !a.archived );
        const current = linked.reduce( ( s, a ) => s + a.balance, 0 );
        const sip = linked.reduce( ( s, a ) => s + ( a.sipAmount ?? 0 ), 0 );
        lines.push( { id: g.id, name: g.name, emoji: g.emoji ?? GOAL_KINDS[ g.kind ].emoji, kind: g.kind === "WEALTH" ? "wealth" : "goal", target: g.target, current, monthly: g.monthlyPlan ?? sip, overflowId: g.overflowGoalId, priority: g.priority } );
    }
    return lines;
}

export const surplusOf = ( s: Pick<Settings, "monthlyIncome" | "monthlyExpense"> | null | undefined ) =>
    Math.max( 0, ( s?.monthlyIncome ?? 0 ) - ( s?.monthlyExpense ?? 0 ) );
