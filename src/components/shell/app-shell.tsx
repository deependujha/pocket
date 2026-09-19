"use client";

import { Suspense } from "react";
import { LayoutDashboard, Route, Target, Wallet, Settings } from "lucide-react";
import type { Everything } from "@/lib/data";
import type { SessionUser } from "@/lib/auth";
import { navigate, useView, type Tab } from "@/lib/view";
import { cn } from "@/lib/utils";
import { DataProvider, useData } from "./data-provider";
import { OverviewView } from "@/components/views/overview-view";
import { PlanView } from "@/components/views/plan-view";
import { GoalsView } from "@/components/views/goals-view";
import { GoalDetailView } from "@/components/views/goal-detail-view";
import { MoneyView } from "@/components/views/money-view";
import { AccountDetailView } from "@/components/views/account-detail-view";
import { LoanDetailView } from "@/components/views/loan-detail-view";
import { SettingsView } from "@/components/views/settings-view";

const TABS: { tab: Tab; label: string; Icon: typeof LayoutDashboard }[] = [
    { tab: "overview", label: "Overview", Icon: LayoutDashboard },
    { tab: "plan", label: "Plan", Icon: Route },
    { tab: "goals", label: "Goals", Icon: Target },
    { tab: "money", label: "Money", Icon: Wallet },
    { tab: "more", label: "More", Icon: Settings },
];

export function AppShell( { initial, user }: { initial: Everything; user: SessionUser } ) {
    return (
        <DataProvider initial={ initial } user={ user }>
            <SyncBar />
            <main className="mx-auto w-full max-w-2xl px-4 pb-28 pt-3">
                <Suspense fallback={ null }>
                    <Screen />
                </Suspense>
            </main>
            <Suspense fallback={ null }>
                <BottomNav />
            </Suspense>
        </DataProvider>
    );
}

/** Which component to show. Pure swap — no network. */
function Screen() {
    const v = useView();
    switch ( v.tab ) {
        case "plan": return <PlanView />;
        case "goals": return v.id ? <GoalDetailView id={ v.id } /> : <GoalsView />;
        case "money":
            if ( v.id && v.sub === "loans" ) return <LoanDetailView id={ v.id } />;
            if ( v.id ) return <AccountDetailView id={ v.id } />;
            return <MoneyView sub={ v.sub ?? "accounts" } />;
        case "more": return <SettingsView />;
        default: return <OverviewView />;
    }
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
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/90 backdrop-blur-md" style={ { paddingBottom: "env(safe-area-inset-bottom)" } }>
            <ul className="mx-auto flex h-16 max-w-2xl items-stretch justify-around">
                { TABS.map( ( { tab, label, Icon } ) => {
                    const on = v.tab === tab;
                    return (
                        <li key={ tab } className="flex-1">
                            <button type="button" onClick={ () => navigate( { tab } ) } aria-current={ on ? "page" : undefined }
                                className={ cn( "flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] transition-colors active:scale-95", on ? "text-primary font-medium" : "text-muted-foreground" ) }>
                                <Icon size={ 22 } strokeWidth={ on ? 2.25 : 1.75 } />
                                { label }
                            </button>
                        </li>
                    );
                } ) }
            </ul>
        </nav>
    );
}
