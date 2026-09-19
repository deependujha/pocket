/**
 * The plan.
 *
 * Debts come first: each borrowed loan takes its monthly payment off the top.
 * What's left (the pool) is split by percentages the user sets.
 * A phase ends when a goal fills up. The next phase is the user's call: until they
 * decide, the simulation carries the previous split forward among the goals still open
 * and marks that phase as "undecided".
 *
 * Pure and fast enough to run on every slider move.
 */

export type DebtLine = { id: string; name: string; outstanding: number; monthly: number };
export type GoalLine = { id: string; name: string; emoji: string; remaining: number; isWealth: boolean };
export type Shares = Record<string, number>; // goalId -> percent of the pool

export type Phase = {
    index: number;            // 1-based
    fromMonth: number;        // 0 = now
    toMonth: number | null;   // null = open-ended
    shares: Shares;           // effective split, percent, over goals open in this phase
    amounts: Record<string, number>; // ₹ per month per goal at the start of the phase
    pool: number;             // ₹ per month being split at the start of the phase
    decided: boolean;         // saved by the user, or carried forward as a suggestion
    endsWith: string | null;  // goal id that fills up and ends this phase
    goals: string[];          // goal ids open in this phase
};

export type PlanResult = {
    surplus: number;
    debtMonthly: number;
    pool: number;
    phases: Phase[];
    doneMonth: Record<string, number | null>;   // goal id -> months until full (0 = already)
    debtClearMonth: Record<string, number | null>;
    issues: { kind: "no-share" | "over" | "under" | "no-surplus"; phase: number; goalId?: string; text: string }[];
};

export const MAX_MONTHS = 240;

const round = ( n: number ) => Math.round( n );

/** Scale a share map so the given ids sum to 100 (ids absent get 0). Empty ids -> {}. */
export function normalise( shares: Shares, ids: string[] ): Shares {
    const out: Shares = {};
    const total = ids.reduce( ( s, id ) => s + Math.max( 0, shares[ id ] ?? 0 ), 0 );
    if ( ids.length === 0 ) return out;
    if ( total <= 0 ) { const eq = Math.floor( 100 / ids.length ); ids.forEach( ( id, i ) => out[ id ] = eq + ( i === 0 ? 100 - eq * ids.length : 0 ) ); return out; }
    let acc = 0;
    ids.forEach( ( id, i ) => {
        const v = i === ids.length - 1 ? 100 - acc : Math.round( ( Math.max( 0, shares[ id ] ?? 0 ) / total ) * 100 );
        out[ id ] = v; acc += v;
    } );
    return out;
}

/** Move one goal's share; the others give or take proportionally so the total stays 100. */
export function rebalance( shares: Shares, ids: string[], id: string, value: number ): Shares {
    const v = Math.max( 0, Math.min( 100, Math.round( value ) ) );
    const others = ids.filter( x => x !== id );
    const out: Shares = { [ id ]: v };
    const rest = 100 - v;
    const oldRest = others.reduce( ( s, x ) => s + ( shares[ x ] ?? 0 ), 0 );
    let acc = 0;
    others.forEach( ( x, i ) => {
        const raw = oldRest > 0 ? ( ( shares[ x ] ?? 0 ) / oldRest ) * rest : rest / others.length;
        const r = i === others.length - 1 ? rest - acc : Math.round( raw );
        out[ x ] = Math.max( 0, r ); acc += out[ x ];
    } );
    return out;
}

export function simulatePlan( surplus: number, debts: DebtLine[], goals: GoalLine[], decided: Shares[] ): PlanResult {
    const issues: PlanResult[ "issues" ] = [];
    const wealth = goals.find( g => g.isWealth )?.id ?? null;
    const remaining = new Map( goals.map( g => [ g.id, g.isWealth ? Infinity : Math.max( 0, g.remaining ) ] ) );
    const owed = new Map( debts.map( d => [ d.id, Math.max( 0, d.outstanding ) ] ) );
    const doneMonth: PlanResult[ "doneMonth" ] = {};
    const debtClearMonth: PlanResult[ "debtClearMonth" ] = {};
    for ( const g of goals ) doneMonth[ g.id ] = !g.isWealth && g.remaining <= 0 ? 0 : null;
    for ( const d of debts ) debtClearMonth[ d.id ] = d.outstanding <= 0 ? 0 : null;

    const open = () => goals.filter( g => g.isWealth || ( remaining.get( g.id ) ?? 0 ) > 0 ).map( g => g.id );
    const poolNow = () => Math.max( 0, surplus - debts.reduce( ( s, d ) => s + ( ( owed.get( d.id ) ?? 0 ) > 0 ? Math.min( d.monthly, owed.get( d.id )! ) : 0 ), 0 ) );

    if ( surplus <= 0 ) issues.push( { kind: "no-surplus", phase: 1, text: "No surplus: take-home minus expenses is zero." } );

    // Effective shares for a phase: the user's if decided, else carry the previous split forward.
    const effective = ( idx: number, ids: string[], prev: Shares | null ): { shares: Shares; decided: boolean } => {
        const saved = decided[ idx ];
        if ( saved ) {
            const sum = ids.reduce( ( s, id ) => s + ( saved[ id ] ?? 0 ), 0 );
            for ( const id of ids ) {
                if ( ( saved[ id ] ?? 0 ) === 0 && id !== wealth && !issues.some( i => i.kind === "no-share" && i.goalId === id ) ) {
                    issues.push( { kind: "no-share", phase: idx + 1, goalId: id, text: `${goals.find( g => g.id === id )?.name} has no share yet.` } );
                }
            }
            if ( sum > 100 ) issues.push( { kind: "over", phase: idx + 1, text: `Phase ${idx + 1} adds up to ${sum}%.` } );
            if ( sum < 100 && !wealth ) issues.push( { kind: "under", phase: idx + 1, text: `Phase ${idx + 1} adds up to ${sum}%.` } );
            const s: Shares = {};
            for ( const id of ids ) s[ id ] = Math.max( 0, saved[ id ] ?? 0 );
            if ( wealth && sum < 100 ) s[ wealth ] = ( s[ wealth ] ?? 0 ) + ( 100 - sum ); // unassigned goes to wealth
            return { shares: s, decided: true };
        }
        return { shares: normalise( prev ?? {}, ids ), decided: false };
    };

    const phases: Phase[] = [];
    let ids = open();
    let cur = effective( 0, ids, null );
    const startPhase = ( from: number ) => {
        const pool = poolNow();
        const amounts: Record<string, number> = {};
        for ( const id of ids ) amounts[ id ] = round( ( pool * ( cur.shares[ id ] ?? 0 ) ) / 100 );
        phases.push( { index: phases.length + 1, fromMonth: from, toMonth: null, shares: cur.shares, amounts, pool, decided: cur.decided, endsWith: null, goals: [ ...ids ] } );
    };
    startPhase( 0 );

    for ( let m = 1; m <= MAX_MONTHS; m++ ) {
        // debts first
        let pool = surplus;
        for ( const d of debts ) {
            const o = owed.get( d.id ) ?? 0;
            if ( o <= 0 ) continue;
            const pay = Math.min( d.monthly, o, pool );
            owed.set( d.id, o - pay ); pool -= pay;
            if ( o - pay <= 0 ) debtClearMonth[ d.id ] = m;
        }
        // then the split
        let spill = 0;
        const completed: string[] = [];
        for ( const id of ids ) {
            const rem = remaining.get( id )!;
            if ( rem === Infinity ) continue;
            const give = ( pool * ( cur.shares[ id ] ?? 0 ) ) / 100;
            if ( give >= rem ) { spill += give - rem; remaining.set( id, 0 ); completed.push( id ); }
            else remaining.set( id, rem - give );
        }
        if ( wealth ) remaining.set( wealth, Infinity );
        void spill; // anything left over in the completing month flows to wealth
        if ( completed.length ) {
            for ( const id of completed ) doneMonth[ id ] = m;
            const last = phases[ phases.length - 1 ];
            last.toMonth = m; last.endsWith = completed[ 0 ];
            ids = open();
            if ( ids.length === 0 || ( ids.length === 1 && ids[ 0 ] === wealth ) ) {
                if ( wealth ) { ids = [ wealth ]; cur = { shares: { [ wealth ]: 100 }, decided: true }; startPhase( m ); }
                break;
            }
            cur = effective( phases.length, ids, cur.shares );
            startPhase( m );
        }
        if ( pool <= 0 && debts.every( d => ( owed.get( d.id ) ?? 0 ) <= 0 ) ) break;
    }

    return { surplus, debtMonthly: surplus - poolNowAtStart( surplus, debts ), pool: poolNowAtStart( surplus, debts ), phases, doneMonth, debtClearMonth, issues };
}

function poolNowAtStart( surplus: number, debts: DebtLine[] ) {
    return Math.max( 0, surplus - debts.reduce( ( s, d ) => s + ( d.outstanding > 0 ? Math.min( d.monthly, d.outstanding ) : 0 ), 0 ) );
}

/** A starting split: wealth 35%, the rest by what's left to fund, weighted so safety goals lead. */
export function suggestShares( goals: GoalLine[], weights: Record<string, number> = {} ): Shares {
    const ids = goals.map( g => g.id );
    const wealth = goals.find( g => g.isWealth );
    const others = goals.filter( g => !g.isWealth && g.remaining > 0 );
    const raw: Shares = {};
    if ( wealth ) raw[ wealth.id ] = others.length ? 35 : 100;
    const need = others.reduce( ( s, g ) => s + g.remaining * ( weights[ g.id ] ?? 1 ), 0 );
    for ( const g of others ) raw[ g.id ] = need > 0 ? ( ( g.remaining * ( weights[ g.id ] ?? 1 ) ) / need ) * ( wealth ? 65 : 100 ) : 0;
    return normalise( raw, ids );
}

export const monthLabel = ( monthsFromNow: number, from = new Date() ) => {
    const d = new Date( from );
    d.setMonth( d.getMonth() + monthsFromNow );
    return d.toLocaleDateString( "en-IN", { month: "short", year: "numeric" } );
};

export const spanLabel = ( months: number ) =>
    months < 1 ? "now" : months < 24 ? `${months} mo` : `${( months / 12 ).toFixed( 1 ).replace( /\.0$/, "" )} yr`;
