"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { invalidateUser } from "@/lib/data";
import { LoanDirection } from "@/generated/prisma/enums";
import { type ActionResult, fail, optDate, optStr, parseForm, reqStr } from "./_shared";

const amount = z.string().trim().optional().transform( v => Math.round( Number( ( v ?? "" ).replace( /[^\d]/g, "" ) ) || 0 ) ).pipe( z.number().int().min( 0 ).max( 1e9 ) );

const loanSchema = z.object( { name: reqStr, direction: z.nativeEnum( LoanDirection ), amount: amount.pipe( z.number().positive( "Enter an amount" ) ), endDate: optDate, note: optStr } );

export async function saveLoan( id: string | null, _: ActionResult | null, fd: FormData ): Promise<ActionResult> {
    try {
        const user = await requireUser();
        const p = parseForm( loanSchema, fd );
        if ( "error" in p ) return { ok: false, error: p.error };
        let loanId = id;
        if ( id ) await prisma.loan.updateMany( { where: { id, userId: user.id }, data: p.data } );
        else loanId = ( await prisma.loan.create( { data: { ...p.data, userId: user.id } } ) ).id;
        invalidateUser( user.id ); revalidatePath( "/", "layout" );
        return { ok: true, id: loanId ?? undefined };
    } catch ( e ) { return fail( e ); }
}

export async function setLoanClosed( id: string, closed: boolean ) {
    const user = await requireUser();
    await prisma.loan.updateMany( { where: { id, userId: user.id }, data: { closed } } );
    invalidateUser( user.id ); revalidatePath( "/", "layout" );
}

export async function deleteLoan( id: string ) {
    const user = await requireUser();
    await prisma.loan.deleteMany( { where: { id, userId: user.id } } );
    invalidateUser( user.id ); revalidatePath( "/", "layout" );
}

const paymentSchema = z.object( { amount: amount.pipe( z.number().positive( "Enter an amount" ) ), note: optStr, date: optDate } );

export async function addPayment( loanId: string, _: ActionResult | null, fd: FormData ): Promise<ActionResult> {
    try {
        const user = await requireUser();
        const p = parseForm( paymentSchema, fd );
        if ( "error" in p ) return { ok: false, error: p.error };
        const loan = await prisma.loan.findFirst( { where: { id: loanId, userId: user.id }, include: { payments: true } } );
        if ( !loan ) return { ok: false, error: "Loan not found" };
        const paid = loan.payments.reduce( ( s, x ) => s + x.amount, 0 ) + p.data.amount;
        await prisma.$transaction( [
            prisma.loanPayment.create( { data: { loanId, amount: p.data.amount, note: p.data.note, date: p.data.date ?? new Date() } } ),
            ...( paid >= loan.amount ? [ prisma.loan.update( { where: { id: loanId }, data: { closed: true } } ) ] : [] ),
        ] );
        invalidateUser( user.id ); revalidatePath( "/", "layout" );
        return { ok: true };
    } catch ( e ) { return fail( e ); }
}

export async function deletePayment( id: string ) {
    const user = await requireUser();
    const p = await prisma.loanPayment.findFirst( { where: { id, loan: { userId: user.id } } } );
    if ( !p ) return;
    await prisma.loanPayment.delete( { where: { id } } );
    invalidateUser( user.id ); revalidatePath( "/", "layout" );
}
