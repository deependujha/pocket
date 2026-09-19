"use client";

import { useActionState, useState } from "react";
import type { ActionResult } from "@/actions/_shared";
import { toast } from "sonner";
import type { Account } from "@/generated/prisma/client";
import type { AccountType } from "@/generated/prisma/enums";
import { createAccount, updateAccount } from "@/actions/accounts";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_ORDER, LIQUIDITY } from "@/lib/constants";
import { toInputDate } from "@/lib/money";
import { Field, FormError, MoneyInput, Row, SubmitButton, inputCls } from "@/components/ui/form-bits";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type GoalOption = { id: string; name: string; emoji: string | null };

export function AccountForm( { account, goals, defaultGoalId, onDone }: { account?: Account; goals: GoalOption[]; defaultGoalId?: string; onDone?: ( id?: string ) => void } ) {
    const [ type, setType ] = useState<AccountType>( account?.type ?? "SAVINGS" );
    const meta = ACCOUNT_TYPES[ type ];
    const fn = account ? updateAccount.bind( null, account.id ) : createAccount;
    const [ state, action ] = useActionState( async ( prev: ActionResult | null, fd: FormData ) => {
        const r = await fn( prev, fd );
        if ( r.ok ) { toast.success( account ? "Account updated" : "Account added" ); onDone?.( r.id ); }
        return r;
    }, null );

    return (
        <form action={ action } className="space-y-4">
            <Row>
                <Field label="Type">
                    <Select name="type" value={ type } onChange={ e => setType( e.target.value as AccountType ) }>
                        { ACCOUNT_TYPE_ORDER.map( t => <option key={ t } value={ t }>{ ACCOUNT_TYPES[ t ].label }</option> ) }
                    </Select>
                </Field>
                <Field label="Name">
                    <input name="name" defaultValue={ account?.name ?? "" } placeholder={ type === "FD" ? "Travel FD" : meta.label } required className={ inputCls } />
                </Field>
            </Row>
            { meta.hint && <p className="-mt-2 text-xs text-muted-foreground/75">{ meta.hint }</p> }

            <Row>
                <Field label={ type === "CREDIT_CARD" ? "Amount owed now" : "Current value" }>
                    <MoneyInput name="balance" defaultValue={ account?.balance ?? null } required min={ 0 } />
                </Field>
                <Field label="Bank / platform" hint="Optional">
                    <input name="institution" defaultValue={ account?.institution ?? "" } placeholder="SBI, Zerodha…" className={ inputCls } />
                </Field>
            </Row>

            { meta.hasInvested && (
                <Field label="Amount invested (cost)" hint="What you actually put in. Gains = value − this.">
                    <MoneyInput name="invested" defaultValue={ account?.invested ?? null } min={ 0 } />
                </Field>
            ) }

            { meta.hasMaturity && (
                <>
                    <Row>
                        <Field label="Interest rate % p.a.">
                            <input type="number" step="0.01" inputMode="decimal" name="interestRate" defaultValue={ account?.interestRate ?? "" } placeholder="7.1" className={ `${inputCls} tabular` } />
                        </Field>
                        <Field label="Start date">
                            <input type="date" name="startDate" defaultValue={ toInputDate( account?.startDate ) } className={ inputCls } />
                        </Field>
                    </Row>
                    <Field label="Maturity date">
                        <input type="date" name="maturityDate" defaultValue={ toInputDate( account?.maturityDate ) } className={ inputCls } />
                    </Field>
                </>
            ) }

            { meta.hasSip && (
                <Row>
                    <Field label="Monthly contribution" hint="SIP / instalment">
                        <MoneyInput name="sipAmount" defaultValue={ account?.sipAmount ?? null } min={ 0 } />
                    </Field>
                    <Field label="Day of month">
                        <input type="number" name="sipDay" min={ 1 } max={ 31 } defaultValue={ account?.sipDay ?? "" } placeholder="5" className={ `${inputCls} tabular` } />
                    </Field>
                </Row>
            ) }

            { type !== "CREDIT_CARD" && (
                <Row>
                    <Field label="Funds which goal?" hint="Money here counts toward that goal.">
                        <Select name="goalId" defaultValue={ account?.goalId ?? defaultGoalId ?? "" }>
                            <option value="">None: free money</option>
                            { goals.map( g => <option key={ g.id } value={ g.id }>{ g.emoji ? `${g.emoji} ` : "" }{ g.name }</option> ) }
                        </Select>
                    </Field>
                    <Field label="Liquidity">
                        <Select name="liquidity" key={ type } defaultValue={ account?.type === type ? account.liquidity : meta.liquidity }>
                            { ( Object.keys( LIQUIDITY ) as ( keyof typeof LIQUIDITY )[] ).map( k => <option key={ k } value={ k }>{ LIQUIDITY[ k ].label }: { LIQUIDITY[ k ].hint }</option> ) }
                        </Select>
                    </Field>
                </Row>
            ) }

            <Field label="Note" hint="Optional">
                <Textarea name="note" defaultValue={ account?.note ?? "" } rows={ 2 } />
            </Field>

            <FormError error={ state && !state.ok ? state.error : null } />
            <SubmitButton>{ account ? "Save changes" : "Add account" }</SubmitButton>
        </form>
    );
}
