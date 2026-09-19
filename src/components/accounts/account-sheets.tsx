"use client";

import { useActionState, useState } from "react";
import type { ActionResult } from "@/actions/_shared";
import { navigate } from "@/lib/view";
import { useRefresh } from "@/components/shell/data-provider";
import { toast } from "sonner";
import { Plus, Pencil, RefreshCw, Trash2, Archive, ArchiveRestore } from "lucide-react";
import type { Account } from "@/generated/prisma/client";
import { addMovement, deleteAccount, setAccountArchived } from "@/actions/accounts";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { inr, toInputDate } from "@/lib/money";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field, FormError, MoneyInput, Row, SubmitButton, inputCls } from "@/components/ui/form-bits";
import { AccountForm, type GoalOption } from "./account-form";

export function AddAccountButton( { goals, defaultGoalId, label = "Add account", variant = "default" }: { goals: GoalOption[]; defaultGoalId?: string; label?: string; variant?: "default" | "outline" | "ghost" } ) {
    const [ open, setOpen ] = useState( false );
    const refresh = useRefresh();
    return (
        <>
            <Button size="sm" variant={ variant } className="rounded-full" onClick={ () => setOpen( true ) }><Plus size={ 16 } /> { label }</Button>
            <Sheet open={ open } onOpenChange={ setOpen } title="New account" description="Somewhere money physically sits.">
                <AccountForm goals={ goals } defaultGoalId={ defaultGoalId } onDone={ id => { setOpen( false ); refresh(); if ( id ) navigate( { tab: "money", id } ); } } />
            </Sheet>
        </>
    );
}

export function EditAccountButton( { account, goals }: { account: Account; goals: GoalOption[] } ) {
    const [ open, setOpen ] = useState( false );
    const refresh = useRefresh();
    return (
        <>
            <Button size="sm" variant="outline" className="rounded-full" onClick={ () => setOpen( true ) }><Pencil size={ 14 } /> Edit</Button>
            <Sheet open={ open } onOpenChange={ setOpen } title="Edit account">
                <AccountForm account={ account } goals={ goals } onDone={ () => { setOpen( false ); refresh(); } } />
            </Sheet>
        </>
    );
}

const MODES = [
    { key: "DEPOSIT", label: "Deposit", hint: "I put money in" },
    { key: "WITHDRAW", label: "Withdraw", hint: "I took money out" },
    { key: "INTEREST", label: "Interest", hint: "Bank credited interest" },
    { key: "MARKET", label: "Market", hint: "Value moved (+/−)" },
    { key: "SET", label: "Set balance", hint: "Match the real number" },
] as const;

export function UpdateBalanceButton( { account }: { account: Account } ) {
    const [ open, setOpen ] = useState( false );
    const [ mode, setMode ] = useState<( typeof MODES )[ number ][ "key" ]>( "SET" );
    const refresh = useRefresh();
    const [ state, action ] = useActionState( async ( prev: ActionResult | null, fd: FormData ) => {
        const r = await addMovement( account.id, prev, fd );
        if ( r.ok ) { toast.success( "Balance updated" ); setOpen( false ); refresh(); }
        return r;
    }, null );
    const meta = ACCOUNT_TYPES[ account.type ];
    const modes = MODES.filter( m => ( m.key !== "MARKET" || meta.hasInvested ) && ( m.key !== "INTEREST" || account.type !== "CREDIT_CARD" ) );

    return (
        <>
            <Button size="sm" className="rounded-full" onClick={ () => setOpen( true ) }><RefreshCw size={ 14 } /> Update balance</Button>
            <Sheet open={ open } onOpenChange={ setOpen } title={ account.name } description={ `Now ${inr( account.balance )}` }>
                <form action={ action } className="space-y-4">
                    <div className="flex flex-wrap gap-1.5">
                        { modes.map( m => (
                            <button type="button" key={ m.key } onClick={ () => setMode( m.key ) }
                                className={ `rounded-full border px-3 py-1.5 text-sm ${mode === m.key ? "border-primary bg-primary text-primary-foreground" : "border-input text-foreground/75 hover:bg-muted/60"}` }>
                                { m.label }
                            </button>
                        ) ) }
                    </div>
                    <input type="hidden" name="mode" value={ mode } />
                    <p className="-mt-2 text-xs text-muted-foreground/75">{ modes.find( m => m.key === mode )?.hint }</p>
                    <Row>
                        <Field label={ mode === "SET" ? "New balance" : mode === "MARKET" ? "Change (use − for loss)" : "Amount" }>
                            <MoneyInput name="amount" autoFocus required defaultValue={ mode === "SET" ? account.balance : null } key={ mode } />
                        </Field>
                        <Field label="Date">
                            <input type="date" name="date" defaultValue={ toInputDate( new Date() ) } className={ inputCls } />
                        </Field>
                    </Row>
                    <Field label="Note" hint="Optional">
                        <input name="note" placeholder="Salary, Diwali bonus…" className={ inputCls } />
                    </Field>
                    <FormError error={ state && !state.ok ? state.error : null } />
                    <SubmitButton>Save</SubmitButton>
                </form>
            </Sheet>
        </>
    );
}

export function AccountDangerZone( { account }: { account: Account } ) {
    const refresh = useRefresh();
    return (
        <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="rounded-full" onClick={ async () => { await setAccountArchived( account.id, !account.archived ); refresh(); } }>
                { account.archived ? <><ArchiveRestore size={ 14 } /> Unarchive</> : <><Archive size={ 14 } /> Archive</> }
            </Button>
            <Button variant="outline" size="sm" className="rounded-full text-status-critical-text" onClick={ async () => { if ( confirm( `Delete "${account.name}" and its history? This cannot be undone.` ) ) { await deleteAccount( account.id ); navigate( { tab: "money" } ); refresh(); } } }>
                <Trash2 size={ 14 } /> Delete
            </Button>
        </div>
    );
}
