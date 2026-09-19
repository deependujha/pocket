import { BUCKETS, type Bucket } from "@/lib/constants";
import { inrCompact } from "@/lib/money";

const ORDER: Bucket[] = [ "emergency", "longterm", "goals", "free", "lent" ];

/** Part-to-whole: one horizontal stacked bar with 2px surface gaps, plus a legend that carries the numbers. */
export function AllocationBar( { buckets, total }: { buckets: Record<Bucket, number>; total: number } ) {
    const parts = ORDER.map( k => ( { key: k, value: Math.max( 0, buckets[ k ] ), ...BUCKETS[ k ] } ) ).filter( p => p.value > 0 );
    if ( total <= 0 || parts.length === 0 ) {
        return <div className="h-3 w-full rounded-full bg-muted" />;
    }
    return (
        <div>
            <div className="flex h-3.5 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label="Allocation of assets">
                { parts.map( p => (
                    <div key={ p.key } style={ { width: `${( p.value / total ) * 100}%`, background: p.color } } title={ `${p.label}: ${inrCompact( p.value )}` } />
                ) ) }
            </div>
            <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
                { ORDER.map( k => {
                    const v = buckets[ k ];
                    const m = BUCKETS[ k ];
                    return (
                        <li key={ k } className="flex items-center gap-2 text-sm">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={ { background: m.color, opacity: v > 0 ? 1 : 0.3 } } />
                            <span className="truncate text-foreground/75">{ m.label }</span>
                            <span className="ml-auto tabular font-medium text-foreground">{ inrCompact( v ) }</span>
                            <span className="w-9 text-right text-xs tabular text-muted-foreground/75">{ total > 0 ? `${Math.round( ( v / total ) * 100 )}%` : "" }</span>
                        </li>
                    );
                } ) }
            </ul>
        </div>
    );
}
