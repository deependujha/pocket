"use server";

import { revalidatePath } from "next/cache";
import { invalidateUser } from "@/lib/data";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { type ActionResult, fail, parseForm, reqInt } from "./_shared";

const schema = z.object( {
    monthlyIncome: reqInt,
    monthlyExpense: reqInt,
    emergencyMonths: reqInt.pipe( z.number().min( 1 ).max( 24 ) ),
} );

export async function saveSettings( _: ActionResult | null, fd: FormData ): Promise<ActionResult> {
    try {
        const user = await requireUser();
        const p = parseForm( schema, fd );
        if ( "error" in p ) return { ok: false, error: p.error };
        await prisma.settings.upsert( {
            where: { userId: user.id },
            update: { ...p.data, onboarded: true },
            create: { ...p.data, onboarded: true, userId: user.id },
        } );
        invalidateUser( user.id ); revalidatePath( "/", "layout" );
        return { ok: true };
    } catch ( e ) { return fail( e ); }
}
