const inrFull = new Intl.NumberFormat( "en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 } );
const groupIN = new Intl.NumberFormat( "en-IN", { maximumFractionDigits: 0 } );

/** ₹1,50,000 */
export const inr = ( n: number ) => inrFull.format( Math.round( n ) );

/** 1,50,000 (no symbol), for inputs */
export const digitsIN = ( n: number ) => ( n ? groupIN.format( Math.round( n ) ) : "" );

/** ₹1.5L, ₹2.3Cr, ₹12K */
export const inrCompact = ( n: number ) => {
    const abs = Math.abs( n );
    const sign = n < 0 ? "-" : "";
    const fmt = ( v: number, unit: string, digits: number ) => `${sign}₹${v.toFixed( digits ).replace( /\.0+$/, "" ).replace( /(\.\d*?)0+$/, "$1" )}${unit}`;
    if ( abs >= 1e7 ) return fmt( abs / 1e7, "Cr", 2 );
    if ( abs >= 1e5 ) return fmt( abs / 1e5, "L", 2 );
    if ( abs >= 1e3 ) return fmt( abs / 1e3, "K", 1 );
    return `${sign}₹${abs}`;
};

export const clamp = ( n: number, lo: number, hi: number ) => Math.min( hi, Math.max( lo, n ) );

const DAY = 86400000;
export const daysBetween = ( a: Date, b: Date ) => Math.round( ( b.getTime() - a.getTime() ) / DAY );

export const fmtDate = ( d: Date | string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" } ) =>
    d ? new Date( d ).toLocaleDateString( "en-IN", opts ) : "";

/** "in 12d", "in 3mo", "3d ago" */
export const relativeDays = ( target: Date ) => {
    const days = daysBetween( new Date(), target );
    if ( days < 0 ) return `${Math.abs( days )}d ago`;
    if ( days === 0 ) return "today";
    if ( days < 45 ) return `in ${days}d`;
    const months = Math.round( days / 30 );
    if ( months < 24 ) return `in ${months}mo`;
    return `in ${( days / 365 ).toFixed( 1 )}y`;
};

export const toInputDate = ( d: Date | string | null | undefined ) => {
    if ( !d ) return "";
    const x = new Date( d );
    return `${x.getFullYear()}-${String( x.getMonth() + 1 ).padStart( 2, "0" )}-${String( x.getDate() ).padStart( 2, "0" )}`;
};

/** "amazon.in" from a URL, for link pills */
export const hostOf = ( url: string ) => { try { return new URL( url ).hostname.replace( /^www\./, "" ); } catch { return url; } };
