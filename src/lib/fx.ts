"use client";

/** Small rewards. All of them respect the system's reduced-motion setting. */

const reduced = () => typeof window !== "undefined" && window.matchMedia?.( "(prefers-reduced-motion: reduce)" ).matches;

export function buzz( pattern: number | number[] = 12 ) {
    try { if ( "vibrate" in navigator ) navigator.vibrate( pattern ); } catch { /* not supported */ }
}

/** Confetti in the app's colours. `big` for finishing something, plain for smaller wins. */
export async function celebrate( big = false ) {
    if ( reduced() ) return;
    buzz( big ? [ 20, 40, 30 ] : 15 );
    const { default: confetti } = await import( "canvas-confetti" );
    const colors = [ "#a78bfa", "#f472b6", "#34d399", "#fbbf24", "#60a5fa" ];
    if ( big ) {
        const end = Date.now() + 900;
        const frame = () => {
            confetti( { particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors, ticks: 200 } );
            confetti( { particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors, ticks: 200 } );
            if ( Date.now() < end ) requestAnimationFrame( frame );
        };
        frame();
    } else {
        confetti( { particleCount: 60, spread: 70, startVelocity: 35, origin: { y: 0.75 }, colors, ticks: 160, scalar: 0.9 } );
    }
}
