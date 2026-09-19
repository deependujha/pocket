"use server";

import { revalidatePath } from "next/cache";
import { invalidateUser } from "@/lib/data";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { LoanDirection } from "@/generated/prisma/enums";
import { type ActionResult, fail, optDate, optFloat, optInt, optStr, parseForm, reqInt, reqStr } from "./_shared";

const loanSchema = z.object( {
    direction: z.nativeEnum( LoanDirection ),
    counterparty: reqStr,
    purpose: optStr,
    principal: reqInt.pipe( z.number().positive( "Amount must be positive" ) ),
    interestRate: optFloat,
    startDate: optDate,
    dueDate: optDate,
    emi: optInt,
    note: optStr,
} );

export async function createLoan( _: ActionResult | null, fd: FormData ): Promise<ActionResult> {
    try {
        const user = await requireUser();
        const p = parseForm( loanSchema, fd );
        if ( "error" in p ) return { ok: false, error: p.error };
        const { startDate, ...data } = p.data;
        const l = await prisma.loan.create( { data: { ...data, startDate: startDate ?? new Date(), userId: user.id } } );
        invalidateUser( user.id ); revalidatePath( "/", "layout" );
        return { ok: true, id: l.id };
    } catch ( e ) { return fail( e ); }
}

export async function updateLoan( id: string, _: ActionResult | null, fd: FormData ): Promise<ActionResult> {
    try {
        const user = await requireUser();
        const p = parseForm( loanSchema, fd );
        if ( "error" in p ) return { ok: false, error: p.error };
        const { startDate, ...data } = p.data;
        const r = await prisma.loan.updateMany( { where: { id, userId: user.id }, data: { ...data, ...( startDate ? { startDate } : {} ) } } );
        if ( r.count === 0 ) return { ok: false, error: "Loan not found" };
        invalidateUser( user.id ); revalidatePath( "/", "layout" );
        return { ok: true, id };
    } catch ( e ) { return fail( e ); }
}

export async function setLoanClosed( id: string, closed: boolean ) {
    const user = await requireUser();
    await prisma.loan.updateMany( { where: { id, userId: user.id }, data: { status: closed ? "CLOSED" : "ACTIVE", closedAt: closed ? new Date() : null } } );
    invalidateUser( user.id ); revalidatePath( "/", "layout" );
}

export async function deleteLoan( id: string ) {
    const user = await requireUser();
    await prisma.loan.deleteMany( { where: { id, userId: user.id } } );
    invalidateUser( user.id ); revalidatePath( "/", "layout" );
}

const paymentSchema = z.object( {
    amount: reqInt.pipe( z.number().positive( "Amount must be positive" ) ),
    date: optDate,
    note: optStr,
} );

export async function addLoanPayment( loanId: string, _: ActionResult | null, fd: FormData ): Promise<ActionResult> {
    try {
        const user = await requireUser();
        const p = parseForm( paymentSchema, fd );
        if ( "error" in p ) return { ok: false, error: p.error };
        const loan = await prisma.loan.findFirst( { where: { id: loanId, userId: user.id }, include: { payments: true } } );
        if ( !loan ) return { ok: false, error: "Loan not found" };
        const paid = loan.payments.reduce( ( s, x ) => s + x.amount, 0 );
        const nowPaid = paid + p.data.amount;
        await prisma.$transaction( [
            prisma.loanPayment.create( { data: { loanId, amount: p.data.amount, date: p.data.date ?? new Date(), note: p.data.note } } ),
            ...( nowPaid >= loan.principal && loan.status === "ACTIVE"
                ? [ prisma.loan.update( { where: { id: loanId }, data: { status: "CLOSED", closedAt: new Date() } } ) ]
                : [] ),
        ] );
        invalidateUser( user.id ); revalidatePath( "/", "layout" );
        return { ok: true };
    } catch ( e ) { return fail( e ); }
}

export async function deleteLoanPayment( id: string ) {
    const user = await requireUser();
    const pay = await prisma.loanPayment.findFirst( { where: { id, loan: { userId: user.id } } } );
    if ( !pay ) return;
    await prisma.loanPayment.delete( { where: { id } } );
    invalidateUser( user.id ); revalidatePath( "/", "layout" );
}
