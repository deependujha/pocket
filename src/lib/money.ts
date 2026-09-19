const inrFull = new Intl.NumberFormat( "en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
} );

/** ₹1,50,000 */
export const inr = ( n: number ) => inrFull.format( Math.round( n ) );

/** ₹1.5L, ₹2.3Cr, ₹12K — for tight spaces and axis ticks */
export const inrCompact = ( n: number ) => {
    const abs = Math.abs( n );
    const sign = n < 0 ? "-" : "";
    const fmt = ( v: number, unit: string, digits: number ) => {
        const s = v.toFixed( digits ).replace( /\.0+$/, "" ).replace( /(\.\d*?)0+$/, "$1" );
        return `${sign}₹${s}${unit}`;
    };
    if ( abs >= 1e7 ) return fmt( abs / 1e7, "Cr", 2 );
    if ( abs >= 1e5 ) return fmt( abs / 1e5, "L", 2 );
    if ( abs >= 1e3 ) return fmt( abs / 1e3, "K", 1 );
    return `${sign}₹${abs}`;
};

/** +₹12K / -₹3K with sign shown */
export const inrDelta = ( n: number ) => ( n > 0 ? "+" : "" ) + inrCompact( n );

export const pct = ( n: number, digits = 0 ) => `${( n * 100 ).toFixed( digits )}%`;

/** Round up to a "nice" axis bound: 1.62L -> 2L, 4.69L -> 5L, 12K -> 20K */
export const niceCeil = ( v: number ): number => {
    if ( v <= 0 ) return 0;
    const m = Math.pow( 10, Math.floor( Math.log10( v ) ) );
    const n = v / m;
    const s = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
    return s * m;
};
export const niceFloor = ( v: number ) => ( v >= 0 ? 0 : -niceCeil( -v ) );

export const clamp = ( n: number, lo: number, hi: number ) => Math.min( hi, Math.max( lo, n ) );

/* ---------- dates ---------- */

const DAY = 24 * 60 * 60 * 1000;

export const daysBetween = ( a: Date, b: Date ) => Math.round( ( b.getTime() - a.getTime() ) / DAY );

export const monthsBetween = ( a: Date, b: Date ) =>
    ( b.getFullYear() - a.getFullYear() ) * 12 + ( b.getMonth() - a.getMonth() ) + ( b.getDate() - a.getDate() ) / 30;

export const addMonths = ( d: Date, m: number ) => {
    const r = new Date( d );
    r.setMonth( r.getMonth() + m );
    return r;
};

export const fmtDate = ( d: Date | string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" } ) =>
    d ? new Date( d ).toLocaleDateString( "en-IN", opts ) : "";

export const fmtMonth = ( d: Date | string ) =>
    new Date( d ).toLocaleDateString( "en-IN", { month: "short", year: "numeric" } );

/** "in 3 months", "in 12 days", "overdue by 5 days" */
export const relativeDays = ( target: Date ) => {
    const days = daysBetween( new Date(), target );
    if ( days < 0 ) return `overdue by ${Math.abs( days )}d`;
    if ( days === 0 ) return "today";
    if ( days < 45 ) return `in ${days}d`;
    const months = Math.round( days / 30 );
    if ( months < 24 ) return `in ${months}mo`;
    return `in ${( days / 365 ).toFixed( 1 )}y`;
};

/** yyyy-mm-dd for <input type="date"> */
export const toInputDate = ( d: Date | string | null | undefined ) => {
    if ( !d ) return "";
    const x = new Date( d );
    const m = String( x.getMonth() + 1 ).padStart( 2, "0" );
    const day = String( x.getDate() ).padStart( 2, "0" );
    return `${x.getFullYear()}-${m}-${day}`;
};
