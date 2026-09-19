import { cn } from "@/lib/utils";

/** Same-ramp track + fill. `value` is 0..1 (clamped for width, not for label). */
export function Meter( { value, color = "var(--viz-1)", className, height = 8, marker }: {
    value: number; color?: string; className?: string; height?: number;
    /** optional expected-progress marker, 0..1 */
    marker?: number | null;
} ) {
    const w = Math.max( 0, Math.min( 1, value ) ) * 100;
    return (
        <div className={ cn( "relative w-full overflow-hidden rounded-full bg-[var(--viz-track)]", className ) } style={ { height } } role="progressbar" aria-valuemin={ 0 } aria-valuemax={ 100 } aria-valuenow={ Math.round( w ) }>
            <div className="h-full rounded-full transition-[width] duration-500" style={ { width: `${w}%`, background: color } } />
            { marker != null && marker > 0 && marker < 1 && (
                <div className="absolute top-0 h-full w-0.5 bg-foreground/60" style={ { left: `${marker * 100}%` } } title="Where you should be by now" />
            ) }
        </div>
    );
}
