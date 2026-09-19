"use client";

import { useData } from "@/components/shell/data-provider";
import { NavLink } from "@/lib/view";
import { buildDebts, buildGoalLines, phaseShares, surplusOf } from "@/lib/plan-lines";
import { PageHeader } from "@/components/ui/page";
import { PlanEditor } from "@/components/plan/plan-editor";

export function PlanView() {
    const { data: { accounts, goals, loans, settings, phases } } = useData();
    const live = accounts.filter( a => !a.archived );
    const surplus = surplusOf( settings );
    const debts = buildDebts( loans );
    const goalLines = buildGoalLines( goals, live );
    const saved = phaseShares( phases );
    // Remount the editor when what's saved changes, so edits always start from the stored plan.
    const key = JSON.stringify( [ saved, debts.map( d => [ d.id, d.monthly ] ), goalLines.map( g => g.id ), surplus ] );

    return (
        <div>
            <PageHeader title="Plan" subtitle="Debts first. Then split what's left." />
            { surplus <= 0 && (
                <div className="card mb-4 p-4 text-sm">
                    <div className="font-medium">Nothing to split yet.</div>
                    <p className="mt-1 text-muted-foreground">Set take-home and expenses under <NavLink to={ { tab: "more" } } className="text-primary underline-offset-2 hover:underline">More</NavLink>.</p>
                </div>
            ) }
            <PlanEditor key={ key } surplus={ surplus } debts={ debts } goals={ goalLines } saved={ saved } />
        </div>
    );
}
