/**
 * Pure calculations. No DB, no React. Everything the dashboards show comes from here.
 */
import type { Account, Goal, Loan, LoanPayment, Movement, Settings } from "@/generated/prisma/client";
import { INVEST_TYPES, type Bucket } from "@/lib/constants";
import { addMonths, clamp, daysBetween, inr, monthsBetween } from "@/lib/money";

export type AccountWithGoal = Account & { goal: Pick<Goal, "id" | "name" | "kind" | "status"> | null };
export type LoanWithPayments = Loan & { payments: LoanPayment[] };

/* =========================================================
 * Accounts
 * ======================================================= */

export const isDebt = ( a: Pick<Account, "type"> ) => a.type === "CREDIT_CARD";
export const isInvestment = ( a: Pick<Account, "type"> ) => INVEST_TYPES.includes( a.type );

/** Which of the 5 jobs this account's money is doing right now. */
export function bucketOf( a: AccountWithGoal ): Bucket | "debt" {
    if ( isDebt( a ) ) return "debt";
    const goal = a.goal && a.goal.status !== "ARCHIVED" ? a.goal : null;
    if ( goal?.kind === "EMERGENCY" || goal?.kind === "HEALTH" ) return "emergency";
    if ( goal?.kind === "WEALTH" ) return "longterm";
    if ( goal ) return "goals";
    if ( isInvestment( a ) ) return "longterm";
    return "free";
}

/** FD maturity value with quarterly compounding (Indian bank default). */
export function fdMaturityValue( principal: number, ratePct: number, start: Date, maturity: Date, n = 4 ) {
    const years = Math.max( 0, daysBetween( start, maturity ) / 365 );
    return Math.round( principal * Math.pow( 1 + ratePct / 100 / n, n * years ) );
}

/** Where an FD "should" be today if interest accrued linearly: for the accrued-interest hint. */
export function fdAccruedValue( principal: number, ratePct: number, start: Date, maturity: Date, today = new Date() ) {
    if ( today <= start ) return principal;
    if ( today >= maturity ) return fdMaturityValue( principal, ratePct, start, maturity );
    return fdMaturityValue( principal, ratePct, start, today );
}

export const gainOf = ( a: Pick<Account, "balance" | "invested"> ) =>
    a.invested == null ? null : a.balance - a.invested;

/* =========================================================
 * Loans
 * ======================================================= */

export const loanPaid = ( l: LoanWithPayments, asOf?: Date ) =>
    l.payments.reduce( ( s, p ) => ( !asOf || p.date <= asOf ? s + p.amount : s ), 0 );

export const loanOutstanding = ( l: LoanWithPayments, asOf?: Date ) =>
    Math.max( 0, l.principal - loanPaid( l, asOf ) );

/* =========================================================
 * Summary: the numbers on the overview
 * ======================================================= */

export type Summary = {
    assets: number;
    liabilities: number;
    netWorth: number;
    buckets: Record<Bucket, number>;
    creditCardDue: number;
    borrowed: number;
    liquid: number;          // everything LIQUID that isn't a debt
    freeLiquid: number;      // liquid AND unallocated, minus card dues
    invested: number;        // market-linked + retirement value
    monthlySip: number;      // sum of recurring contributions
    emergencyFund: number;   // job-loss + health, everything untouchable
    jobLossFund: number;     // only the job-loss cover: what runway is measured on
    runwayMonths: number | null;
};

export function summarize( accounts: AccountWithGoal[], loans: LoanWithPayments[], settings: Settings | null ): Summary {
    const live = accounts.filter( a => !a.archived );
    const buckets: Record<Bucket, number> = { emergency: 0, longterm: 0, goals: 0, free: 0, lent: 0 };
    let creditCardDue = 0, liquid = 0, freeLiquid = 0, invested = 0, monthlySip = 0, jobLossFund = 0;

    for ( const a of live ) {
        const b = bucketOf( a );
        if ( b === "debt" ) { creditCardDue += a.balance; continue; }
        buckets[ b ] += a.balance;
        if ( a.goal?.kind === "EMERGENCY" && a.goal.status !== "ARCHIVED" ) jobLossFund += a.balance;
        if ( a.liquidity === "LIQUID" ) liquid += a.balance;
        if ( a.liquidity === "LIQUID" && b === "free" ) freeLiquid += a.balance;
        if ( isInvestment( a ) ) invested += a.balance;
        if ( a.sipAmount ) monthlySip += a.sipAmount;
    }

    let borrowed = 0;
    for ( const l of loans ) {
        if ( l.status !== "ACTIVE" ) continue;
        const out = loanOutstanding( l );
        if ( l.direction === "LENT" ) buckets.lent += out;
        else borrowed += out;
    }

    const assets = buckets.emergency + buckets.longterm + buckets.goals + buckets.free + buckets.lent;
    const liabilities = creditCardDue + borrowed;
    const expense = settings?.monthlyExpense ?? 0;

    return {
        assets,
        liabilities,
        netWorth: assets - liabilities,
        buckets,
        creditCardDue,
        borrowed,
        liquid,
        freeLiquid: freeLiquid - creditCardDue,
        invested,
        monthlySip,
        emergencyFund: buckets.emergency,
        jobLossFund,
        runwayMonths: expense > 0 ? jobLossFund / expense : null,
    };
}

/* =========================================================
 * Health score: "how secure am I?"  (0–100)
 * ======================================================= */

export type HealthComponent = {
    key: string;
    label: string;
    points: number;
    max: number;
    detail: string; // what the number is right now
    tip: string;    // what would raise it
};

export type Health = {
    score: number;
    band: "secure" | "stable" | "building" | "fragile";
    bandLabel: string;
    components: HealthComponent[];
};

export function healthScore( s: Summary, settings: Settings | null, goals: GoalProgress[] ): Health {
    const expense = settings?.monthlyExpense ?? 0;
    const income = settings?.monthlyIncome ?? 0;
    const targetMonths = settings?.emergencyMonths ?? 6;
    const c: HealthComponent[] = [];

    // 1. Emergency runway: 30
    {
        const max = 30;
        if ( expense <= 0 ) {
            c.push( { key: "emergency", label: "Emergency runway", points: 0, max, detail: "Monthly expenses not set", tip: "Set your monthly expenses in Settings so runway can be measured." } );
        } else {
            const months = s.jobLossFund / expense;
            const points = Math.round( clamp( months / targetMonths, 0, 1 ) * max );
            c.push( {
                key: "emergency", label: "Emergency runway", points, max,
                detail: `${months.toFixed( 1 )} of ${targetMonths} months covered`,
                tip: months >= targetMonths ? "Job-loss cover is fully funded. Keep it somewhere you never touch." : `Add ${inr( Math.ceil( ( targetMonths - months ) * expense ) )} to the job-loss cover to reach ${targetMonths} months.`,
            } );
        }
    }

    // 2. Liquidity buffer: 15 (one month of free cash after card dues)
    {
        const max = 15;
        if ( expense <= 0 ) {
            c.push( { key: "liquidity", label: "Cash buffer", points: 0, max, detail: "Monthly expenses not set", tip: "Set monthly expenses to measure your cash buffer." } );
        } else {
            const ratio = s.freeLiquid / expense;
            const points = Math.round( clamp( ratio, 0, 1 ) * max );
            c.push( {
                key: "liquidity", label: "Cash buffer", points, max,
                detail: ratio < 0 ? "Card dues exceed free cash" : `${ratio.toFixed( 1 )} months of free cash`,
                tip: ratio >= 1 ? "Enough free cash for a month. Extra can go to goals." : "Keep about one month of expenses free in your savings account.",
            } );
        }
    }

    // 3. Debt load: 20
    {
        const max = 20;
        const ratio = s.assets > 0 ? s.liabilities / s.assets : ( s.liabilities > 0 ? 1 : 0 );
        const points = Math.round( clamp( 1 - ratio / 0.5, 0, 1 ) * max );
        c.push( {
            key: "debt", label: "Debt load", points, max,
            detail: s.liabilities === 0 ? "No debt" : `Owe ${Math.round( ratio * 100 )}% of what you own`,
            tip: s.liabilities === 0 ? "Debt free. Keep card dues paid in full." : "Clear card dues monthly; prepay the highest-interest loan first.",
        } );
    }

    // 4. Investing: 20 (SIP rate vs income, or invested share of assets)
    {
        const max = 20;
        const sipRate = income > 0 ? s.monthlySip / income : 0;
        const share = s.assets > 0 ? s.invested / s.assets : 0;
        const norm = Math.max( clamp( sipRate / 0.2, 0, 1 ), clamp( share / 0.4, 0, 1 ) );
        const points = Math.round( norm * max );
        c.push( {
            key: "investing", label: "Investing", points, max,
            detail: income > 0 ? `${Math.round( sipRate * 100 )}% of income goes to SIPs` : `${Math.round( share * 100 )}% of assets invested`,
            tip: norm >= 1 ? "Solid. Increase SIPs with every raise." : "Aim to invest 20% of income monthly, e.g. Nifty 50 + a little gold.",
        } );
    }

    // 5. Goals on track: 15
    {
        const max = 15;
        const active = goals.filter( g => g.goal.status === "ACTIVE" && g.goal.kind !== "WEALTH" && g.goal.kind !== "EMERGENCY" && g.goal.kind !== "HEALTH" );
        if ( active.length === 0 ) {
            c.push( { key: "goals", label: "Goals on track", points: Math.round( max * 0.5 ), max, detail: "No goals yet", tip: "Add a goal: a gift, a trip, a phone: and link an FD to it." } );
        } else {
            const on = active.filter( g => g.onTrack ).length;
            const points = Math.round( ( on / active.length ) * max );
            c.push( {
                key: "goals", label: "Goals on track", points, max,
                detail: `${on} of ${active.length} goals on track`,
                tip: on === active.length ? "Every goal is on pace." : "Raise the monthly plan or push the date on goals that are behind.",
            } );
        }
    }

    const score = c.reduce( ( t, x ) => t + x.points, 0 );
    const band = score >= 80 ? "secure" : score >= 60 ? "stable" : score >= 40 ? "building" : "fragile";
    const bandLabel = { secure: "Secure", stable: "Stable", building: "Building", fragile: "Fragile" }[ band ];
    return { score, band, bandLabel, components: c };
}

/* =========================================================
 * Goal progress & projection
 * ======================================================= */

export type GoalProgress = {
    goal: Goal;
    accounts: AccountWithGoal[];
    current: number;
    target: number;
    pct: number;             // 0..1 (can exceed 1)
    remaining: number;
    monthly: number;         // plan or sum of linked SIPs
    monthsLeft: number | null;    // until targetDate
    neededPerMonth: number | null;
    expectedPct: number | null;   // where you "should" be by time elapsed
    onTrack: boolean;
    projectedDate: Date | null;   // when you'd hit target at current monthly pace
};

export function goalProgress( goal: Goal, accounts: AccountWithGoal[], now = new Date() ): GoalProgress {
    const linked = accounts.filter( a => a.goalId === goal.id && !a.archived );
    const current = linked.reduce( ( s, a ) => s + a.balance, 0 );
    const target = Math.max( goal.target, 1 );
    const remaining = Math.max( 0, goal.target - current );
    const linkedSip = linked.reduce( ( s, a ) => s + ( a.sipAmount ?? 0 ), 0 );
    const monthly = goal.monthlyPlan ?? linkedSip;

    let monthsLeft: number | null = null;
    let neededPerMonth: number | null = null;
    let expectedPct: number | null = null;

    if ( goal.targetDate ) {
        monthsLeft = Math.max( 0, monthsBetween( now, goal.targetDate ) );
        neededPerMonth = monthsLeft > 0.25 ? Math.ceil( remaining / monthsLeft ) : remaining;
        const total = Math.max( 1, daysBetween( goal.createdAt, goal.targetDate ) );
        const elapsed = clamp( daysBetween( goal.createdAt, now ), 0, total );
        expectedPct = elapsed / total;
    }

    const pct = current / target;
    const done = current >= goal.target;
    const onTrack = done
        || ( expectedPct != null ? pct >= expectedPct - 0.05 || ( neededPerMonth != null && monthly >= neededPerMonth ) : monthly > 0 || goal.kind === "WEALTH" );

    const monthsToGo = monthly > 0 ? Math.ceil( remaining / monthly ) : Infinity;
    const projectedDate = done ? now : monthsToGo <= 360 ? addMonths( now, monthsToGo ) : null; // beyond 30 years isn't a date, it's a shrug

    return { goal, accounts: linked, current, target: goal.target, pct, remaining, monthly, monthsLeft, neededPerMonth, expectedPct, onTrack, projectedDate };
}

/** Points for a goal chart: history of linked balances + a dotted plan line to target. */
export function goalProjectionSeries( gp: GoalProgress, movements: Movement[], now = new Date() ) {
    const ids = new Set( gp.accounts.map( a => a.id ) );
    const hist = balanceHistory( movements.filter( m => ids.has( m.accountId ) ), gp.accounts.map( a => a.id ), now );
    const actual = hist.map( p => ( { date: p.date, actual: p.value, plan: null as number | null } ) );

    const plan: { date: number; actual: number | null; plan: number | null }[] = [];
    if ( gp.monthly > 0 && gp.remaining > 0 ) {
        const months = Math.min( 60, Math.ceil( gp.remaining / gp.monthly ) );
        plan.push( { date: now.getTime(), actual: null, plan: gp.current } );
        for ( let i = 1; i <= months; i++ ) {
            plan.push( { date: addMonths( now, i ).getTime(), actual: null, plan: Math.min( gp.goal.target, gp.current + gp.monthly * i ) } );
        }
    }
    return [ ...actual, ...plan ];
}

/* =========================================================
 * History: net worth over time from movements
 * ======================================================= */

/** Sum of balanceAfter of the latest movement per account, sampled over time. */
export function balanceHistory( movements: Movement[], accountIds: string[], now = new Date(), minDays = 30 ) {
    if ( movements.length === 0 ) return [] as { date: number; value: number }[];
    const sorted = [ ...movements ].sort( ( a, b ) => a.date.getTime() - b.date.getTime() );
    const first = sorted[ 0 ].date;
    const start = new Date( Math.min( first.getTime(), now.getTime() - minDays * 86400000 ) );
    const span = Math.max( 1, daysBetween( start, now ) );
    const step = span <= 92 ? 1 : Math.ceil( span / 90 );

    const latest = new Map<string, number>();
    const pts: { date: number; value: number }[] = [];
    let i = 0;
    for ( let d = 0; d <= span; d += step ) {
        const at = new Date( start.getTime() + d * 86400000 );
        at.setHours( 23, 59, 59, 999 );
        while ( i < sorted.length && sorted[ i ].date <= at ) {
            latest.set( sorted[ i ].accountId, sorted[ i ].balanceAfter );
            i++;
        }
        let v = 0;
        for ( const id of accountIds ) v += latest.get( id ) ?? 0;
        pts.push( { date: at.getTime(), value: v } );
    }
    // make sure the last point is "now" with everything applied
    while ( i < sorted.length ) { latest.set( sorted[ i ].accountId, sorted[ i ].balanceAfter ); i++; }
    let v = 0;
    for ( const id of accountIds ) v += latest.get( id ) ?? 0;
    pts[ pts.length - 1 ] = { date: now.getTime(), value: v };
    return pts;
}

export function netWorthHistory( accounts: AccountWithGoal[], movements: Movement[], loans: LoanWithPayments[], now = new Date() ) {
    const assetIds = accounts.filter( a => !isDebt( a ) ).map( a => a.id );
    const debtIds = accounts.filter( isDebt ).map( a => a.id );
    const assets = balanceHistory( movements, assetIds, now );
    const debts = balanceHistory( movements, debtIds, now );
    const debtAt = new Map( debts.map( p => [ p.date, p.value ] ) );

    return assets.map( p => {
        const at = new Date( p.date );
        let lent = 0, borrowed = 0;
        for ( const l of loans ) {
            if ( l.startDate > at ) continue;
            if ( l.status === "CLOSED" && l.closedAt && l.closedAt <= at ) continue;
            const out = loanOutstanding( l, at );
            if ( l.direction === "LENT" ) lent += out; else borrowed += out;
        }
        const card = debtAt.get( p.date ) ?? 0;
        return { date: p.date, value: p.value + lent - card - borrowed };
    } );
}
