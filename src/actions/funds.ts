"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { invalidateUser } from "@/lib/data";
import { type ActionResult, fail, optDate, optStr, parseForm, reqStr } from "./_shared";

const amount = z.string().trim().optional().transform( v => Math.round( Number( ( v ?? "" ).replace( /[^\d]/g, "" ) ) || 0 ) ).pipe( z.number().int().min( 0 ).max( 1e9 ) );

const fundSchema = z.object( { name: reqStr, emoji: optStr, target: amount, note: optStr } );

export async function saveFund( id: string | null, _: ActionResult | null, fd: FormData ): Promise<ActionResult> {
    try {
        const user = await requireUser();
        const p = parseForm( fundSchema, fd );
        if ( "error" in p ) return { ok: false, error: p.error };
        let fundId = id;
        if ( id ) await prisma.fund.updateMany( { where: { id, userId: user.id }, data: p.data } );
        else fundId = ( await prisma.fund.create( { data: { ...p.data, userId: user.id } } ) ).id;
        invalidateUser( user.id ); revalidatePath( "/", "layout" );
        return { ok: true, id: fundId ?? undefined };
    } catch ( e ) { return fail( e ); }
}

export async function deleteFund( id: string ) {
    const user = await requireUser();
    await prisma.fund.deleteMany( { where: { id, userId: user.id } } );
    invalidateUser( user.id ); revalidatePath( "/", "layout" );
}

const entrySchema = z.object( { kind: z.enum( [ "in", "out" ] ), amount: amount.pipe( z.number().positive( "Enter an amount" ) ), note: optStr, date: optDate } );

/** Put money in or take it out. Keeps the fund balance in step. */
export async function addEntry( fundId: string, _: ActionResult | null, fd: FormData ): Promise<ActionResult> {
    try {
        const user = await requireUser();
        const p = parseForm( entrySchema, fd );
        if ( "error" in p ) return { ok: false, error: p.error };
        const fund = await prisma.fund.findFirst( { where: { id: fundId, userId: user.id } } );
        if ( !fund ) return { ok: false, error: "Fund not found" };
        const delta = p.data.kind === "in" ? p.data.amount : -p.data.amount;
        await prisma.$transaction( [
            prisma.fundEntry.create( { data: { fundId, amount: delta, note: p.data.note, date: p.data.date ?? new Date() } } ),
            prisma.fund.update( { where: { id: fundId }, data: { balance: { increment: delta } } } ),
        ] );
        invalidateUser( user.id ); revalidatePath( "/", "layout" );
        return { ok: true };
    } catch ( e ) { return fail( e ); }
}

export async function deleteEntry( id: string ) {
    const user = await requireUser();
    const e = await prisma.fundEntry.findFirst( { where: { id, fund: { userId: user.id } } } );
    if ( !e ) return;
    await prisma.$transaction( [
        prisma.fundEntry.delete( { where: { id } } ),
        prisma.fund.update( { where: { id: e.fundId }, data: { balance: { decrement: e.amount } } } ),
    ] );
    invalidateUser( user.id ); revalidatePath( "/", "layout" );
}
