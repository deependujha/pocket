import { NavLink } from "@/lib/view";
import type { GoalProgress } from "@/lib/finance";
import { GOAL_KINDS } from "@/lib/constants";
import { fmtDate, inr, inrCompact, relativeDays } from "@/lib/money";
import { monthLabel, spanLabel } from "@/lib/plan";
import { Meter } from "@/components/ui/meter";
import { Status } from "@/components/ui/status";
import { Badge } from "@/components/ui/badge";

export const goalColor = ( kind: string ) => kind === "EMERGENCY" ? "var(--viz-1)" : kind === "WEALTH" ? "var(--viz-2)" : "var(--viz-3)";

export function GoalCard( { p, doneMonth = null }: { p: GoalProgress; doneMonth?: number | null } ) {
    const g = p.goal;
    const done = p.current >= g.target;
    return (
        <NavLink to={ { tab: "goals", id: g.id } } className="card block p-4 hover:bg-muted/60">
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-xl">{ g.emoji ?? GOAL_KINDS[ g.kind ].emoji }</div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{ g.name }</span>
                        { g.forWhom && g.forWhom !== "Me" && <Badge>for { g.forWhom }</Badge> }
                        { g.status !== "ACTIVE" && <Badge tone={ g.status === "ACHIEVED" ? "good" : "neutral" }>{ g.status.toLowerCase() }</Badge> }
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                        { g.targetDate ? <>{ fmtDate( g.targetDate ) } · { relativeDays( g.targetDate ) }</> : g.trigger ? <>when { g.trigger }</> : g.kind === "WEALTH" ? "No deadline" : "No date yet" }
                    </div>
                </div>
                <div className="text-right">
                    <div className="tabular font-semibold">{ inrCompact( p.current ) }</div>
                    <div className="text-xs tabular text-muted-foreground">of { inrCompact( g.target ) }</div>
                </div>
            </div>
            <Meter value={ p.pct } marker={ p.expectedPct } className="mt-3" color={ goalColor( g.kind ) } />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{ Math.round( p.pct * 100 ) }% · { done ? "fully funded" : `${inr( p.remaining )} to go` }</span>
                { g.status === "ACTIVE" && !done && doneMonth != null && doneMonth > 0 && (
                    <Status tone={ p.monthsLeft != null && doneMonth > p.monthsLeft ? "serious" : "good" } icon="clock">Plan: { monthLabel( doneMonth ) } · { spanLabel( doneMonth ) }</Status>
                ) }
                { g.status === "ACTIVE" && !done && ( doneMonth == null || doneMonth === 0 ) && (
                    p.neededPerMonth != null
                        ? <Status tone={ p.onTrack ? "good" : "serious" }>{ p.onTrack ? "On track" : `Needs ${inrCompact( p.neededPerMonth )}/mo` }</Status>
                        : p.projectedDate ? <Status tone="neutral" icon="clock">~{ fmtDate( p.projectedDate, { month: "short", year: "numeric" } ) } at { inrCompact( p.monthly ) }/mo</Status>
                            : p.monthly > 0 ? <Status tone="good">{ inrCompact( p.monthly ) }/mo, no deadline</Status>
                                : <Status tone="warning">No monthly plan</Status>
                ) }
                { done && <Status tone="good">Done</Status> }
            </div>
        </NavLink>
    );
}
