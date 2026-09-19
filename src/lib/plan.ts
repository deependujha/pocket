/**
 * The Plan: how the monthly surplus is split, and what happens over time.
 *
 * Pure and fast enough to run on every keystroke in the editor.
 * Each line (a goal or a debt) has a monthly amount. When a line is fully funded,
 * its monthly amount is redirected to its overflow target (default: the long-term
 * wealth goal). The simulation walks month by month and records every
 * reallocation as a phase boundary — exactly the "Phase 1 / Phase 2 / Phase 3"
 * story, derived from your numbers rather than typed in.
 */

export type PlanLine = {
    id: string;
    name: string;
    emoji: string;
    kind: "goal" | "debt" | "wealth";
    target: number;        // amount to reach (goal) or outstanding to clear (debt); Infinity for wealth
    current: number;       // already there / already repaid
    monthly: number;       // ₹ per month assigned right now
    overflowId: string | null; // where the monthly goes once this is done (null = default sink)
    priority: number;      // 1..3, ordering only
};

export type Phase = {
    index: number;         // 1-based
    fromMonth: number;     // 0 = this month
    toMonth: number;       // inclusive; Infinity for the last phase
    allocations: { id: string; amount: number }[]; // effective monthly per line during this phase
    endsBecause: string | null; // "Job-loss cover fully funded"
};

export type LineOutcome = {
    id: string;
    doneMonth: number | null; // months from now until fully funded, null if never at this plan
    finalMonthly: number;     // what flows into it in the final phase
};

export type PlanResult = {
    surplus: number;
    allocated: number;     // sum of monthly assigned right now
    unallocated: number;   // surplus − allocated (negative = over-committed)
    phases: Phase[];
    outcomes: Record<string, LineOutcome>;
    horizonMonths: number;
    sinkId: string | null; // the default overflow target
};

export const MAX_MONTHS = 240;

export function simulatePlan( lines: PlanLine[], surplus: number ): PlanResult {
    const sink = lines.find( l => l.kind === "wealth" )?.id ?? null;
    const allocated = lines.reduce( ( s, l ) => s + Math.max( 0, l.monthly ), 0 );
    const unallocated = surplus - allocated;

    // effective monthly flow into each line right now
    const flow = new Map<string, number>();
    for ( const l of lines ) flow.set( l.id, Math.max( 0, l.monthly ) );
    // unassigned surplus also goes to the sink — money with no name still gets a job
    if ( sink && unallocated > 0 ) flow.set( sink, ( flow.get( sink ) ?? 0 ) + unallocated );

    const remaining = new Map<string, number>();
    for ( const l of lines ) remaining.set( l.id, l.kind === "wealth" ? Infinity : Math.max( 0, l.target - l.current ) );
    const done = new Set<string>( lines.filter( l => l.kind !== "wealth" && ( remaining.get( l.id ) ?? 0 ) <= 0 ).map( l => l.id ) );
    // anything already done redirects immediately
    const redirect = ( fromId: string ) => {
        const line = lines.find( l => l.id === fromId )!;
        let to = line.overflowId && !done.has( line.overflowId ) && line.overflowId !== fromId ? line.overflowId : sink;
        if ( to && done.has( to ) ) to = sink;
        const amt = flow.get( fromId ) ?? 0;
        flow.set( fromId, 0 );
        if ( to && to !== fromId ) flow.set( to, ( flow.get( to ) ?? 0 ) + amt );
    };
    for ( const id of done ) redirect( id );

    const snapshot = () => lines.map( l => ( { id: l.id, amount: Math.round( flow.get( l.id ) ?? 0 ) } ) );
    const phases: Phase[] = [ { index: 1, fromMonth: 0, toMonth: Infinity, allocations: snapshot(), endsBecause: null } ];
    const outcomes: Record<string, LineOutcome> = {};
    for ( const l of lines ) outcomes[ l.id ] = { id: l.id, doneMonth: done.has( l.id ) ? 0 : null, finalMonthly: 0 };

    const order = [ ...lines ].sort( ( a, b ) => ( a.kind === "debt" ? 0 : 1 ) - ( b.kind === "debt" ? 0 : 1 ) || a.priority - b.priority );

    for ( let m = 1; m <= MAX_MONTHS; m++ ) {
        const completedNow: string[] = [];
        // carry-over inside a month: a line that finishes mid-month passes the rest along
        let spill = new Map<string, number>();
        for ( const l of order ) {
            if ( l.kind === "wealth" || done.has( l.id ) ) continue;
            const inflow = ( flow.get( l.id ) ?? 0 ) + ( spill.get( l.id ) ?? 0 );
            const rem = remaining.get( l.id )!;
            if ( inflow <= 0 ) continue;
            if ( inflow >= rem ) {
                remaining.set( l.id, 0 );
                done.add( l.id );
                completedNow.push( l.id );
                const extra = inflow - rem;
                let to = l.overflowId && !done.has( l.overflowId ) ? l.overflowId : sink;
                if ( to && done.has( to ) ) to = sink;
                if ( to && extra > 0 ) spill.set( to, ( spill.get( to ) ?? 0 ) + extra );
            } else {
                remaining.set( l.id, rem - inflow );
            }
        }
        if ( completedNow.length ) {
            for ( const id of completedNow ) { outcomes[ id ].doneMonth = m; redirect( id ); }
            const last = phases[ phases.length - 1 ];
            last.toMonth = m;
            last.endsBecause = completedNow.map( id => `${lines.find( l => l.id === id )!.name} ${lines.find( l => l.id === id )!.kind === "debt" ? "cleared" : "fully funded"}` ).join( " · " );
            phases.push( { index: phases.length + 1, fromMonth: m, toMonth: Infinity, allocations: snapshot(), endsBecause: null } );
        }
        spill = new Map();
        if ( lines.every( l => l.kind === "wealth" || done.has( l.id ) ) ) break;
    }
    for ( const l of lines ) outcomes[ l.id ].finalMonthly = Math.round( flow.get( l.id ) ?? 0 );
    const horizonMonths = Math.max( 0, ...Object.values( outcomes ).map( o => o.doneMonth ?? 0 ) );
    return { surplus, allocated, unallocated, phases, outcomes, horizonMonths, sinkId: sink };
}

/**
 * A sensible starting split when nothing is set yet:
 * 40% to long-term wealth, 60% across the safety/fun lines in proportion to what's left to fund,
 * debts get their EMI (or 20% of surplus if none set). Everything is editable afterwards.
 */
export function suggestSplit( lines: PlanLine[], surplus: number ): Record<string, number> {
    const out: Record<string, number> = {};
    let left = surplus;
    for ( const l of lines.filter( l => l.kind === "debt" ) ) {
        const amt = l.monthly > 0 ? l.monthly : Math.round( surplus * 0.2 );
        out[ l.id ] = Math.min( amt, Math.max( 0, l.target - l.current ) );
        left -= out[ l.id ];
    }
    left = Math.max( 0, left );
    const wealth = lines.find( l => l.kind === "wealth" );
    const goals = lines.filter( l => l.kind === "goal" && l.target - l.current > 0 );
    const wealthShare = wealth ? Math.round( left * ( goals.length ? 0.4 : 1 ) ) : 0;
    if ( wealth ) out[ wealth.id ] = wealthShare;
    const pool = left - wealthShare;
    const need = goals.reduce( ( s, g ) => s + ( g.target - g.current ) / g.priority, 0 );
    for ( const g of goals ) out[ g.id ] = need > 0 ? Math.round( ( pool * ( ( g.target - g.current ) / g.priority ) ) / need / 100 ) * 100 : 0;
    return out;
}

export const monthLabel = ( monthsFromNow: number, from = new Date() ) => {
    const d = new Date( from );
    d.setMonth( d.getMonth() + monthsFromNow );
    return d.toLocaleDateString( "en-IN", { month: "short", year: "numeric" } );
};

export const spanLabel = ( months: number ) =>
    months < 1 ? "now" : months < 24 ? `${months} mo` : `${( months / 12 ).toFixed( 1 ).replace( /\.0$/, "" )} yr`;
