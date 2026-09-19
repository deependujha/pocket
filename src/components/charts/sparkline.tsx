/** Tiny inline trend. Pure SVG, no axes. */
export function Sparkline( { data, color = "var(--viz-1)", width = 72, height = 24 }: { data: number[]; color?: string; width?: number; height?: number } ) {
    if ( data.length < 2 ) return <div style={ { width, height } } />;
    const min = Math.min( ...data ), max = Math.max( ...data );
    const span = max - min || 1;
    const pts = data.map( ( v, i ) => `${( i / ( data.length - 1 ) ) * ( width - 2 ) + 1},${height - 2 - ( ( v - min ) / span ) * ( height - 4 )}` ).join( " " );
    return (
        <svg width={ width } height={ height } viewBox={ `0 0 ${width} ${height}` } aria-hidden="true">
            <polyline points={ pts } fill="none" stroke={ color } strokeWidth={ 1.5 } strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    );
}
