"use client";

import { useActionState, useState } from "react";
import type { Settings } from "@/generated/prisma/client";
import { completeOnboarding } from "@/actions/onboarding";
import { inr } from "@/lib/money";
import { Field, FormError, MoneyInput, Row, SubmitButton, inputCls } from "@/components/ui/form-bits";

const GOALS = [
    { key: "jobLoss", emoji: "🛟", label: "Job-loss cover", hint: "If salary stops", field: "jobLossTarget", def: 500000 },
    { key: "health", emoji: "🏥", label: "Health emergency", hint: "Hospital, family", field: "healthTarget", def: 1000000 },
    { key: "fun", emoji: "🎉", label: "Fun fund", hint: "Travel, gadgets, anything", field: "funTarget", def: 300000 },
    { key: "wealth", emoji: "🌱", label: "Long-term wealth", hint: "SIPs, no end date", field: null, def: 0 },
] as const;

const STARTERS = [
    { key: "savings", label: "Savings account", hint: "Your main bank account" },
    { key: "nifty", label: "Nifty 50 SIP", hint: "Long-term equity" },
    { key: "gold", label: "Gold ETF SIP", hint: "Long-term hedge" },
    { key: "jobLossFd", label: "Job-loss cover RD", hint: "Monthly deposit, linked to the goal" },
    { key: "healthFd", label: "Health fund RD", hint: "Linked to the health goal" },
    { key: "funFd", label: "Fun fund RD", hint: "Linked to the fun goal" },
    { key: "card", label: "Credit card", hint: "Tracks what you owe" },
];

export function OnboardingForm( { settings }: { settings: Settings | null } ) {
    const [ state, action ] = useActionState( completeOnboarding, null );
    const [ income, setIncome ] = useState( settings?.monthlyIncome || 0 );
    const [ expense, setExpense ] = useState( settings?.monthlyExpense || 0 );
    const surplus = Math.max( 0, income - expense );

    return (
        <form action={ action } className="space-y-4">
            <div className="card space-y-4 p-5">
                <Row>
                    <Field label="Monthly take-home" hint="Salary after tax">
                        <input type="number" inputMode="numeric" name="monthlyIncome" value={ income || "" } onChange={ e => setIncome( Number( e.target.value ) || 0 ) } placeholder="170000" required autoFocus className={ `${inputCls} tabular` } />
                    </Field>
                    <Field label="Monthly expenses" hint="Rent, food, bills, parents' insurance — anything you won't track">
                        <input type="number" inputMode="numeric" name="monthlyExpense" value={ expense || "" } onChange={ e => setExpense( Number( e.target.value ) || 0 ) } placeholder="64000" required className={ `${inputCls} tabular` } />
                    </Field>
                </Row>
                <div className="flex items-center justify-between rounded-xl bg-accent px-4 py-3 text-sm">
                    <span className="text-accent-foreground">Surplus to put away each month</span>
                    <span className="tabular text-lg font-semibold text-accent-foreground">{ inr( surplus ) }</span>
                </div>
                <Row>
                    <Field label="Job-loss cover (months)" hint="Used for the health score">
                        <input type="number" name="emergencyMonths" defaultValue={ settings?.emergencyMonths ?? 6 } min={ 1 } max={ 24 } className={ `${inputCls} tabular` } required />
                    </Field>
                    <Field label="Savings balance today" hint="Optional">
                        <MoneyInput name="savingsBalance" />
                    </Field>
                </Row>
            </div>

            <fieldset className="card p-5">
                <legend className="sr-only">Starter goals</legend>
                <div className="mb-1 text-sm font-medium">Goals to create</div>
                <p className="mb-3 text-xs text-muted-foreground">Targets are editable now and later.</p>
                <ul className="divide-y divide-border rounded-xl border border-input">
                    { GOALS.map( g => (
                        <li key={ g.key } className="flex items-center gap-3 px-3 py-2.5">
                            <input type="checkbox" name="goals[]" value={ g.key } defaultChecked className="h-4 w-4 accent-primary" />
                            <span className="text-lg leading-none">{ g.emoji }</span>
                            <span className="min-w-0 flex-1"><span className="block text-sm">{ g.label }</span><span className="block text-xs text-muted-foreground">{ g.hint }</span></span>
                            { g.field ? <div className="w-32"><MoneyInput name={ g.field } defaultValue={ g.def } /></div> : <span className="w-32 text-right text-xs text-muted-foreground">no target</span> }
                        </li>
                    ) ) }
                </ul>
            </fieldset>

            <div className="card p-5">
                <div className="mb-1 text-sm font-medium">Anything to repay right now?</div>
                <p className="mb-3 text-xs text-muted-foreground">Optional. It becomes the first line of your plan and its EMI rolls into the job-loss cover once cleared.</p>
                <div className="grid grid-cols-3 gap-3">
                    <Field label="Amount"><MoneyInput name="debtAmount" /></Field>
                    <Field label="To whom"><input name="debtTo" placeholder="Dad, HDFC…" className={ inputCls } /></Field>
                    <Field label="Per month"><MoneyInput name="debtEmi" /></Field>
                </div>
            </div>

            <fieldset className="card p-5">
                <legend className="sr-only">Starter accounts</legend>
                <div className="mb-1 text-sm font-medium">Accounts to create</div>
                <p className="mb-3 text-xs text-muted-foreground">Balances start at zero; update them from the Money tab as you go.</p>
                <ul className="divide-y divide-border rounded-xl border border-input">
                    { STARTERS.map( s => (
                        <li key={ s.key }>
                            <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm">
                                <input type="checkbox" name="starters[]" value={ s.key } defaultChecked className="h-4 w-4 accent-primary" />
                                <span className="flex-1">{ s.label }<span className="ml-2 text-xs text-muted-foreground">{ s.hint }</span></span>
                            </label>
                        </li>
                    ) ) }
                </ul>
            </fieldset>

            <FormError error={ state && !state.ok ? state.error : null } />
            <SubmitButton>Build my plan</SubmitButton>
        </form>
    );
}
