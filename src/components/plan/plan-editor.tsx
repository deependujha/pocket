"use client";

import { useActionState, useMemo, useState } from "react";
import { toast } from "sonner";
import { Sparkles, ArrowRight, ChevronRight } from "lucide-react";
import { savePlan } from "@/actions/plan";
import { useRefresh } from "@/components/shell/data-provider";
import { NavLink } from "@/lib/view";
import type { ActionResult } from "@/actions/_shared";
import { simulatePlan, suggestSplit, monthLabel, spanLabel, type PlanLine } from "@/lib/plan";
import { isLoanLine } from "@/lib/plan-lines";
import { inr, inrCompact } from "@/lib/money";
import { Meter } from "@/components/ui/meter";
import { Status } from "@/components/ui/status";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormError, SubmitButton, inputCls } from "@/components/ui/form-bits";
import { Section } from "@/components/ui/page";
import { cn } from "@/lib/utils";

type GoalOption = { id: string; name: string; emoji: string | null };

export function PlanEditor( { lines, surplus, income, expense, goalOptions, note }: {
    lines: PlanLine[]; surplus: number; income: number; expense: number; goalOptions: GoalOption[]; note: string;
} ) {
    const [ monthly, setMonthly ] = useState<Record<string, number>>( () => Object.fromEntries( lines.map( l => [ l.id, l.monthly ] ) ) );
    const [ overflow, setOverflow ] = useState<Record<string, string>>( () => Object.fromEntries( lines.map( l => [ l.id, l.overflowId ?? "" ] ) ) );

    const live = useMemo( () => lines.map( l => ( { ...l, monthly: monthly[ l.id ] ?? 0, overflowId: overflow[ l.id ] || null } ) ), [ lines, monthly, overflow ] );
    const result = useMemo( () => simulatePlan( live, surplus ), [ live, surplus ] );
    const byId = useMemo( () => Object.fromEntries( lines.map( l => [ l.id, l ] ) ), [ lines ] );

    const refresh = useRefresh();
    const [ state, action ] = useActionState( async ( prev: ActionResult | null, fd: FormData ) => {
        const r = await savePlan( prev, fd );
        if ( r.ok ) { toast.success( "Plan saved" ); refresh(); }
        return r;
    }, null );

    const applySuggestion = () => setMonthly( m => ( { ...m, ...suggestSplit( live, surplus ) } ) );
    const over = result.unallocated < 0;
    const sinkName = result.sinkId ? byId[ result.sinkId ]?.name : null;

    return (
        <form action={ action } className="space-y-6">
            {/* Surplus */ }
            <div className="card p-5">
                <div className="flex items-baseline justify-between">
                    <div>
                        <div className="text-xs text-muted-foreground">Monthly surplus</div>
                        <div className="mt-0.5 text-3xl font-semibold tracking-tight">{ inr( surplus ) }</div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                        <div>{ inrCompact( income ) } take-home</div>
                        <div>− { inrCompact( expense ) } expenses</div>
                    </div>
                </div>
                <Meter value={ surplus > 0 ? result.allocated / surplus : 0 } className="mt-4" height={ 8 } color={ over ? "var(--status-critical)" : "var(--primary)" } />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">{ inr( result.allocated ) } assigned</span>
                    { over
                        ? <Status tone="critical">Over by { inrCompact( -result.unallocated ) }</Status>
                        : result.unallocated > 0
                            ? <Status tone="neutral">{ inrCompact( result.unallocated ) } unassigned{ sinkName ? ` → goes to ${sinkName}` : "" }</Status>
                            : <Status tone="good">Every rupee has a job</Status> }
                </div>
            </div>

            {/* Lines */ }
            <Section title="Monthly split" hint="Edit any amount. Phases below update as you type."
                action={ <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={ applySuggestion }><Sparkles size={ 14 } /> Suggest a split</Button> }>
                { lines.length === 0 ? (
                    <div className="card p-4 text-sm text-muted-foreground">No active goals or debts. <NavLink to={ { tab: "goals" } } className="text-primary underline-offset-2 hover:underline">Add a goal</NavLink> first.</div>
                ) : (
                    <ul className="card divide-y divide-border">
                        { live.map( l => {
                            const o = result.outcomes[ l.id ];
                            const pct = l.kind === "wealth" ? 0 : l.target > 0 ? l.current / l.target : 0;
                            const href = isLoanLine( l.id ) ? { tab: "money" as const, sub: "loans" as const, id: l.id.slice( 5 ) } : { tab: "goals" as const, id: l.id };
                            const flowing = result.phases[ 0 ].allocations.find( a => a.id === l.id )?.amount ?? 0;
                            return (
                                <li key={ l.id } className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <NavLink to={ href } className="flex min-w-0 flex-1 items-center gap-2">
                                            <span className="text-lg leading-none">{ l.emoji }</span>
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm font-medium">{ l.name }</span>
                                                <span className="block text-xs text-muted-foreground">
                                                    { l.kind === "wealth" ? "No target · keeps compounding" : `${inrCompact( l.current )} of ${inrCompact( l.target )}` }
                                                    { l.kind === "debt" && " repaid" }
                                                </span>
                                            </span>
                                        </NavLink>
                                        <div className="relative w-32">
                                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                                            <input type="number" inputMode="numeric" min={ 0 } step={ 100 } name={ `m:${l.id}` } value={ monthly[ l.id ] ?? 0 }
                                                onChange={ e => setMonthly( m => ( { ...m, [ l.id ]: Math.min( 100000000, Math.max( 0, Math.round( Number( e.target.value ) || 0 ) ) ) } ) ) }
                                                className={ cn( inputCls, "pl-7 tabular text-right" ) } aria-label={ `Monthly for ${l.name}` } />
                                        </div>
                                    </div>
                                    { l.kind !== "wealth" && <Meter value={ pct } className="mt-2.5" height={ 4 } color={ l.kind === "debt" ? "var(--viz-8)" : "var(--viz-3)" } /> }
                                    <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 text-xs">
                                        <span className="text-muted-foreground">
                                            { l.kind === "wealth"
                                                ? <>Receives { inrCompact( flowing ) }/mo now → { inrCompact( o.finalMonthly ) }/mo once everything else is done</>
                                                : o.doneMonth == null
                                                    ? <Status tone="warning">Never funded at this pace</Status>
                                                    : o.doneMonth === 0
                                                        ? <Status tone="good">Already { l.kind === "debt" ? "cleared" : "funded" }</Status>
                                                        : <>{ l.kind === "debt" ? "Cleared" : "Funded" } by <b className="text-foreground">{ monthLabel( o.doneMonth ) }</b> · { spanLabel( o.doneMonth ) }{ flowing !== l.monthly ? ` (gets ${inrCompact( flowing )}/mo incl. overflow)` : "" }</> }
                                        </span>
                                        { l.kind !== "wealth" && (
                                            <label className="flex items-center gap-1.5 text-muted-foreground">
                                                then <ArrowRight size={ 12 } />
                                                <Select name={ `o:${l.id}` } value={ overflow[ l.id ] ?? "" } onChange={ e => setOverflow( x => ( { ...x, [ l.id ]: e.target.value } ) ) } className="h-7 w-44 rounded-lg py-0 text-xs">
                                                    <option value="">{ sinkName ? `${sinkName} · default` : "Unassigned" }</option>
                                                    { goalOptions.filter( g => g.id !== l.id ).map( g => <option key={ g.id } value={ g.id }>{ g.emoji ? `${g.emoji} ` : "" }{ g.name }</option> ) }
                                                </Select>
                                            </label>
                                        ) }
                                    </div>
                                </li>
                            );
                        } ) }
                    </ul>
                ) }
            </Section>

            {/* Phases */ }
            { lines.length > 0 && surplus > 0 && (
                <Section title="Phases" hint="Derived from the split above. When a line completes, its money moves on.">
                    <ol className="space-y-3">
                        { result.phases.map( ( ph, i ) => {
                            const last = i === result.phases.length - 1;
                            const active = ph.allocations.filter( a => a.amount > 0 ).sort( ( a, b ) => b.amount - a.amount );
                            return (
                                <li key={ ph.index } className="card p-4">
                                    <div className="flex items-baseline justify-between gap-3">
                                        <div className="font-semibold">Phase { ph.index }</div>
                                        <div className="text-xs text-muted-foreground">
                                            { ph.fromMonth === 0 ? "Now" : monthLabel( ph.fromMonth ) } → { last ? "onward" : monthLabel( ph.toMonth ) }
                                            { !last && <> · { spanLabel( ph.toMonth - ph.fromMonth ) }</> }
                                        </div>
                                    </div>
                                    <ul className="mt-3 space-y-1.5">
                                        { active.map( a => {
                                            const l = byId[ a.id ];
                                            const share = surplus > 0 ? a.amount / surplus : 0;
                                            return (
                                                <li key={ a.id } className="flex items-center gap-2 text-sm">
                                                    <span className="w-5 text-center">{ l?.emoji }</span>
                                                    <span className="min-w-0 flex-1 truncate">{ l?.name }</span>
                                                    <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-[var(--viz-track)] sm:block"><span className="block h-full rounded-full bg-primary" style={ { width: `${Math.min( 100, share * 100 )}%` } } /></span>
                                                    <span className="w-20 text-right tabular font-medium">{ inrCompact( a.amount ) }</span>
                                                    <span className="w-10 text-right text-xs tabular text-muted-foreground">{ Math.min( 999, Math.round( share * 100 ) ) }%</span>
                                                </li>
                                            );
                                        } ) }
                                    </ul>
                                    <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-2.5 text-xs text-muted-foreground">
                                        <ChevronRight size={ 13 } />
                                        { last ? ( result.phases.length > 1 ? "Everything else is done. This is the steady state." : "Nothing completes at this pace within 20 years." ) : `Ends when ${ph.endsBecause}` }
                                    </div>
                                </li>
                            );
                        } ) }
                    </ol>
                </Section>
            ) }

            <Section title="Why this split" hint="A note to your future self.">
                <Textarea name="planNote" defaultValue={ note } rows={ 3 } placeholder="e.g. Safety first, but never pause the SIPs. Once job-loss cover is done, push everything into health." />
            </Section>

            <FormError error={ state && !state.ok ? state.error : null } />
            <SubmitButton>Save plan</SubmitButton>
        </form>
    );
}
