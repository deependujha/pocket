"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Field( { label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string } ) {
    return (
        <label className={ cn( "block", className ) }>
            <span className="mb-1 block text-xs font-medium text-foreground/75">{ label }</span>
            { children }
            { hint && <span className="mt-1 block text-[11px] text-muted-foreground/75">{ hint }</span> }
        </label>
    );
}

export function Row( { children }: { children: React.ReactNode } ) {
    return <div className="grid grid-cols-2 gap-3">{ children }</div>;
}

export function SubmitButton( { children, className }: { children: React.ReactNode; className?: string } ) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={ pending } className={ cn( "h-11 w-full rounded-xl text-base", className ) }>
            { pending && <Loader2 className="animate-spin" size={ 16 } /> }
            { children }
        </Button>
    );
}

export function FormError( { error }: { error?: string | null } ) {
    if ( !error ) return null;
    return <p className="rounded-lg bg-status-critical/12 px-3 py-2 text-sm text-status-critical-text">{ error }</p>;
}

export const inputCls = "h-10 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25";

/** ₹ prefixed number input */
export function MoneyInput( { name, defaultValue, placeholder = "0", required, autoFocus, min }: { name: string; defaultValue?: number | null; placeholder?: string; required?: boolean; autoFocus?: boolean; min?: number } ) {
    return (
        <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/75">₹</span>
            <input type="number" inputMode="numeric" name={ name } defaultValue={ defaultValue ?? "" } placeholder={ placeholder } required={ required } autoFocus={ autoFocus } min={ min } step={ 1 }
                className={ cn( inputCls, "pl-7 tabular" ) } />
        </div>
    );
}
