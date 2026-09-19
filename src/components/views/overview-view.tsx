"use client";

import { ArrowRight, Plus } from "lucide-react";
import { useData } from "@/components/shell/data-provider";
import { NavLink, type View } from "@/lib/view";
import { goalProgress, healthScore, netWorthHistory, summarize, loanOutstanding, fdMaturityValue } from "@/lib/finance";
import { inr, inrCompact, inrDelta, fmtDate, relativeDays, daysBetween } from "@/lib/money";
import { GOAL_KINDS } from "@/lib/constants";
import { Section } from "@/components/ui/page";
import { Status, type Tone } from "@/components/ui/status";
import { Meter } from "@/components/ui/meter";
import { HealthRing } from "@/components/charts/health-ring";
import { AllocationBar } from "@/components/charts/allocation-bar";
import { TrendArea } from "@/components/charts/area-chart";
import { HealthBreakdown } from "@/components/overview/health-breakdown";
import { PlanCard } from "@/components/overview/plan-card";
import { buildPlanLines, surplusOf } from "@/lib/plan-lines";
import { simulatePlan } from "@/lib/plan";

const greeting = ( h: number ) => ( h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening" );
const bandTone: Record<string, Tone> = { secure: "good", stable: "good", building: "warning", fragile: "critical" };

export function OverviewView() {
    const { data: { accounts: allAccounts, goals, loans, movements, settings }, user } = useData();
    const accounts = allAccounts.filter( a => !a.archived );
    const s = summarize( accounts, loans, settings );
    const progress = goals.map( g => goalProgress( g, accounts ) );
    const health = healthScore( s, settings, progress );
    const history = netWorthHistory( accounts, movements, loans );
    const planLines = buildPlanLines( goals, accounts, loans );
    const plan = simulatePlan( planLines, surplusOf( settings ) );
    const now = new Date();
    const monthAgo = now.getTime() - 30 * 86400000;
    const base = history.find( p => p.date >= monthAgo ) ?? history[ 0 ];
    const delta = base ? s.netWorth - base.value : 0;

    const activeGoals = progress.filter( p => p.goal.status === "ACTIVE" ).slice( 0, 4 );
    const soon = ( d: Date | null | undefined, days: number ) => !!d && daysBetween( now, d ) <= days && daysBetween( now, d ) >= -30;

    const upcoming: { key: string; when: Date; title: string; sub: string; to: View }[] = [];
    for ( const a of accounts ) {
        if ( a.maturityDate && soon( a.maturityDate, 60 ) ) {
            const mv = a.interestRate && a.startDate ? fdMaturityValue( a.invested ?? a.balance, a.interestRate, a.startDate, a.maturityDate ) : a.balance;
            upcoming.push( { key: `a${a.id}`, when: a.maturityDate, title: `${a.name} matures`, sub: `≈ ${inr( mv )}`, to: { tab: "money", id: a.id } } );
        }
    }
    for ( const l of loans ) {
        if ( l.status === "ACTIVE" && l.dueDate && soon( l.dueDate, 45 ) ) {
            upcoming.push( { key: `l${l.id}`, when: l.dueDate, title: l.direction === "LENT" ? `${l.counterparty} owes you` : `Repay ${l.counterparty}`, sub: `${inr( loanOutstanding( l ) )} outstanding`, to: { tab: "money", sub: "loans", id: l.id } } );
        }
    }
    for ( const p of progress ) {
        if ( p.goal.status === "ACTIVE" && p.goal.targetDate && soon( p.goal.targetDate, 60 ) ) {
            upcoming.push( { key: `g${p.goal.id}`, when: p.goal.targetDate, title: `${p.goal.emoji ?? ""} ${p.goal.name}`.trim(), sub: p.remaining > 0 ? `${inr( p.remaining )} short` : "Fully funded", to: { tab: "goals", id: p.goal.id } } );
        }
    }
    upcoming.sort( ( a, b ) => a.when.getTime() - b.when.getTime() );

    return (
        <div>
            <div className="pt-2 pb-5">
                <p className="text-sm text-muted-foreground">{ greeting( now.getHours() ) }{ user.name ? `, ${user.name.split( " " )[ 0 ]}` : "" }</p>
                <div className="mt-1 flex items-baseline gap-3">
                    <h1 className="text-[40px] font-semibold leading-none tracking-tight">{ inr( s.netWorth ) }</h1>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="text-muted-foreground">Net worth</span>
                    { history.length > 1 && (
                        <span className={ delta >= 0 ? "text-status-good-text" : "text-status-critical-text" }>{ inrDelta( delta ) } in 30 days</span>
                    ) }
                    <span className="text-muted-foreground/75">·</span>
                    <span className="text-muted-foreground">Own { inrCompact( s.assets ) }</span>
                    { s.liabilities > 0 && <span className="text-muted-foreground">· Owe { inrCompact( s.liabilities ) }</span> }
                </div>
            </div>

            <Section>
                <div className="card p-5">
                    <div className="flex items-center gap-5">
                        <HealthRing score={ health.score } tone={ bandTone[ health.band ] } label={ health.bandLabel } />
                        <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">How secure am I?</div>
                            <div className="mt-1 text-2xl font-semibold tracking-tight">{ health.bandLabel }</div>
                            <div className="mt-1.5"><Status tone={ bandTone[ health.band ] }>{ s.runwayMonths != null ? `${s.runwayMonths.toFixed( 1 )} months of runway` : "Set expenses to see runway" }</Status></div>
                            <p className="mt-2 text-sm text-muted-foreground">{ health.components.filter( c => c.points < c.max ).sort( ( a, b ) => ( b.max - b.points ) - ( a.max - a.points ) )[ 0 ]?.tip ?? "Everything is in order. Keep going." }</p>
                        </div>
                    </div>
                    <HealthBreakdown components={ health.components } />
                </div>
            </Section>

            <Section>
                <PlanCard result={ plan } lines={ planLines } />
            </Section>

            <Section title="Where the money is" hint="Every rupee has one job.">
                <div className="card p-5">
                    <AllocationBar buckets={ s.buckets } total={ s.assets } />
                    { s.liabilities > 0 && (
                        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
                            <span className="text-foreground/75">Owed (card { inrCompact( s.creditCardDue ) } · loans { inrCompact( s.borrowed ) })</span>
                            <span className="tabular font-medium text-status-critical-text">−{ inrCompact( s.liabilities ) }</span>
                        </div>
                    ) }
                </div>
            </Section>

            <Section title="Net worth over time">
                <div className="card p-4 pl-3">
                    <TrendArea data={ history } id="nw" />
                </div>
            </Section>

            <Section title="Goals" action={ <NavLink to={ { tab: "goals" } } className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">All <ArrowRight size={ 14 } /></NavLink> }>
                { activeGoals.length === 0 ? (
                    <NavLink to={ { tab: "goals" } } className="card flex items-center gap-3 p-4 text-sm text-foreground/75 hover:bg-muted/60"><Plus size={ 18 } className="text-muted-foreground/75" /> Add your first goal — a gift, a trip, a phone.</NavLink>
                ) : (
                    <ul className="card divide-y divide-border">
                        { activeGoals.map( p => (
                            <li key={ p.goal.id }>
                                <NavLink to={ { tab: "goals", id: p.goal.id } } className="block px-4 py-3 hover:bg-muted/60">
                                    <div className="flex items-center justify-between gap-3 text-sm">
                                        <span className="truncate font-medium">{ p.goal.emoji ?? GOAL_KINDS[ p.goal.kind ].emoji } { p.goal.name }</span>
                                        <span className="shrink-0 tabular text-muted-foreground">{ inrCompact( p.current ) } <span className="text-muted-foreground/45">/</span> { inrCompact( p.target ) }</span>
                                    </div>
                                    <Meter value={ p.pct } marker={ p.expectedPct } className="mt-2" height={ 6 } color={ p.goal.kind === "EMERGENCY" || p.goal.kind === "HEALTH" ? "var(--viz-1)" : p.goal.kind === "WEALTH" ? "var(--viz-2)" : "var(--viz-3)" } />
                                </NavLink>
                            </li>
                        ) ) }
                    </ul>
                ) }
            </Section>

            { upcoming.length > 0 && (
                <Section title="Coming up">
                    <ul className="card divide-y divide-border">
                        { upcoming.map( u => (
                            <li key={ u.key }>
                                <NavLink to={ u.to } className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/60">
                                    <div className="w-14 shrink-0 text-xs text-muted-foreground">{ relativeDays( u.when ) }</div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate font-medium">{ u.title }</div>
                                        <div className="text-xs text-muted-foreground">{ u.sub } · { fmtDate( u.when ) }</div>
                                    </div>
                                    <ArrowRight size={ 14 } className="text-muted-foreground/45" />
                                </NavLink>
                            </li>
                        ) ) }
                    </ul>
                </Section>
            ) }
        </div>
    );
}
