"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import type { Fund } from "@/generated/prisma/client";
import { addEntry, deleteEntry, deleteFund, saveFund } from "@/actions/funds";
import type { ActionResult } from "@/actions/_shared";
import { useRefresh, usePatch } from "@/components/shell/data-provider";
import { navigate } from "@/lib/view";
import { inr, toInputDate } from "@/lib/money";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AmountInput, Field, FormError, Row, SubmitButton, inputCls } from "@/components/ui/form-bits";
import { celebrate, buzz } from "@/lib/fx";

function FundForm( { fund, onDone }: { fund?: Fund; onDone: ( id?: string ) => void } ) {
    const refresh = useRefresh();
    const [ state, action ] = useActionState( async ( prev: ActionResult | null, fd: FormData ) => {
        const r = await saveFund( fund?.id ?? null, prev, fd );
        if ( r.ok ) { toast.success( fund ? "Saved" : "Fund added" ); refresh(); onDone( r.id ); }
        return r;
    }, null );
    return (
        <form action={ action } className="space-y-4">
            <div className="flex gap-3">
                <Field label="Icon" className="w-20"><input name="emoji" defaultValue={ fund?.emoji ?? "" } placeholder="🛟" maxLength={ 4 } className={ `${inputCls} text-center text-xl` } /></Field>
                <Field label="Name" className="flex-1"><input name="name" defaultValue={ fund?.name ?? "" } placeholder="Emergency, Goa, iPhone" required autoFocus className={ inputCls } /></Field>
            </div>
            <Field label="Target"><AmountInput name="target" defaultValue={ fund?.target ?? null } /></Field>
            <Field label="Note"><Textarea name="note" defaultValue={ fund?.note ?? "" } rows={ 2 } className="min-h-14" placeholder="Where it sits, when it matures" /></Field>
            <FormError error={ state && !state.ok ? state.error : null } />
            <SubmitButton className="btn-fund">{ fund ? "Save" : "Add fund" }</SubmitButton>
        </form>
    );
}

export function AddFundButton() {
    const [ open, setOpen ] = useState( false );
    return (
        <>
            <Button size="sm" className="btn-fund rounded-full" onClick={ () => setOpen( true ) }><Plus size={ 16 } /> Fund</Button>
            <Sheet open={ open } onOpenChange={ setOpen } title="New fund" description="Money set aside for something.">
                <FundForm onDone={ id => { setOpen( false ); if ( id ) navigate( { tab: "funds", id } ); } } />
            </Sheet>
        </>
    );
}

export function EditFundButton( { fund }: { fund: Fund } ) {
    const [ open, setOpen ] = useState( false );
    const refresh = useRefresh();
    return (
        <>
            <Button size="sm" variant="outline" className="rounded-full" onClick={ () => setOpen( true ) }><Pencil size={ 14 } /> Edit</Button>
            <Sheet open={ open } onOpenChange={ setOpen } title={ fund.name }>
                <FundForm fund={ fund } onDone={ () => setOpen( false ) } />
                <Button variant="outline" className="mt-3 w-full rounded-xl text-status-critical-text" onClick={ async () => {
                    if ( confirm( `Delete "${fund.name}" and its history?` ) ) { await deleteFund( fund.id ); setOpen( false ); navigate( { tab: "funds" } ); refresh(); }
                } }><Trash2 size={ 15 } /> Delete fund</Button>
            </Sheet>
        </>
    );
}

/** Put in / take out. Two big buttons on the detail screen open the same sheet. */
export function EntryButtons( { fund }: { fund: Fund } ) {
    const [ kind, setKind ] = useState<"in" | "out" | null>( null );
    const refresh = useRefresh();
    const patch = usePatch();
    const [ state, action ] = useActionState( async ( prev: ActionResult | null, fd: FormData ) => {
        const amt = Number( String( fd.get( "amount" ) ?? "" ).replace( /[^\d]/g, "" ) ) || 0;
        const delta = kind === "in" ? amt : -amt;
        const note = String( fd.get( "note" ) ?? "" ).trim() || null;
        if ( amt <= 0 ) return { ok: false, error: "Enter an amount" };
        // show it now; the server confirms in the background
        const crossed = kind === "in" && fund.target > 0 && fund.balance < fund.target && fund.balance + amt >= fund.target;
        setKind( null );
        patch( d => ( { ...d, funds: d.funds.map( f => f.id !== fund.id ? f : { ...f, balance: f.balance + delta, entries: [ { id: `tmp-${Date.now()}`, fundId: f.id, amount: delta, note, date: new Date() }, ...f.entries ] } ) } ) );
        if ( crossed ) { toast.success( `${fund.name} is full 🎉` ); celebrate( true ); }
        else { toast.success( kind === "in" ? `+${inr( amt )}` : `−${inr( amt )}` ); buzz(); }
        const r = await addEntry( fund.id, prev, fd );
        if ( !r.ok ) toast.error( r.error );
        refresh();
        return r;
    }, null );
    return (
        <>
            <div className="grid grid-cols-2 gap-2">
                <Button className="btn-fund h-12 rounded-xl text-base" onClick={ () => setKind( "in" ) }><ArrowDownToLine size={ 18 } /> Put in</Button>
                <Button variant="outline" className="h-12 rounded-xl text-base" onClick={ () => setKind( "out" ) }><ArrowUpFromLine size={ 18 } /> Take out</Button>
            </div>
            <Sheet open={ kind !== null } onOpenChange={ o => { if ( !o ) setKind( null ); } } title={ kind === "in" ? "Put in" : "Take out" } description={ `${fund.name} · ${inr( fund.balance )} now` }>
                <form action={ action } className="space-y-4" key={ kind ?? "none" }>
                    <input type="hidden" name="kind" value={ kind ?? "in" } />
                    <AmountInput name="amount" required autoFocus big />
                    <Row>
                        <Field label="Date"><input type="date" name="date" defaultValue={ toInputDate( new Date() ) } className={ inputCls } /></Field>
                        <Field label="Note"><input name="note" placeholder="Salary, bonus, spent on…" className={ inputCls } /></Field>
                    </Row>
                    <FormError error={ state && !state.ok ? state.error : null } />
                    <SubmitButton className={ kind === "in" ? "btn-fund" : "" }>{ kind === "in" ? "Add" : "Take out" }</SubmitButton>
                </form>
            </Sheet>
        </>
    );
}

export function DeleteEntryButton( { id }: { id: string } ) {
    const refresh = useRefresh();
    return (
        <button aria-label="Delete entry" className="rounded-full p-1.5 text-muted-foreground/45 hover:bg-muted hover:text-status-critical-text"
            onClick={ async () => { if ( confirm( "Remove this entry?" ) ) { await deleteEntry( id ); refresh(); } } }><Trash2 size={ 14 } /></button>
    );
}
