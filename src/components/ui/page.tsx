import { ChevronLeft } from "lucide-react";
import { NavLink, type View } from "@/lib/view";
import { cn } from "@/lib/utils";

export function PageHeader( { title, subtitle, back, action, className }: {
    title: string; subtitle?: React.ReactNode; back?: View; action?: React.ReactNode; className?: string;
} ) {
    return (
        <header className={ cn( "flex items-start justify-between gap-3 pt-2 pb-4", className ) }>
            <div className="min-w-0">
                { back && (
                    <NavLink to={ back } className="-ml-1 mb-1 inline-flex items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground">
                        <ChevronLeft size={ 16 } /> Back
                    </NavLink>
                ) }
                <h1 className="truncate text-2xl font-semibold tracking-tight">{ title }</h1>
                { subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{ subtitle }</p> }
            </div>
            { action && <div className="shrink-0 pt-1">{ action }</div> }
        </header>
    );
}

export function Section( { title, hint, action, children, className }: {
    title?: string; hint?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string;
} ) {
    return (
        <section className={ cn( "mb-6", className ) }>
            { ( title || action ) && (
                <div className="mb-2 flex items-end justify-between gap-3 px-0.5">
                    <div>
                        { title && <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">{ title }</h2> }
                        { hint && <p className="text-xs text-muted-foreground/75">{ hint }</p> }
                    </div>
                    { action }
                </div>
            ) }
            { children }
        </section>
    );
}

export function Empty( { icon, title, body, action }: { icon?: React.ReactNode; title: string; body?: string; action?: React.ReactNode } ) {
    return (
        <div className="card flex flex-col items-center px-6 py-10 text-center">
            { icon && <div className="mb-3 text-muted-foreground/45">{ icon }</div> }
            <div className="font-medium">{ title }</div>
            { body && <p className="mt-1 max-w-xs text-sm text-muted-foreground">{ body }</p> }
            { action && <div className="mt-4">{ action }</div> }
        </div>
    );
}

export function Stat( { label, value, sub, className }: { label: string; value: React.ReactNode; sub?: React.ReactNode; className?: string } ) {
    return (
        <div className={ cn( "card px-4 py-3", className ) }>
            <div className="text-xs text-muted-foreground">{ label }</div>
            <div className="mt-0.5 text-lg font-semibold tracking-tight">{ value }</div>
            { sub && <div className="mt-0.5 text-xs text-muted-foreground">{ sub }</div> }
        </div>
    );
}
