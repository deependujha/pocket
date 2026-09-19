"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { inr, inrCompact, niceCeil } from "@/lib/money";

type Pt = { date: number; actual: number | null; plan: number | null };

const fmtTick = ( t: number ) => new Date( t ).toLocaleDateString( "en-IN", { month: "short", year: "2-digit" } );

/** Two series (saved so far, plan) against a target line. Legend always present for 2 series. */
export function GoalProjection( { data, target, targetDate, height = 200 }: { data: Pt[]; target: number; targetDate?: number | null; height?: number } ) {
    const hasActual = data.some( d => d.actual != null );
    const hasPlan = data.some( d => d.plan != null );
    if ( data.length < 2 ) {
        return <div className="flex items-center justify-center text-xs text-muted-foreground/75" style={ { height } }>Link an account and set a monthly plan to see the path to your target.</div>;
    }
    const vals = data.flatMap( d => [ d.actual ?? 0, d.plan ?? 0 ] );
    const max = Math.max( target, ...vals );
    return (
        <div>
            <div style={ { height } } className="-ml-2">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ data } margin={ { top: 10, right: 8, bottom: 0, left: 0 } }>
                        <CartesianGrid vertical={ false } />
                        <XAxis dataKey="date" type="number" domain={ [ "dataMin", "dataMax" ] } tickFormatter={ fmtTick } tickLine={ false } axisLine={ false } minTickGap={ 40 } dy={ 6 } />
                        <YAxis tickFormatter={ v => inrCompact( v ) } tickLine={ false } axisLine={ false } width={ 52 } domain={ [ 0, niceCeil( max * 1.05 ) ] } tickCount={ 5 } />
                        <ReferenceLine y={ target } stroke="var(--viz-axis)" strokeDasharray="4 4" />
                        { targetDate && <ReferenceLine x={ targetDate } stroke="var(--viz-axis)" strokeDasharray="2 4" /> }
                        <Tooltip
                            content={ ( { active, payload } ) => {
                                if ( !active || !payload?.length ) return null;
                                const p = payload[ 0 ].payload as Pt;
                                const v = p.actual ?? p.plan ?? 0;
                                return (
                                    <div className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs shadow-sm">
                                        <div className="text-muted-foreground">{ new Date( p.date ).toLocaleDateString( "en-IN", { day: "numeric", month: "short", year: "numeric" } ) } · { p.actual != null ? "Saved" : "Plan" }</div>
                                        <div className="font-semibold tabular">{ inr( v ) }</div>
                                    </div>
                                );
                            } }
                        />
                        <Line type="monotone" dataKey="actual" stroke="var(--viz-3)" strokeWidth={ 2 } dot={ false } connectNulls={ false } isAnimationActive={ false } activeDot={ { r: 4, strokeWidth: 2, stroke: "var(--card)" } } />
                        <Line type="monotone" dataKey="plan" stroke="var(--viz-1)" strokeWidth={ 2 } strokeDasharray="5 4" dot={ false } connectNulls={ false } isAnimationActive={ false } activeDot={ { r: 4, strokeWidth: 2, stroke: "var(--card)" } } />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 px-1 text-xs text-foreground/75">
                { hasActual && <li className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded" style={ { background: "var(--viz-3)" } } />Saved so far</li> }
                { hasPlan && <li className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded border-t-2 border-dashed" style={ { borderColor: "var(--viz-1)" } } />At current monthly pace</li> }
                <li className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded border-t-2 border-dashed border-[var(--viz-axis)]" />Target { inrCompact( target ) }</li>
            </ul>
        </div>
    );
}
