"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { inr, inrCompact, niceCeil, niceFloor } from "@/lib/money";

type Pt = { date: number; value: number };

const fmtTick = ( t: number ) => new Date( t ).toLocaleDateString( "en-IN", { day: "numeric", month: "short" } );

/** Single series over time. Title names the series, so no legend. */
export function TrendArea( { data, color = "var(--viz-1)", height = 180, id = "trend" }: { data: Pt[]; color?: string; height?: number; id?: string } ) {
    if ( data.length < 2 ) {
        return <div className="flex items-center justify-center text-xs text-muted-foreground/75" style={ { height } }>Not enough history yet — update a balance to start the line.</div>;
    }
    const min = Math.min( ...data.map( d => d.value ) );
    const max = Math.max( ...data.map( d => d.value ) );
    const top = niceCeil( max * 1.05 ) || 1;
    const bottom = niceFloor( min );
    return (
        <div style={ { height } } className="-ml-2">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ data } margin={ { top: 8, right: 8, bottom: 0, left: 0 } }>
                    <defs>
                        <linearGradient id={ `g-${id}` } x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={ color } stopOpacity={ 0.18 } />
                            <stop offset="100%" stopColor={ color } stopOpacity={ 0 } />
                        </linearGradient>
                    </defs>
                    <CartesianGrid vertical={ false } strokeDasharray="0" />
                    <XAxis dataKey="date" type="number" domain={ [ "dataMin", "dataMax" ] } tickFormatter={ fmtTick } tickLine={ false } axisLine={ false } minTickGap={ 48 } dy={ 6 } />
                    <YAxis tickFormatter={ v => inrCompact( v ) } tickLine={ false } axisLine={ false } width={ 52 } domain={ [ bottom, top ] } tickCount={ 5 } />
                    <Tooltip
                        cursor={ { strokeWidth: 1 } }
                        content={ ( { active, payload } ) => {
                            if ( !active || !payload?.length ) return null;
                            const p = payload[ 0 ].payload as Pt;
                            return (
                                <div className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs shadow-sm">
                                    <div className="text-muted-foreground">{ new Date( p.date ).toLocaleDateString( "en-IN", { day: "numeric", month: "short", year: "numeric" } ) }</div>
                                    <div className="font-semibold tabular">{ inr( p.value ) }</div>
                                </div>
                            );
                        } }
                    />
                    <Area type="monotone" dataKey="value" stroke={ color } strokeWidth={ 2 } fill={ `url(#g-${id})` } dot={ false } activeDot={ { r: 4, strokeWidth: 2, stroke: "var(--card)" } } isAnimationActive={ false } />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
