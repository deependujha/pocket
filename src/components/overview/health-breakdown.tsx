"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { HealthComponent } from "@/lib/finance";
import { Meter } from "@/components/ui/meter";
import { cn } from "@/lib/utils";

export function HealthBreakdown( { components }: { components: HealthComponent[] } ) {
    const [ open, setOpen ] = useState( false );
    return (
        <div className="mt-4 border-t border-border pt-3">
            <button onClick={ () => setOpen( o => !o ) } className="flex w-full items-center justify-between text-sm text-foreground/75" aria-expanded={ open }>
                <span>{ open ? "Hide" : "See" } what makes up the score</span>
                <ChevronDown size={ 16 } className={ cn( "transition-transform", open && "rotate-180" ) } />
            </button>
            { open && (
                <ul className="mt-3 space-y-3">
                    { components.map( c => (
                        <li key={ c.key }>
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">{ c.label }</span>
                                <span className="tabular text-muted-foreground">{ c.points }<span className="text-muted-foreground/45">/{ c.max }</span></span>
                            </div>
                            <Meter value={ c.points / c.max } height={ 5 } className="mt-1.5" color={ c.points / c.max >= 0.99 ? "var(--status-good)" : c.points / c.max >= 0.5 ? "var(--viz-1)" : "var(--status-serious)" } />
                            <div className="mt-1 text-xs text-muted-foreground">{ c.detail }. <span className="text-muted-foreground/75">{ c.tip }</span></div>
                        </li>
                    ) ) }
                </ul>
            ) }
        </div>
    );
}
