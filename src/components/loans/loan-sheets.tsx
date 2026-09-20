"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, IndianRupee, CheckCircle2, RotateCcw } from "lucide-react";
import type { Loan } from "@/generated/prisma/client";
import type { LoanDirection } from "@/generated/prisma/enums";
import { addPayment, deleteLoan, deletePayment, saveLoan, setLoanClosed } from "@/actions/loans";
import type { ActionResult } from "@/actions/_shared";
import { useRefresh, usePatch } from "@/components/shell/data-provider";
import { navigate } from "@/lib/view";
import { inr, toInputDate } from "@/lib/money";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AmountInput, Field, FormError, Row, SubmitButton, inputCls } from "@/components/ui/form-bits";
import { celebrate, buzz } from "@/lib/fx";

function LoanForm( { loan, onDone }: { loan?: Loan; onDone: ( id?: string ) => void } ) {
    const [ dir, setDir ] = useState<LoanDirection>( loan?.direction ?? "BORROWED" );
    const refresh = useRefresh();
    const [ state, action ] = useActionState( async ( prev: ActionResult | null, fd: FormData ) => {
        const r = await saveLoan( loan?.id ?? null, prev, fd );
        if ( r.ok ) { toast.success( loan ? "Saved" : "Loan added" ); refresh(); onDone( r.id ); }
        return r;
    }, null );
    return (
        <form action={ action } className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
                { ( [ [ "BORROWED", "I owe", "Took money" ], [ "LENT", "Owed to me", "Gave money" ] ] as const ).map( ( [ d, t, h ] ) => (
                    <button type="button" key={ d } onClick={ () => setDir( d ) }
                        className={ `rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${dir === d ? ( d === "LENT" ? "border-fund bg-fund-soft text-fund" : "border-loan bg-loan-soft text-loan" ) : "border-input hover:bg-muted/60"}` }>
                        <div className="font-medium">{ t }</div><div className={ `text-xs ${dir === d ? "opacity-80" : "text-muted-foreground"}` }>{ h }</div>
                    </button>
                ) ) }
            </div>
            <input type="hidden" name="direction" value={ dir } />
            <Field label={ dir === "LENT" ? "Who" : "To whom" }><input name="name" defaultValue={ loan?.name ?? "" } placeholder={ dir === "LENT" ? "Rahul" : "Dad, HDFC" } required autoFocus className={ inputCls } /></Field>
            <Row>
                <Field label="Amount"><AmountInput name="amount" defaultValue={ loan?.amount ?? null } required /></Field>
                <Field label="End date"><input type="date" name="endDate" defaultValue={ toInputDate( loan?.endDate ) } className={ inputCls } /></Field>
            </Row>
            <Field label="Note"><Textarea name="note" defaultValue={ loan?.note ?? "" } rows={ 2 } className="min-h-14" placeholder="For what, interest, terms" /></Field>
            <FormError error={ state && !state.ok ? state.error : null } />
            <SubmitButton className="btn-loan">{ loan ? "Save" : "Add loan" }</SubmitButton>
        </form>
    );
}

export function AddLoanButton() {
    const [ open, setOpen ] = useState( false );
    return (
        <>
            <Button size="sm" className="btn-loan rounded-full" onClick={ () => setOpen( true ) }><Plus size={ 16 } /> Loan</Button>
            <Sheet open={ open } onOpenChange={ setOpen } title="New loan">
                <LoanForm onDone={ id => { setOpen( false ); if ( id ) navigate( { tab: "loans", id } ); } } />
            </Sheet>
        </>
    );
}

export function EditLoanButton( { loan }: { loan: Loan } ) {
    const [ open, setOpen ] = useState( false );
    const refresh = useRefresh();
    return (
        <>
            <Button size="sm" variant="outline" className="rounded-full" onClick={ () => setOpen( true ) }><Pencil size={ 14 } /> Edit</Button>
            <Sheet open={ open } onOpenChange={ setOpen } title={ loan.name }>
                <LoanForm loan={ loan } onDone={ () => setOpen( false ) } />
                <div className="mt-3 flex gap-2">
                    <Button variant="outline" className="flex-1 rounded-xl" onClick={ async () => { await setLoanClosed( loan.id, !loan.closed ); setOpen( false ); refresh(); } }>
                        { loan.closed ? <><RotateCcw size={ 15 } /> Reopen</> : <><CheckCircle2 size={ 15 } /> Settled</> }
                    </Button>
                    <Button variant="outline" className="flex-1 rounded-xl text-status-critical-text" onClick={ async () => {
                        if ( confirm( `Delete this loan with ${loan.name}?` ) ) { await deleteLoan( loan.id ); setOpen( false ); navigate( { tab: "loans" } ); refresh(); }
                    } }><Trash2 size={ 15 } /> Delete</Button>
                </div>
            </Sheet>
        </>
    );
}

export function AddPaymentButton( { loan, left }: { loan: Loan; left: number } ) {
    const [ open, setOpen ] = useState( false );
    const refresh = useRefresh();
    const patch = usePatch();
    const [ state, action ] = useActionState( async ( prev: ActionResult | null, fd: FormData ) => {
        const amt = Number( String( fd.get( "amount" ) ?? "" ).replace( /[^\d]/g, "" ) ) || 0;
        const note = String( fd.get( "note" ) ?? "" ).trim() || null;
        if ( amt <= 0 ) return { ok: false, error: "Enter an amount" };
        const settles = amt >= left;
        setOpen( false );
        patch( d => ( { ...d, loans: d.loans.map( l => l.id !== loan.id ? l : { ...l, closed: l.closed || settles, payments: [ { id: `tmp-${Date.now()}`, loanId: l.id, amount: amt, note, date: new Date() }, ...l.payments ] } ) } ) );
        if ( settles ) { toast.success( `${loan.name}: settled 🎉` ); celebrate( true ); }
        else { toast.success( inr( amt ) + " recorded" ); buzz(); }
        const r = await addPayment( loan.id, prev, fd );
        if ( !r.ok ) toast.error( r.error );
        refresh();
        return r;
    }, null );
    return (
        <>
            <Button className={ `h-12 w-full rounded-xl text-base ${loan.direction === "LENT" ? "btn-fund" : "btn-loan"}` } onClick={ () => setOpen( true ) }><IndianRupee size={ 18 } /> { loan.direction === "LENT" ? "Got paid" : "Paid" }</Button>
            <Sheet open={ open } onOpenChange={ setOpen } title={ loan.direction === "LENT" ? `${loan.name} paid back` : `Paid ${loan.name}` } description={ `${inr( left )} left` }>
                <form action={ action } className="space-y-4">
                    <AmountInput name="amount" defaultValue={ left } required autoFocus big />
                    <Row>
                        <Field label="Date"><input type="date" name="date" defaultValue={ toInputDate( new Date() ) } className={ inputCls } /></Field>
                        <Field label="Note"><input name="note" placeholder="UPI, cash" className={ inputCls } /></Field>
                    </Row>
                    <FormError error={ state && !state.ok ? state.error : null } />
                    <SubmitButton>Save</SubmitButton>
                </form>
            </Sheet>
        </>
    );
}

export function DeletePaymentButton( { id }: { id: string } ) {
    const refresh = useRefresh();
    return (
        <button aria-label="Delete payment" className="rounded-full p-1.5 text-muted-foreground/45 hover:bg-muted hover:text-status-critical-text"
            onClick={ async () => { if ( confirm( "Remove this payment?" ) ) { await deletePayment( id ); refresh(); } } }><Trash2 size={ 14 } /></button>
    );
}
