"use client";

import { MotionConfig, motion, useMotionValue, useSpring, useTransform, animate, type Variants } from "motion/react";
import { useEffect, useState } from "react";
import { inr } from "@/lib/money";

export function MotionProvider( { children }: { children: React.ReactNode } ) {
    return <MotionConfig reducedMotion="user" transition={ { type: "spring", stiffness: 420, damping: 34, mass: 0.8 } }>{ children }</MotionConfig>;
}

/* ---------- staggered lists ---------- */

const listVariants: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.045, delayChildren: 0.02 } } };
const itemVariants: Variants = {
    hidden: { opacity: 0, y: 14, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 480, damping: 32 } },
    exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15 } },
};

export function List( { children, className }: { children: React.ReactNode; className?: string } ) {
    return <motion.ul variants={ listVariants } initial="hidden" animate="show" className={ className }>{ children }</motion.ul>;
}

export function Item( { children, className, layoutId }: { children: React.ReactNode; className?: string; layoutId?: string } ) {
    return <motion.li layout layoutId={ layoutId } variants={ itemVariants } exit="exit" className={ className }>{ children }</motion.li>;
}

/** A block that fades up on mount. */
export function Rise( { children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number } ) {
    return <motion.div initial={ { opacity: 0, y: 12 } } animate={ { opacity: 1, y: 0 } } transition={ { type: "spring", stiffness: 420, damping: 32, delay } } className={ className }>{ children }</motion.div>;
}

/* ---------- animated rupee amount ---------- */

/** Counts from the previous value to the new one, and flashes on change. */
export function Count( { value, className, format = inr }: { value: number; className?: string; format?: ( n: number ) => string } ) {
    const mv = useMotionValue( value );
    const spring = useSpring( mv, { stiffness: 120, damping: 22, mass: 0.9 } );
    const text = useTransform( spring, v => format( Math.round( v ) ) );
    // Count how many times the value changed; that key restarts the flash.
    const [ seen, setSeen ] = useState( { value, flash: 0 } );
    if ( seen.value !== value ) setSeen( { value, flash: seen.flash + 1 } );
    const flash = seen.flash;
    useEffect( () => { mv.set( value ); }, [ value, mv ] );
    return (
        <motion.span key={ flash } className={ className }
            initial={ flash ? { scale: 1.06, filter: "brightness(1.35)" } : false }
            animate={ { scale: 1, filter: "brightness(1)" } }
            transition={ { type: "spring", stiffness: 300, damping: 18 } }>
            { text }
        </motion.span>
    );
}

/* ---------- press feedback ---------- */

export const Tap = motion.button;
export const TapLink = motion.a;
export const pressProps = { whileTap: { scale: 0.97 }, transition: { type: "spring" as const, stiffness: 600, damping: 30 } };

/** Gentle float for empty-state icons. */
export function Float( { children }: { children: React.ReactNode } ) {
    return <motion.div animate={ { y: [ 0, -6, 0 ] } } transition={ { duration: 2.6, repeat: Infinity, ease: "easeInOut" } }>{ children }</motion.div>;
}

export { motion, animate };
