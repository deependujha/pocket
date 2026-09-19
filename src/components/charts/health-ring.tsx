import { toneColor, type Tone } from "@/components/ui/status";

export function HealthRing( { score, size = 132, stroke = 10, tone, label }: { score: number; size?: number; stroke?: number; tone: Tone; label: string } ) {
    const r = ( size - stroke ) / 2;
    const c = 2 * Math.PI * r;
    const v = Math.max( 0, Math.min( 100, score ) );
    const dash = ( v / 100 ) * c;
    return (
        <div className="relative shrink-0" style={ { width: size, height: size } } role="img" aria-label={ `Health score ${score} of 100, ${label}` }>
            <svg width={ size } height={ size } viewBox={ `0 0 ${size} ${size}` } className="-rotate-90">
                <circle cx={ size / 2 } cy={ size / 2 } r={ r } fill="none" stroke="var(--viz-track)" strokeWidth={ stroke } />
                <circle cx={ size / 2 } cy={ size / 2 } r={ r } fill="none" stroke={ toneColor( tone ) } strokeWidth={ stroke }
                    strokeLinecap="round" strokeDasharray={ `${dash} ${c - dash}` } className="transition-[stroke-dasharray] duration-700" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-semibold tracking-tight leading-none">{ score }</div>
                <div className="mt-1 text-[11px] text-muted-foreground">of 100</div>
            </div>
        </div>
    );
}
