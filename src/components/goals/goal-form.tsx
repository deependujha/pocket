"use client";

import { useActionState, useState } from "react";
import type { ActionResult } from "@/actions/_shared";
import { toast } from "sonner";
import type { Goal } from "@/generated/prisma/client";
import type { GoalKind } from "@/generated/prisma/enums";
import { createGoal, updateGoal } from "@/actions/goals";
import { GOAL_KINDS, GOAL_KIND_ORDER, WHO_OPTIONS, ACCOUNT_TYPES } from "@/lib/constants";
import { inrCompact, toInputDate } from "@/lib/money";
import { Field, FormError, MoneyInput, Row, SubmitButton, inputCls } from "@/components/ui/form-bits";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type LinkableAccount = { id: string; name: string; type: keyof typeof ACCOUNT_TYPES; balance: number; goalId: string | null; goalName?: string | null };

export type GoalOptionLite = { id: string; name: string; emoji: string | null };

export function GoalForm( { goal, accounts, goals = [], onDone }: { goal?: Goal; accounts: LinkableAccount[]; goals?: GoalOptionLite[]; onDone?: ( id?: string ) => void } ) {
    const [ kind, setKind ] = useState<GoalKind>( goal?.kind ?? "PURCHASE" );
    const [ emoji, setEmoji ] = useState( goal?.emoji ?? GOAL_KINDS[ goal?.kind ?? "PURCHASE" ].emoji );
    const fn = goal ? updateGoal.bind( null, goal.id ) : createGoal;
    const [ state, action ] = useActionState( async ( prev: ActionResult | null, fd: FormData ) => {
        const r = await fn( prev, fd );
        if ( r.ok ) { toast.success( goal ? "Goal updated" : "Goal created" ); onDone?.( r.id ); }
        return r;
    }, null );

    const changeKind = ( k: GoalKind ) => {
        const wasDefault = emoji === GOAL_KINDS[ kind ].emoji;
        setKind( k );
        if ( wasDefault || !emoji ) setEmoji( GOAL_KINDS[ k ].emoji );
    };

    const linkable = accounts.filter( a => a.type !== "CREDIT_CARD" );

    return (
        <form action={ action } className="space-y-4">
            <Row>
                <Field label="Kind">
                    <Select name="kind" value={ kind } onChange={ e => changeKind( e.target.value as GoalKind ) }>
                        { GOAL_KIND_ORDER.map( k => <option key={ k } value={ k }>{ GOAL_KINDS[ k ].emoji } { GOAL_KINDS[ k ].label }</option> ) }
                    </Select>
                </Field>
                <Field label="For whom">
                    <Select name="forWhom" defaultValue={ goal?.forWhom ?? "Me" }>
                        { WHO_OPTIONS.map( w => <option key={ w } value={ w }>{ w }</option> ) }
                    </Select>
                </Field>
            </Row>
            <p className="-mt-2 text-xs text-muted-foreground/75">{ GOAL_KINDS[ kind ].hint }</p>

            <div className="flex gap-3">
                <Field label="Icon" className="w-16">
                    <input name="emoji" value={ emoji } onChange={ e => setEmoji( e.target.value ) } maxLength={ 4 } className={ `${inputCls} text-center text-lg` } />
                </Field>
                <Field label="Name" className="flex-1">
                    <input name="name" defaultValue={ goal?.name ?? "" } placeholder={ kind === "GIFT" ? "Phone for Mom" : kind === "TRAVEL" ? "Goa trip" : "iPhone at Diwali" } required autoFocus className={ inputCls } />
                </Field>
            </div>

            <Row>
                <Field label="Target amount">
                    <MoneyInput name="target" defaultValue={ goal?.target ?? null } required min={ 1 } />
                </Field>
                <Field label="Plan to add monthly" hint="Or leave blank to use linked SIPs">
                    <MoneyInput name="monthlyPlan" defaultValue={ goal?.monthlyPlan ?? null } min={ 0 } />
                </Field>
            </Row>

            <Row>
                <Field label="By when" hint="Optional">
                    <input type="date" name="targetDate" defaultValue={ toInputDate( goal?.targetDate ) } className={ inputCls } />
                </Field>
                <Field label="Priority">
                    <Select name="priority" defaultValue={ String( goal?.priority ?? 2 ) }>
                        <option value="1">High</option><option value="2">Normal</option><option value="3">Low</option>
                    </Select>
                </Field>
            </Row>

            <Field label="Or when…" hint="A trigger instead of a date">
                <input name="trigger" defaultValue={ goal?.trigger ?? "" } placeholder="…I get my bonus / she finishes college" className={ inputCls } />
            </Field>

            { kind !== "WEALTH" && (
                <Field label="When funded, send its monthly amount to" hint="Default: long-term wealth.">
                    <Select name="overflowGoalId" defaultValue={ goal?.overflowGoalId ?? "" }>
                        <option value="">Default (long-term wealth)</option>
                        { goals.filter( g => g.id !== goal?.id ).map( g => <option key={ g.id } value={ g.id }>{ g.emoji ? `${g.emoji} ` : "" }{ g.name }</option> ) }
                    </Select>
                </Field>
            ) }

            { linkable.length > 0 && (
                <fieldset>
                    <legend className="mb-1 text-xs font-medium text-foreground/75">Funded by</legend>
                    <p className="mb-2 text-[11px] text-muted-foreground/75">Balances of ticked accounts count toward this goal. An account can fund only one goal.</p>
                    <ul className="max-h-48 divide-y divide-border overflow-y-auto rounded-xl border border-input">
                        { linkable.map( a => {
                            const mine = a.goalId === goal?.id;
                            const other = a.goalId && !mine;
                            return (
                                <li key={ a.id }>
                                    <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm">
                                        <input type="checkbox" name="accountIds[]" value={ a.id } defaultChecked={ mine } className="h-4 w-4 accent-primary" />
                                        <span className="min-w-0 flex-1 truncate">{ a.name } <span className="text-xs text-muted-foreground/75">{ ACCOUNT_TYPES[ a.type ].short }{ other ? ` · now funds ${a.goalName}` : "" }</span></span>
                                        <span className="tabular text-muted-foreground">{ inrCompact( a.balance ) }</span>
                                    </label>
                                </li>
                            );
                        } ) }
                    </ul>
                </fieldset>
            ) }

            <Field label="Why this matters" hint="Optional. You'll see it when motivation dips.">
                <Textarea name="note" defaultValue={ goal?.note ?? "" } rows={ 2 } />
            </Field>

            <FormError error={ state && !state.ok ? state.error : null } />
            <SubmitButton>{ goal ? "Save changes" : "Create goal" }</SubmitButton>
        </form>
    );
}
