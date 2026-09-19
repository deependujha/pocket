"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/actions/_shared";
import { toast } from "sonner";
import type { Settings } from "@/generated/prisma/client";
import { saveSettings } from "@/actions/settings";
import { useRefresh } from "@/components/shell/data-provider";
import { Field, FormError, MoneyInput, Row, SubmitButton, inputCls } from "@/components/ui/form-bits";

export function SettingsForm( { settings }: { settings: Settings | null } ) {
    const refresh = useRefresh();
    const [ state, action ] = useActionState( async ( prev: ActionResult | null, fd: FormData ) => {
        const r = await saveSettings( prev, fd );
        if ( r.ok ) { toast.success( "Saved" ); refresh(); }
        return r;
    }, null );
    return (
        <form action={ action } className="card space-y-4 p-5">
            <Row>
                <Field label="Monthly take-home"><MoneyInput name="monthlyIncome" defaultValue={ settings?.monthlyIncome ?? null } required /></Field>
                <Field label="Monthly essentials" hint="Rent, food, bills, EMIs"><MoneyInput name="monthlyExpense" defaultValue={ settings?.monthlyExpense ?? null } required /></Field>
            </Row>
            <Field label="Emergency cover (months)" hint="6 is standard; 9–12 if income is irregular.">
                <input type="number" name="emergencyMonths" min={ 1 } max={ 24 } defaultValue={ settings?.emergencyMonths ?? 6 } className={ `${inputCls} tabular` } required />
            </Field>
            <FormError error={ state && !state.ok ? state.error : null } />
            <SubmitButton>Save</SubmitButton>
        </form>
    );
}
