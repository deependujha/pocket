"use client";

import { useState } from "react";
import { navigate } from "@/lib/view";
import { useRefresh } from "@/components/shell/data-provider";
import { Plus, Pencil, Trophy, Pause, Play, Trash2, Archive } from "lucide-react";
import type { Goal } from "@/generated/prisma/client";
import { deleteGoal, setGoalStatus } from "@/actions/goals";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { GoalForm, type LinkableAccount, type GoalOptionLite } from "./goal-form";

export function AddGoalButton( { accounts, goals, variant = "default" }: { accounts: LinkableAccount[]; goals: GoalOptionLite[]; variant?: "default" | "outline" } ) {
    const [ open, setOpen ] = useState( false );
    const refresh = useRefresh();
    return (
        <>
            <Button size="sm" variant={ variant } className="rounded-full" onClick={ () => setOpen( true ) }><Plus size={ 16 } /> New goal</Button>
            <Sheet open={ open } onOpenChange={ setOpen } title="New goal" description="Something specific, for someone, by some time.">
                <GoalForm accounts={ accounts } goals={ goals } onDone={ id => { setOpen( false ); refresh(); if ( id ) navigate( { tab: "goals", id } ); } } />
            </Sheet>
        </>
    );
}

export function EditGoalButton( { goal, accounts, goals }: { goal: Goal; accounts: LinkableAccount[]; goals: GoalOptionLite[] } ) {
    const [ open, setOpen ] = useState( false );
    const refresh = useRefresh();
    return (
        <>
            <Button size="sm" variant="outline" className="rounded-full" onClick={ () => setOpen( true ) }><Pencil size={ 14 } /> Edit</Button>
            <Sheet open={ open } onOpenChange={ setOpen } title="Edit goal">
                <GoalForm goal={ goal } accounts={ accounts } goals={ goals } onDone={ () => { setOpen( false ); refresh(); } } />
            </Sheet>
        </>
    );
}

export function GoalActions( { goal }: { goal: Goal } ) {
    const s = goal.status;
    const refresh = useRefresh();
    const set = async ( status: Parameters<typeof setGoalStatus>[ 1 ] ) => { await setGoalStatus( goal.id, status ); refresh(); };
    return (
        <div className="flex flex-wrap gap-2">
            { s !== "ACHIEVED" && <Button variant="outline" size="sm" className="rounded-full" onClick={ () => set( "ACHIEVED" ) }><Trophy size={ 14 } /> Mark achieved</Button> }
            { s === "ACTIVE" && <Button variant="outline" size="sm" className="rounded-full" onClick={ () => set( "PAUSED" ) }><Pause size={ 14 } /> Pause</Button> }
            { s !== "ACTIVE" && <Button variant="outline" size="sm" className="rounded-full" onClick={ () => set( "ACTIVE" ) }><Play size={ 14 } /> Reactivate</Button> }
            { s !== "ARCHIVED" && <Button variant="outline" size="sm" className="rounded-full" onClick={ () => set( "ARCHIVED" ) }><Archive size={ 14 } /> Archive</Button> }
            <Button variant="outline" size="sm" className="rounded-full text-status-critical-text" onClick={ async () => { if ( confirm( `Delete "${goal.name}"? Linked accounts are kept and become free money.` ) ) { await deleteGoal( goal.id ); navigate( { tab: "goals" } ); refresh(); } } }><Trash2 size={ 14 } /> Delete</Button>
        </div>
    );
}
