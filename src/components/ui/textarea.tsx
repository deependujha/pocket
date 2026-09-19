import { cn } from "@/lib/utils";

export function Textarea( { className, ...props }: React.ComponentProps<"textarea"> ) {
    return (
        <textarea
            className={ cn(
                "min-h-20 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/60",
                "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25",
                className,
            ) }
            { ...props }
        />
    );
}
