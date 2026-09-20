import { ChevronLeft } from "lucide-react";
import { NavLink, type View } from "@/lib/view";
import { cn } from "@/lib/utils";
import { Float, Rise } from "@/components/shell/motion";

export function PageHeader( { title, subtitle, back, action, className }: { title: string; subtitle?: React.ReactNode; back?: View; action?: React.ReactNode; className?: string } ) {
    return (
        <header className={ cn( "flex items-start justify-between gap-3 pt-3 pb-4", className ) }>
            <div className="min-w-0">
                { back && (
                    <NavLink to={ back } className="-ml-1 mb-1 inline-flex items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground">
                        <ChevronLeft size={ 16 } /> Back
                    </NavLink>
                ) }
                <h1 className="truncate text-[28px] font-semibold leading-tight tracking-tight">{ title }</h1>
                { subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{ subtitle }</p> }
            </div>
            { action && <div className="shrink-0 pt-1">{ action }</div> }
        </header>
    );
}

export function Section( { title, action, children, className }: { title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string } ) {
    return (
        <section className={ cn( "mb-6", className ) }>
            { ( title || action ) && (
                <div className="mb-2 flex items-center justify-between gap-3 px-0.5">
                    { title && <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">{ title }</h2> }
                    { action }
                </div>
            ) }
            { children }
        </section>
    );
}

export function Empty( { icon, title, body, action }: { icon?: React.ReactNode; title: string; body?: string; action?: React.ReactNode } ) {
    return (
        <Rise className="card flex flex-col items-center px-6 py-12 text-center">
            { icon && <Float><div className="mb-3 text-muted-foreground/45">{ icon }</div></Float> }
            <div className="font-medium">{ title }</div>
            { body && <p className="mt-1 max-w-xs text-sm text-muted-foreground">{ body }</p> }
            { action && <div className="mt-4">{ action }</div> }
        </Rise>
    );
}
