"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Track + fill. The fill springs to its width, and glows with a moving sheen once full.
 */
export function Meter( { value, color = "var(--primary)", className, height = 8 }: { value: number; color?: string; className?: string; height?: number } ) {
    const w = Math.max( 0, Math.min( 1, value ) ) * 100;
    const full = value >= 1;
    return (
        <div className={ cn( "relative w-full overflow-hidden rounded-full bg-[var(--viz-track)]", className ) } style={ { height } } role="progressbar" aria-valuemin={ 0 } aria-valuemax={ 100 } aria-valuenow={ Math.round( w ) }>
            <motion.div className={ cn( "relative h-full rounded-full", full && "meter-full" ) }
                style={ { background: color, boxShadow: full ? `0 0 12px ${color}` : undefined } }
                initial={ { width: 0 } } animate={ { width: `${w}%` } }
                transition={ { type: "spring", stiffness: 140, damping: 24, mass: 0.9 } } />
        </div>
    );
}
