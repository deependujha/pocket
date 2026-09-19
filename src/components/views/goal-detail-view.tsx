"use client";

import { ChevronRight } from "lucide-react";
import { useData } from "@/components/shell/data-provider";
import { NavLink } from "@/lib/view";
import { goalProgress, goalProjectionSeries } from "@/lib/finance";
import { ACCOUNT_TYPES, GOAL_KINDS } from "@/lib/constants";
import { fmtDate, inr, inrCompact, relativeDays } from "@/lib/money";
import { PageHeader, Section, Stat, Empty } from "@/components/ui/page";
import { Badge } from "@/components/ui/badge";
import { Meter } from "@/components/ui/meter";
import { Status } from "@/components/ui/status";
import { GoalProjection } from "@/components/charts/goal-projection";
import { EditGoalButton, GoalActions } from "@/components/goals/goal-sheets";
import { AddAccountButton } from "@/components/accounts/account-sheets";
import { goalColor } from "@/components/goals/goal-card";

export function GoalDetailView( { id }: { id: string } ) {
    const { data: all } = useData();
    const goal = all.goals.find( g => g.id === id );
    if ( !goal ) return <div><PageHeader back={ { tab: "goals" } } title="Goal" /><Empty title="This goal no longer exists" /></div>;
    const accounts = all.accounts.filter( a => !a.archived );
    const p = goalProgress( goal, accounts );
    const series = goalProjectionSeries( p, all.movements );
    const linkable = accounts.map( a => ( { id: a.id, name: a.name, type: a.type, balance: a.balance, goalId: a.goalId, goalName: a.goal?.name } ) );
    const goalOpts = [ { id: goal.id, name: goal.name, emoji: goal.emoji } ];
    const goalOptsAll = all.goals.filter( g => g.status === "ACTIVE" ).map( g => ( { id: g.id, name: g.name, emoji: g.emoji } ) );
    const done = p.current >= goal.target;
    const overflow = goal.overflowGoalId ? all.goals.find( g => g.id === goal.overflowGoalId ) : null;

    return (
        <div>
            <PageHeader back={ { tab: "goals" } } title={ `${goal.emoji ?? GOAL_KINDS[ goal.kind ].emoji} ${goal.name}` }
                subtitle={ <span className="flex flex-wrap items-center gap-1.5"><Badge>{ GOAL_KINDS[ goal.kind ].label }</Badge>{ goal.forWhom && <Badge>for { goal.forWhom }</Badge> }<Badge tone={ goal.status === "ACHIEVED" ? "good" : "neutral" }>{ goal.status.toLowerCase() }</Badge></span> }
                action={ <EditGoalButton goal={ goal } accounts={ linkable } goals={ goalOptsAll } /> } />

            <div className="card p-5">
                <div className="flex items-baseline justify-between gap-3">
                    <div className="text-4xl font-semibold tracking-tight">{ inr( p.current ) }</div>
                    <div className="text-sm tabular text-muted-foreground">of { inr( goal.target ) }</div>
                </div>
                <Meter value={ p.pct } marker={ p.expectedPct } className="mt-4" height={ 10 } color={ goalColor( goal.kind ) } />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">{ Math.round( p.pct * 100 ) }% · { done ? "fully funded 🎉" : `${inr( p.remaining )} to go` }</span>
                    { !done && goal.status === "ACTIVE" && ( p.neededPerMonth != null
                        ? <Status tone={ p.onTrack ? "good" : "serious" }>{ p.onTrack ? "On track" : "Behind plan" }</Status>
                        : p.monthly > 0 ? <Status tone="good">Saving { inrCompact( p.monthly ) }/mo</Status> : <Status tone="warning">No monthly plan</Status> ) }
                </div>
                { p.expectedPct != null && !done && <p className="mt-1 text-xs text-muted-foreground/75">The dark tick is where you&apos;d be if you saved evenly from the day you set the goal.</p> }
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
                { goal.targetDate && <Stat label="Deadline" value={ relativeDays( goal.targetDate ) } sub={ fmtDate( goal.targetDate ) } /> }
                { goal.trigger && !goal.targetDate && <Stat label="When" value={ <span className="text-base">{ goal.trigger }</span> } /> }
                { p.neededPerMonth != null && !done && <Stat label="Needed per month" value={ inr( p.neededPerMonth ) } sub={ p.monthly > 0 ? `You plan ${inr( p.monthly )}` : "Set a monthly plan" } /> }
                { p.neededPerMonth == null && p.monthly > 0 && !done && <Stat label="Monthly plan" value={ inr( p.monthly ) } sub={ p.projectedDate ? `Done by ~${fmtDate( p.projectedDate, { month: "short", year: "numeric" } )}` : undefined } /> }
                { p.projectedDate && p.neededPerMonth != null && !done && <Stat label="At current pace" value={ fmtDate( p.projectedDate, { month: "short", year: "numeric" } ) } sub={ goal.targetDate && p.projectedDate > goal.targetDate ? "Later than the deadline" : "Before the deadline" } /> }
                { goal.kind !== "WEALTH" && <Stat label="When funded, money goes to" value={ <span className="text-base">{ overflow ? `${overflow.emoji ?? ""} ${overflow.name}`.trim() : "Long-term wealth" }</span> } sub={ <NavLink to={ { tab: "plan" } } className="text-primary underline-offset-2 hover:underline">Change in Plan</NavLink> } /> }
            </div>

            { goal.note && <p className="mt-4 rounded-xl bg-card px-4 py-3 text-sm italic text-foreground/75 ring-1 ring-border">“{ goal.note }”</p> }

            <Section title="Path to target" className="mt-6">
                <div className="card p-4 pl-3"><GoalProjection data={ series } target={ goal.target } targetDate={ goal.targetDate?.getTime() } /></div>
            </Section>

            <Section title="Funded by" action={ <AddAccountButton goals={ goalOpts } defaultGoalId={ goal.id } label="Add FD / account" variant="outline" /> }>
                { p.accounts.length === 0 ? (
                    <div className="card p-4 text-sm text-muted-foreground">Nothing funds this goal yet. Open an FD or RD for it, or tick an existing account under Edit.</div>
                ) : (
                    <ul className="card divide-y divide-border">
                        { p.accounts.map( a => (
                            <li key={ a.id }>
                                <NavLink to={ { tab: "money", id: a.id } } className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/60">
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate font-medium">{ a.name } <span className="text-xs text-muted-foreground/75">{ ACCOUNT_TYPES[ a.type ].short }</span></div>
                                        <div className="text-xs text-muted-foreground">{ a.maturityDate ? `matures ${fmtDate( a.maturityDate )}` : a.sipAmount ? `${inrCompact( a.sipAmount )}/mo` : ACCOUNT_TYPES[ a.type ].label }</div>
                                    </div>
                                    <div className="tabular font-semibold">{ inr( a.balance ) }</div>
                                    <ChevronRight size={ 16 } className="text-muted-foreground/45" />
                                </NavLink>
                            </li>
                        ) ) }
                    </ul>
                ) }
            </Section>

            <Section title="Manage"><GoalActions goal={ goal } /></Section>
        </div>
    );
}
