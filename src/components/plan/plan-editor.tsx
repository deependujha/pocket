"use client";

import { useActionState, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ChevronRight, RotateCcw, Sparkles } from "lucide-react";
import { savePlan } from "@/actions/plan";
import type { ActionResult } from "@/actions/_shared";
import { useRefresh } from "@/components/shell/data-provider";
import { monthLabel, normalise, rebalance, simulatePlan, spanLabel, suggestShares, type DebtLine, type GoalLine, type Phase, type Shares } from "@/lib/plan";
import { inr, inrCompact } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { FormError, SubmitButton, MoneyInput } from "@/components/ui/form-bits";
import { Section } from "@/components/ui/page";
import { cn } from "@/lib/utils";

const COLORS = [ "var(--viz-1)", "var(--viz-3)", "var(--viz-4)", "var(--viz-5)", "var(--viz-2)", "var(--viz-8)", "var(--viz-muted)" ];

export function PlanEditor( { surplus, debts, goals, saved }: { surplus: number; debts: DebtLine[]; goals: GoalLine[]; saved: Shares[] } ) {
    const [ phases, setPhases ] = useState<Shares[]>( () => saved.length ? saved : [ suggestShares( goals ) ] );
    const [ debtMonthly, setDebtMonthly ] = useState<Record<string, number>>( () => Object.fromEntries( debts.map( d => [ d.id, d.monthly ] ) ) );
    const refresh = useRefresh();

    const liveDebts = useMemo( () => debts.map( d => ( { ...d, monthly: debtMonthly[ d.id ] ?? 0 } ) ), [ debts, debtMonthly ] );
    const result = useMemo( () => simulatePlan( surplus, liveDebts, goals, phases ), [ surplus, liveDebts, goals, phases ] );
    const byId = useMemo( () => Object.fromEntries( goals.map( g => [ g.id, g ] ) ), [ goals ] );
    const color = ( id: string ) => COLORS[ Math.max( 0, goals.findIndex( g => g.id === id ) ) % COLORS.length ];

    const [ state, action ] = useActionState( async ( prev: ActionResult | null, fd: FormData ) => {
        const r = await savePlan( prev, fd );
        if ( r.ok ) { toast.success( "Plan saved" ); refresh(); }
        return r;
    }, null );

    const setShare = ( phaseIdx: number, ids: string[], id: string, value: number ) =>
        setPhases( ps => ps.map( ( p, i ) => i === phaseIdx ? rebalance( normalise( p, ids ), ids, id, value ) : p ) );
    const decide = ( phase: Phase ) => setPhases( ps => { const next = ps.slice( 0, phase.index - 1 ); next[ phase.index - 1 ] = { ...phase.shares }; return next; } );
    const undo = ( phaseIdx: number ) => setPhases( ps => ps.slice( 0, phaseIdx ) );
    const suggest = ( phaseIdx: number, ids: string[] ) => setPhases( ps => ps.map( ( p, i ) => i === phaseIdx ? suggestShares( goals.filter( g => ids.includes( g.id ) ) ) : p ) );

    // Decided phases, plus the first one that needs a decision. Later ones wait their turn.
    const firstOpen = result.phases.findIndex( p => !p.decided );
    const visible = firstOpen === -1 ? result.phases : result.phases.slice( 0, firstOpen + 1 );
    const hidden = result.phases.length - visible.length;

    const payload = JSON.stringify( { phases: result.phases.filter( p => p.decided ).map( ( p, i ) => phases[ i ] ?? p.shares ), debts: debtMonthly } );
    const attention = result.issues.filter( i => i.kind !== "no-surplus" );

    return (
        <form action={ action } className="space-y-5">
            <input type="hidden" name="plan" value={ payload } />

            <div className="card p-4">
                <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted-foreground">Surplus</span>
                    <span className="tabular text-2xl font-semibold">{ inr( surplus ) }</span>
                </div>
                { liveDebts.length > 0 && (
                    <div className="mt-1 flex items-baseline justify-between text-sm">
                        <span className="text-muted-foreground">Debt payments</span>
                        <span className="tabular text-status-critical-text">− { inr( result.debtMonthly ) }</span>
                    </div>
                ) }
                <div className="mt-1 flex items-baseline justify-between border-t border-border pt-2 text-sm">
                    <span className="text-muted-foreground">To split</span>
                    <span className="tabular font-medium">{ inr( result.pool ) }</span>
                </div>
            </div>

            { attention.length > 0 && (
                <div className="rounded-2xl border border-status-warning/40 bg-status-warning/10 px-4 py-3 text-sm">
                    { attention.map( ( i, k ) => <div key={ k } className="flex items-start gap-2"><AlertTriangle size={ 15 } className="mt-0.5 shrink-0 text-status-warning-text" /><span>{ i.text }</span></div> ) }
                </div>
            ) }

            { liveDebts.length > 0 && (
                <Section title="Clear first" hint="Paid before anything is split.">
                    <ul className="card divide-y divide-border">
                        { liveDebts.map( d => {
                            const m = result.debtClearMonth[ d.id ];
                            return (
                                <li key={ d.id } className="flex items-center gap-3 px-4 py-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-medium">Repay { d.name }</div>
                                        <div className="text-xs text-muted-foreground">{ inrCompact( d.outstanding ) } left · { m == null ? "never at this rate" : m === 0 ? "cleared" : `cleared ${monthLabel( m )}` }</div>
                                    </div>
                                    <div className="w-32"><MoneyInput name={ `d:${d.id}` } defaultValue={ d.monthly } min={ 0 } onChange={ v => setDebtMonthly( x => ( { ...x, [ d.id ]: v } ) ) } /></div>
                                </li>
                            );
                        } ) }
                    </ul>
                </Section>
            ) }

            { goals.length === 0 ? (
                <div className="card p-4 text-sm text-muted-foreground">No active goals to split between.</div>
            ) : visible.map( ( ph, idx ) => {
                const ids = ph.goals;
                const ends = ph.endsWith ? byId[ ph.endsWith ] : null;
                const onlyWealth = ids.length === 1 && byId[ ids[ 0 ] ]?.isWealth;
                return (
                    <Section key={ ph.index } title={ `Phase ${ph.index}` }
                        hint={ `${ph.fromMonth === 0 ? "Now" : monthLabel( ph.fromMonth )}${ph.toMonth != null ? ` to ${monthLabel( ph.toMonth )}` : " onward"}${ph.toMonth != null ? ` · ${spanLabel( ph.toMonth - ph.fromMonth )}` : ""}` }
                        action={ ph.decided && !onlyWealth ? (
                            <div className="flex gap-1">
                                <Button type="button" variant="ghost" size="sm" className="h-7 rounded-full px-2 text-xs" onClick={ () => suggest( idx, ids ) }><Sparkles size={ 13 } /> Suggest</Button>
                                { idx > 0 && <Button type="button" variant="ghost" size="sm" className="h-7 rounded-full px-2 text-xs" onClick={ () => undo( idx ) }><RotateCcw size={ 13 } /> Undo</Button> }
                            </div>
                        ) : null }>
                        <div className={ cn( "card p-4", !ph.decided && "border-dashed" ) }>
                            { !ph.decided && !onlyWealth && (
                                <p className="mb-3 text-sm">
                                    <span className="font-medium">Your call.</span> { byId[ result.phases[ idx - 1 ]?.endsWith ?? "" ]?.name ?? "A goal" } is full around { monthLabel( ph.fromMonth ) }. Same split, carried forward. Adjust after deciding.
                                </p>
                            ) }
                            <ShareBar shares={ ph.shares } ids={ ids } color={ color } />
                            <ul className="mt-3 space-y-2.5">
                                { ids.map( id => {
                                    const g = byId[ id ];
                                    const pct = ph.shares[ id ] ?? 0;
                                    const done = result.doneMonth[ id ];
                                    const when = g.isWealth ? "no end" : done == null ? ( pct > 0 ? "not reached" : "no share" ) : done === 0 ? "full" : `full ${monthLabel( done )}`;
                                    return (
                                        <li key={ id }>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={ { background: color( id ) } } />
                                                <span className="min-w-0 flex-1 truncate">{ g.emoji } { g.name } <span className="text-xs text-muted-foreground">· { when }</span></span>
                                                <span className="tabular text-xs text-muted-foreground">{ inrCompact( ph.amounts[ id ] ?? 0 ) }</span>
                                                <span className="w-10 text-right tabular font-semibold">{ pct }%</span>
                                            </div>
                                            { ph.decided && !onlyWealth && (
                                                <input type="range" min={ 0 } max={ 100 } step={ 1 } value={ pct } aria-label={ `${g.name} share` }
                                                    onChange={ e => setShare( idx, ids, id, Number( e.target.value ) ) }
                                                    className="mt-0.5 h-5 w-full cursor-pointer" style={ { accentColor: color( id ) } } />
                                            ) }
                                        </li>
                                    );
                                } ) }
                            </ul>
                            <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><ChevronRight size={ 13 } />{ ends ? `Ends when ${ends.name} is full` : onlyWealth ? "Everything else is done." : "Runs until a goal fills." }</span>
                                { !ph.decided && !onlyWealth && <Button type="button" size="sm" className="h-8 rounded-full" onClick={ () => decide( ph ) }>Decide this phase</Button> }
                            </div>
                        </div>
                    </Section>
                );
            } ) }

            { hidden > 0 && <p className="px-1 text-xs text-muted-foreground">{ hidden } more phase{ hidden === 1 ? "" : "s" } after that. Decide each when its turn comes.</p> }

            <FormError error={ state && !state.ok ? state.error : null } />
            <SubmitButton>Save plan</SubmitButton>
        </form>
    );
}

function ShareBar( { shares, ids, color }: { shares: Shares; ids: string[]; color: ( id: string ) => string } ) {
    return (
        <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-[var(--viz-track)]" role="img" aria-label="Split">
            { ids.map( id => ( shares[ id ] ?? 0 ) > 0 && <div key={ id } style={ { width: `${shares[ id ]}%`, background: color( id ) } } className="transition-[width] duration-200" /> ) }
        </div>
    );
}
