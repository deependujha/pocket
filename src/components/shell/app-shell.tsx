"use client";

import { Suspense, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Gift, PiggyBank, HandCoins, UserRound } from "lucide-react";
import type { Everything } from "@/lib/data";
import type { SessionUser } from "@/lib/auth";
import { navigate, useView, type Tab } from "@/lib/view";
import { cn } from "@/lib/utils";
import { DataProvider, useData } from "./data-provider";
import { MotionProvider } from "./motion";
import { WishesView } from "@/components/views/wishes-view";
import { FundsView } from "@/components/views/funds-view";
import { FundDetailView } from "@/components/views/fund-detail-view";
import { LoansView } from "@/components/views/loans-view";
import { LoanDetailView } from "@/components/views/loan-detail-view";
import { MoreView } from "@/components/views/more-view";

const TABS: { tab: Tab; label: string; Icon: typeof Gift; color: string }[] = [
    { tab: "wishes", label: "Wishes", Icon: Gift, color: "var(--wish)" },
    { tab: "funds", label: "Funds", Icon: PiggyBank, color: "var(--fund)" },
    { tab: "loans", label: "Loans", Icon: HandCoins, color: "var(--loan)" },
    { tab: "more", label: "Me", Icon: UserRound, color: "var(--me)" },
];
const ORDER: Tab[] = TABS.map( t => t.tab );

export function AppShell( { initial, user }: { initial: Everything; user: SessionUser } ) {
    return (
        <MotionProvider>
            <DataProvider initial={ initial } user={ user }>
                <SyncBar />
                <main className="mx-auto w-full max-w-lg overflow-x-hidden px-4 pt-2" style={ { paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" } }>
                    <Suspense fallback={ null }><Screen /></Suspense>
                </main>
                <Suspense fallback={ null }><BottomNav /></Suspense>
            </DataProvider>
        </MotionProvider>
    );
}

/**
 * Which component to show. Tabs slide in the direction you moved; a detail
 * screen pushes in from the right and slides back out.
 */
function Screen() {
    const v = useView();
    const key = `${v.tab}:${v.id ?? ""}`;
    const depth = v.id ? 1 : 0;
    // Remember where we came from so the new screen slides in from the right side.
    const [ prev, setPrev ] = useState( { key, tab: v.tab, depth, dir: 0 } );
    let dir = prev.dir;
    if ( prev.key !== key ) {
        dir = depth !== prev.depth ? ( depth > prev.depth ? 1 : -1 ) : Math.sign( ORDER.indexOf( v.tab ) - ORDER.indexOf( prev.tab ) );
        setPrev( { key, tab: v.tab, depth, dir } );
    }
    let screen: React.ReactNode;
    switch ( v.tab ) {
        case "funds": screen = v.id ? <FundDetailView id={ v.id } /> : <FundsView />; break;
        case "loans": screen = v.id ? <LoanDetailView id={ v.id } /> : <LoansView />; break;
        case "more": screen = <MoreView />; break;
        default: screen = <WishesView />;
    }
    return (
        <AnimatePresence mode="popLayout" initial={ false } custom={ dir }>
            <motion.div key={ key } custom={ dir }
                variants={ { enter: ( d: number ) => ( { x: d * 40, opacity: 0 } ), center: { x: 0, opacity: 1 }, exit: ( d: number ) => ( { x: d * -40, opacity: 0 } ) } }
                initial="enter" animate="center" exit="exit"
                transition={ { type: "spring", stiffness: 380, damping: 34, mass: 0.8 } }>
                { screen }
            </motion.div>
        </AnimatePresence>
    );
}

function SyncBar() {
    const { refreshing } = useData();
    return (
        <div className={ cn( "pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden transition-opacity", refreshing ? "opacity-100" : "opacity-0" ) } aria-hidden="true">
            <div className="h-full w-1/3 animate-[sync_1s_ease-in-out_infinite] rounded-full bg-primary" />
        </div>
    );
}

function BottomNav() {
    const v = useView();
    return (
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/85 backdrop-blur-xl">
            <ul className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-2">
                { TABS.map( ( { tab, label, Icon, color } ) => {
                    const on = v.tab === tab;
                    return (
                        <li key={ tab } className="relative flex-1">
                            <button type="button" onClick={ () => navigate( { tab } ) } aria-current={ on ? "page" : undefined }
                                className={ cn( "relative flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] transition-colors", on ? "font-semibold" : "text-muted-foreground" ) }
                                style={ on ? { color } : undefined }>
                                { on && (
                                    <motion.span layoutId="nav-pill" className="absolute inset-x-3 top-1.5 h-9 rounded-full" style={ { background: `color-mix(in oklab, ${color} 18%, transparent)` } }
                                        transition={ { type: "spring", stiffness: 500, damping: 38 } } />
                                ) }
                                <motion.span animate={ on ? { scale: [ 1, 1.25, 1 ], rotate: [ 0, -8, 6, 0 ] } : { scale: 1 } } transition={ { duration: 0.45 } } className="relative">
                                    <Icon size={ 22 } strokeWidth={ on ? 2.4 : 1.75 } />
                                </motion.span>
                                <span className="relative">{ label }</span>
                            </button>
                        </li>
                    );
                } ) }
            </ul>
        </nav>
    );
}
