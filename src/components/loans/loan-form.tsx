"use client";

import { useActionState, useState } from "react";
import type { ActionResult } from "@/actions/_shared";
import { toast } from "sonner";
import type { Loan } from "@/generated/prisma/client";
import type { LoanDirection } from "@/generated/prisma/enums";
import { createLoan, updateLoan } from "@/actions/loans";
import { LOAN_DIRECTIONS } from "@/lib/constants";
import { toInputDate } from "@/lib/money";
import { Field, FormError, MoneyInput, Row, SubmitButton, inputCls } from "@/components/ui/form-bits";
import { Textarea } from "@/components/ui/textarea";

export function LoanForm( { loan, onDone }: { loan?: Loan; goals?: { id: string; name: string; emoji: string | null }[]; onDone?: ( id?: string ) => void } ) {
    const [ dir, setDir ] = useState<LoanDirection>( loan?.direction ?? "LENT" );
    const fn = loan ? updateLoan.bind( null, loan.id ) : createLoan;
    const [ state, action ] = useActionState( async ( prev: ActionResult | null, fd: FormData ) => {
        const r = await fn( prev, fd );
        if ( r.ok ) { toast.success( loan ? "Loan updated" : "Loan added" ); onDone?.( r.id ); }
        return r;
    }, null );

    return (
        <form action={ action } className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
                { ( [ "LENT", "BORROWED" ] as LoanDirection[] ).map( d => (
                    <button type="button" key={ d } onClick={ () => setDir( d ) }
                        className={ `rounded-xl border px-3 py-2.5 text-left text-sm ${dir === d ? "border-primary bg-primary text-primary-foreground" : "border-input hover:bg-muted/60"}` }>
                        <div className="font-medium">{ LOAN_DIRECTIONS[ d ].label }</div>
                        <div className={ `text-xs ${dir === d ? "text-muted-foreground/45" : "text-muted-foreground"}` }>{ LOAN_DIRECTIONS[ d ].hint }</div>
                    </button>
                ) ) }
            </div>
            <input type="hidden" name="direction" value={ dir } />
            <Row>
                <Field label={ dir === "LENT" ? "Who" : "Lender" }>
                    <input name="counterparty" defaultValue={ loan?.counterparty ?? "" } placeholder={ dir === "LENT" ? "Rahul" : "HDFC Bank / Dad" } required autoFocus className={ inputCls } />
                </Field>
                <Field label="Amount">
                    <MoneyInput name="principal" defaultValue={ loan?.principal ?? null } required min={ 1 } />
                </Field>
            </Row>
            <Field label="For what" hint="Optional">
                <input name="purpose" defaultValue={ loan?.purpose ?? "" } placeholder="Bike, wedding, tuition…" className={ inputCls } />
            </Field>
            <Row>
                <Field label="Given on">
                    <input type="date" name="startDate" defaultValue={ toInputDate( loan?.startDate ?? new Date() ) } className={ inputCls } />
                </Field>
                <Field label="Due by" hint="Optional">
                    <input type="date" name="dueDate" defaultValue={ toInputDate( loan?.dueDate ) } className={ inputCls } />
                </Field>
            </Row>
            <Row>
                <Field label="Interest % p.a." hint="Blank = interest free">
                    <input type="number" step="0.01" inputMode="decimal" name="interestRate" defaultValue={ loan?.interestRate ?? "" } className={ `${inputCls} tabular` } />
                </Field>
                <Field label="Per month" hint="Paid before the split">
                    <MoneyInput name="emi" defaultValue={ loan?.emi ?? null } min={ 0 } />
                </Field>
            </Row>
            <Field label="Note" hint="Optional">
                <Textarea name="note" defaultValue={ loan?.note ?? "" } rows={ 2 } />
            </Field>
            <FormError error={ state && !state.ok ? state.error : null } />
            <SubmitButton>{ loan ? "Save changes" : "Add loan" }</SubmitButton>
        </form>
    );
}
