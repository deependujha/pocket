"use client";

import { useData } from "@/components/shell/data-provider";
import { NavLink } from "@/lib/view";
import { buildPlanLines, surplusOf } from "@/lib/plan-lines";
import { PageHeader } from "@/components/ui/page";
import { PlanEditor } from "@/components/plan/plan-editor";

export function PlanView() {
    const { data: { accounts, goals, loans, settings } } = useData();
    const lines = buildPlanLines( goals, accounts.filter( a => !a.archived ), loans );
    const surplus = surplusOf( settings );
    const goalOptions = goals.filter( g => g.status === "ACTIVE" ).map( g => ( { id: g.id, name: g.name, emoji: g.emoji } ) );
    // Remount the editor when the saved plan changes, so its local edits start from what's stored.
    const key = lines.map( l => `${l.id}:${l.monthly}:${l.overflowId ?? ""}` ).join( "|" ) + `|${surplus}|${settings?.planNote ?? ""}`;

    return (
        <div>
            <PageHeader title="Plan" subtitle="Where each month's surplus goes, and what happens when a goal fills up." />
            { surplus <= 0 && (
                <div className="card mb-4 p-4 text-sm">
                    <div className="font-medium">No surplus to plan with yet.</div>
                    <p className="mt-1 text-muted-foreground">Set your monthly take-home and expenses under <NavLink to={ { tab: "more" } } className="text-primary underline-offset-2 hover:underline">More</NavLink>. Surplus = take-home − expenses.</p>
                </div>
            ) }
            <PlanEditor key={ key } lines={ lines } surplus={ surplus } income={ settings?.monthlyIncome ?? 0 } expense={ settings?.monthlyExpense ?? 0 } goalOptions={ goalOptions } note={ settings?.planNote ?? "" } />
        </div>
    );
}
