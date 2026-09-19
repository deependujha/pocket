"use client";

import { useActionState, useState } from "react";
import type { ActionResult } from "@/actions/_shared";
import { navigate } from "@/lib/view";
import { useRefresh } from "@/components/shell/data-provider";
import { toast } from "sonner";
import { Plus, Pencil, CheckCircle2, RotateCcw, Trash2, IndianRupee } from "lucide-react";
import type { Loan } from "@/generated/prisma/client";
import { addLoanPayment, deleteLoan, deleteLoanPayment, setLoanClosed } from "@/actions/loans";
import { inr, toInputDate } from "@/lib/money";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field, FormError, MoneyInput, Row, SubmitButton, inputCls } from "@/components/ui/form-bits";
import { LoanForm } from "./loan-form";

type GoalOpt = { id: string; name: string; emoji: string | null };

export function AddLoanButton( { goals = [], variant = "default" }: { goals?: GoalOpt[]; variant?: "default" | "outline" } ) {
    const [ open, setOpen ] = useState( false );
    const refresh = useRefresh();
    return (
        <>
            <Button size="sm" variant={ variant } className="rounded-full" onClick={ () => setOpen( true ) }><Plus size={ 16 } /> Add loan</Button>
            <Sheet open={ open } onOpenChange={ setOpen } title="New loan" description="Money you lent, or money you owe.">
                <LoanForm goals={ goals } onDone={ id => { setOpen( false ); refresh(); if ( id ) navigate( { tab: "money", sub: "loans", id } ); } } />
            </Sheet>
        </>
    );
}

export function EditLoanButton( { loan, goals = [] }: { loan: Loan; goals?: GoalOpt[] } ) {
    const [ open, setOpen ] = useState( false );
    const refresh = useRefresh();
    return (
        <>
            <Button size="sm" variant="outline" className="rounded-full" onClick={ () => setOpen( true ) }><Pencil size={ 14 } /> Edit</Button>
            <Sheet open={ open } onOpenChange={ setOpen } title="Edit loan"><LoanForm loan={ loan } goals={ goals } onDone={ () => { setOpen( false ); refresh(); } } /></Sheet>
        </>
    );
}

export function AddPaymentButton( { loan, outstanding }: { loan: Loan; outstanding: number } ) {
    const [ open, setOpen ] = useState( false );
    const refresh = useRefresh();
    const [ state, action ] = useActionState( async ( prev: ActionResult | null, fd: FormData ) => {
        const r = await addLoanPayment( loan.id, prev, fd );
        if ( r.ok ) { toast.success( "Payment recorded" ); setOpen( false ); refresh(); }
        return r;
    }, null );
    return (
        <>
            <Button size="sm" className="rounded-full" onClick={ () => setOpen( true ) }><IndianRupee size={ 14 } /> { loan.direction === "LENT" ? "Got paid back" : "Record repayment" }</Button>
            <Sheet open={ open } onOpenChange={ setOpen } title={ loan.direction === "LENT" ? `${loan.counterparty} paid back` : `Repaid ${loan.counterparty}` } description={ `${inr( outstanding )} outstanding` }>
                <form action={ action } className="space-y-4">
                    <Row>
                        <Field label="Amount"><MoneyInput name="amount" required min={ 1 } autoFocus defaultValue={ loan.emi ?? outstanding } /></Field>
                        <Field label="Date"><input type="date" name="date" defaultValue={ toInputDate( new Date() ) } className={ inputCls } /></Field>
                    </Row>
                    <Field label="Note" hint="Optional"><input name="note" className={ inputCls } placeholder="UPI, cash…" /></Field>
                    <FormError error={ state && !state.ok ? state.error : null } />
                    <SubmitButton>Save</SubmitButton>
                </form>
            </Sheet>
        </>
    );
}

export function LoanActions( { loan }: { loan: Loan } ) {
    const refresh = useRefresh();
    return (
        <div className="flex flex-wrap gap-2">
            { loan.status === "ACTIVE"
                ? <Button variant="outline" size="sm" className="rounded-full" onClick={ async () => { await setLoanClosed( loan.id, true ); refresh(); } }><CheckCircle2 size={ 14 } /> Mark settled</Button>
                : <Button variant="outline" size="sm" className="rounded-full" onClick={ async () => { await setLoanClosed( loan.id, false ); refresh(); } }><RotateCcw size={ 14 } /> Reopen</Button> }
            <Button variant="outline" size="sm" className="rounded-full text-status-critical-text" onClick={ async () => { if ( confirm( `Delete this loan with ${loan.counterparty}?` ) ) { await deleteLoan( loan.id ); navigate( { tab: "money", sub: "loans" } ); refresh(); } } }><Trash2 size={ 14 } /> Delete</Button>
        </div>
    );
}

export function DeletePaymentButton( { id }: { id: string } ) {
    const refresh = useRefresh();
    return (
        <button aria-label="Delete payment" className="rounded-full p-1.5 text-muted-foreground/45 hover:bg-muted hover:text-status-critical-text"
            onClick={ async () => { if ( confirm( "Remove this payment?" ) ) { await deleteLoanPayment( id ); refresh(); } } }><Trash2 size={ 14 } /></button>
    );
}
