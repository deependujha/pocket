"use client";

import { ArrowRight } from "lucide-react";
import { NavLink } from "@/lib/view";
import type { PlanResult, GoalLine, DebtLine } from "@/lib/plan";
import { monthLabel } from "@/lib/plan";
import { inr, inrCompact } from "@/lib/money";

const COLORS = [ "var(--viz-1)", "var(--viz-3)", "var(--viz-4)", "var(--viz-5)", "var(--viz-2)", "var(--viz-8)", "var(--viz-muted)" ];

export function PlanCard( { result, goals, debts }: { result: PlanResult; goals: GoalLine[]; debts: DebtLine[] } ) {
    const ph = result.phases[ 0 ];
    const byId = Object.fromEntries( goals.map( g => [ g.id, g ] ) );
    const rows = ph ? ph.goals.filter( id => ( ph.amounts[ id ] ?? 0 ) > 0 ).sort( ( a, b ) => ph.amounts[ b ] - ph.amounts[ a ] ) : [];
    const ends = ph?.endsWith ? byId[ ph.endsWith ] : null;
    return (
        <NavLink to={ { tab: "plan" } } className="card block p-4 hover:bg-muted/40">
            <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">This month</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">Plan <ArrowRight size={ 12 } /></span>
            </div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">{ inr( result.surplus ) }</div>
            { result.debtMonthly > 0 && <div className="text-xs text-muted-foreground">{ inrCompact( result.debtMonthly ) } to { debts.map( d => d.name ).join( ", " ) } first</div> }
            { rows.length > 0 ? (
                <>
                    <div className="mt-3 flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-[var(--viz-track)]">
                        { rows.map( id => <div key={ id } style={ { width: `${ph.shares[ id ]}%`, background: COLORS[ goals.findIndex( g => g.id === id ) % COLORS.length ] } } /> ) }
                    </div>
                    <ul className="mt-2 space-y-1 text-sm">
                        { rows.slice( 0, 4 ).map( id => (
                            <li key={ id } className="flex items-center gap-1.5">
                                <span className="text-base leading-none">{ byId[ id ]?.emoji }</span>
                                <span className="min-w-0 flex-1 truncate text-foreground/80">{ byId[ id ]?.name }</span>
                                <span className="tabular font-medium">{ inrCompact( ph.amounts[ id ] ) }</span>
                            </li>
                        ) ) }
                    </ul>
                    { ends && ph.toMonth != null && <p className="mt-2 text-xs text-muted-foreground">{ ends.name } full by { monthLabel( ph.toMonth ) }{ result.phases[ 1 ] && !result.phases[ 1 ].decided ? ". Phase 2 needs your call." : "" }</p> }
                </>
            ) : <p className="mt-2 text-sm text-muted-foreground">No split yet. Tap to set one.</p> }
        </NavLink>
    );
}
