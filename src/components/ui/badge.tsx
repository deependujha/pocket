import { cn } from "@/lib/utils";

export function Badge( { className, tone = "neutral", children }: { className?: string; tone?: "neutral" | "good" | "warning" | "serious" | "critical" | "info"; children: React.ReactNode } ) {
    const tones = {
        neutral: "bg-muted text-foreground/75",
        info: "bg-primary/12 text-primary",
        good: "bg-status-good/12 text-status-good-text",
        warning: "bg-status-warning/15 text-status-warning-text",
        serious: "bg-status-serious/15 text-status-serious-text",
        critical: "bg-status-critical/12 text-status-critical-text",
    };
    return (
        <span className={ cn( "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-4", tones[ tone ], className ) }>
            { children }
        </span>
    );
}
