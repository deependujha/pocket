import { CheckCircle2, AlertTriangle, AlertOctagon, Info, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tone = "good" | "warning" | "serious" | "critical" | "neutral";

const map = {
    good: { Icon: CheckCircle2, cls: "text-status-good-text", dot: "var(--status-good)" },
    warning: { Icon: AlertTriangle, cls: "text-status-warning-text", dot: "var(--status-warning)" },
    serious: { Icon: AlertTriangle, cls: "text-status-serious-text", dot: "var(--status-serious)" },
    critical: { Icon: AlertOctagon, cls: "text-status-critical-text", dot: "var(--status-critical)" },
    neutral: { Icon: Info, cls: "text-muted-foreground", dot: "var(--viz-muted)" },
};

/** Status is never color alone: icon + label, always. */
export function Status( { tone, children, className, icon }: { tone: Tone; children: React.ReactNode; className?: string; icon?: "clock" } ) {
    const { Icon, cls } = map[ tone ];
    const I = icon === "clock" ? Clock : Icon;
    return (
        <span className={ cn( "inline-flex items-center gap-1 text-xs font-medium", cls, className ) }>
            <I size={ 13 } strokeWidth={ 2.25 } />
            { children }
        </span>
    );
}

export const toneColor = ( t: Tone ) => map[ t ].dot;
