import { NavLink } from "@/lib/view";
import { ArrowRight } from "lucide-react";
import type { PlanResult, PlanLine } from "@/lib/plan";
import { monthLabel, spanLabel } from "@/lib/plan";
import { inr, inrCompact } from "@/lib/money";

export function PlanCard( { result, lines }: { result: PlanResult; lines: PlanLine[] } ) {
    const byId = Object.fromEntries( lines.map( l => [ l.id, l ] ) );
    const phase = result.phases[ 0 ];
    const active = phase.allocations.filter( a => a.amount > 0 ).sort( ( a, b ) => b.amount - a.amount );
    const next = result.phases.length > 1 ? result.phases[ 0 ] : null;
    return (
        <NavLink to={ { tab: "plan" } } className="card block p-5 hover:bg-muted/40">
            <div className="flex items-baseline justify-between gap-3">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">This month</div>
                    <div className="mt-1 text-2xl font-semibold tracking-tight">{ inr( result.surplus ) } <span className="text-base font-normal text-muted-foreground">to put away</span></div>
                </div>
                <ArrowRight size={ 16 } className="text-muted-foreground/60" />
            </div>
            { active.length > 0 ? (
                <div className="mt-3 flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full">
                    { active.map( ( a, i ) => <div key={ a.id } style={ { width: `${( a.amount / Math.max( result.surplus, result.allocated ) ) * 100}%`, background: `color-mix(in oklab, var(--primary) ${100 - i * 18}%, var(--viz-track))` } } title={ byId[ a.id ]?.name } /> ) }
                </div>
            ) : (
                <p className="mt-3 text-sm text-muted-foreground">No split yet. Tap to plan where the surplus goes.</p>
            ) }
            { active.length > 0 && (
                <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    { active.slice( 0, 6 ).map( a => (
                        <li key={ a.id } className="flex items-center gap-1.5">
                            <span className="text-base leading-none">{ byId[ a.id ]?.emoji }</span>
                            <span className="min-w-0 flex-1 truncate text-foreground/80">{ byId[ a.id ]?.name }</span>
                            <span className="tabular font-medium">{ inrCompact( a.amount ) }</span>
                        </li>
                    ) ) }
                </ul>
            ) }
            { next && next.endsBecause && (
                <p className="mt-3 border-t border-border pt-2.5 text-xs text-muted-foreground">Phase 1 of { result.phases.length } · { next.endsBecause } by { monthLabel( next.toMonth ) } ({ spanLabel( next.toMonth ) })</p>
            ) }
        </NavLink>
    );
}
