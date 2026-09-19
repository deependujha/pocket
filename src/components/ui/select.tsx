import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Select( { className, children, ...props }: React.ComponentProps<"select"> ) {
    return (
        <div className="relative">
            <select
                className={ cn(
                    "h-10 w-full appearance-none rounded-xl border border-input bg-card pl-3 pr-9 text-sm text-foreground outline-none",
                    "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 disabled:opacity-50",
                    className,
                ) }
                { ...props }
            >
                { children }
            </select>
            <ChevronDown size={ 16 } className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/75" />
        </div>
    );
}
