"use server";

import { revalidatePath } from "next/cache";
import { invalidateUser } from "@/lib/data";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { AccountType, Liquidity, MovementKind } from "@/generated/prisma/enums";
import { type ActionResult, fail, optDate, optFloat, optInt, optStr, parseForm, reqInt, reqStr } from "./_shared";

const accountSchema = z.object( {
    name: reqStr,
    type: z.nativeEnum( AccountType ),
    institution: optStr,
    liquidity: z.nativeEnum( Liquidity ).optional(),
    balance: reqInt,
    invested: optInt,
    interestRate: optFloat,
    startDate: optDate,
    maturityDate: optDate,
    sipAmount: optInt,
    sipDay: optInt,
    goalId: optStr,
    note: optStr,
} );

function normalise( d: z.infer<typeof accountSchema> ) {
    const meta = ACCOUNT_TYPES[ d.type ];
    return {
        ...d,
        liquidity: d.liquidity ?? meta.liquidity,
        invested: meta.hasInvested ? ( d.invested ?? d.balance ) : null,
        interestRate: meta.hasMaturity ? d.interestRate : null,
        startDate: meta.hasMaturity ? d.startDate : null,
        maturityDate: meta.hasMaturity ? d.maturityDate : null,
        sipAmount: meta.hasSip ? d.sipAmount : null,
        sipDay: meta.hasSip ? d.sipDay : null,
        goalId: d.type === "CREDIT_CARD" ? null : d.goalId,
    };
}

export async function createAccount( _: ActionResult | null, fd: FormData ): Promise<ActionResult> {
    try {
        const user = await requireUser();
        const p = parseForm( accountSchema, fd );
        if ( "error" in p ) return { ok: false, error: p.error };
        const data = normalise( p.data );
        if ( data.goalId ) {
            const g = await prisma.goal.findFirst( { where: { id: data.goalId, userId: user.id }, select: { id: true } } );
            if ( !g ) return { ok: false, error: "Goal not found" };
        }
        const a = await prisma.$transaction( async tx => {
            const a = await tx.account.create( { data: { ...data, userId: user.id } } );
            await tx.movement.create( { data: { userId: user.id, accountId: a.id, kind: "ADJUST", amount: a.balance, balanceAfter: a.balance, note: "Opening balance" } } );
            return a;
        } );
        invalidateUser( user.id ); revalidatePath( "/", "layout" );
        return { ok: true, id: a.id };
    } catch ( e ) { return fail( e ); }
}

export async function updateAccount( id: string, _: ActionResult | null, fd: FormData ): Promise<ActionResult> {
    try {
        const user = await requireUser();
        const p = parseForm( accountSchema, fd );
        if ( "error" in p ) return { ok: false, error: p.error };
        const data = normalise( p.data );
        const existing = await prisma.account.findFirst( { where: { id, userId: user.id } } );
        if ( !existing ) return { ok: false, error: "Account not found" };
        await prisma.$transaction( async tx => {
            await tx.account.update( { where: { id }, data } );
            if ( data.balance !== existing.balance ) {
                await tx.movement.create( { data: { userId: user.id, accountId: id, kind: "ADJUST", amount: data.balance - existing.balance, balanceAfter: data.balance, note: "Edited balance" } } );
            }
        } );
        invalidateUser( user.id ); revalidatePath( "/", "layout" );
        return { ok: true, id };
    } catch ( e ) { return fail( e ); }
}

export async function setAccountArchived( id: string, archived: boolean ) {
    const user = await requireUser();
    await prisma.account.updateMany( { where: { id, userId: user.id }, data: { archived } } );
    invalidateUser( user.id ); revalidatePath( "/", "layout" );
}

export async function deleteAccount( id: string ) {
    const user = await requireUser();
    await prisma.account.deleteMany( { where: { id, userId: user.id } } );
    invalidateUser( user.id ); revalidatePath( "/", "layout" );
}

/* ---------- movements ---------- */

const movementSchema = z.object( {
    mode: z.enum( [ "DEPOSIT", "WITHDRAW", "INTEREST", "MARKET", "SET" ] ),
    amount: z.string().trim().min( 1, "Required" ).transform( v => Math.round( Number( v ) ) ).pipe( z.number().int() ),
    date: optDate,
    note: optStr,
} );

export async function addMovement( accountId: string, _: ActionResult | null, fd: FormData ): Promise<ActionResult> {
    try {
        const user = await requireUser();
        const p = parseForm( movementSchema, fd );
        if ( "error" in p ) return { ok: false, error: p.error };
        const { mode, amount, date, note } = p.data;
        const a = await prisma.account.findFirst( { where: { id: accountId, userId: user.id } } );
        if ( !a ) return { ok: false, error: "Account not found" };

        let delta = 0;
        let kind: MovementKind = "ADJUST";
        let invested = a.invested;
        switch ( mode ) {
            case "DEPOSIT": kind = "DEPOSIT"; delta = Math.abs( amount ); if ( invested != null ) invested += delta; break;
            case "INTEREST": kind = "INTEREST"; delta = Math.abs( amount ); break;
            case "WITHDRAW": {
                kind = "WITHDRAW"; delta = -Math.abs( amount );
                if ( invested != null && a.balance > 0 ) invested = Math.max( 0, Math.round( invested - invested * Math.abs( amount ) / a.balance ) );
                break;
            }
            case "MARKET": kind = "MARKET"; delta = amount; break;
            case "SET": kind = "ADJUST"; delta = amount - a.balance; break;
        }
        if ( delta === 0 ) return { ok: false, error: "Nothing changed" };
        const balanceAfter = a.balance + delta;

        await prisma.$transaction( [
            prisma.account.update( { where: { id: accountId }, data: { balance: balanceAfter, invested } } ),
            prisma.movement.create( { data: { userId: user.id, accountId, kind, amount: delta, balanceAfter, note, date: date ?? new Date() } } ),
        ] );
        invalidateUser( user.id ); revalidatePath( "/", "layout" );
        return { ok: true };
    } catch ( e ) { return fail( e ); }
}

export async function deleteMovement( id: string ) {
    const user = await requireUser();
    const m = await prisma.movement.findFirst( { where: { id, userId: user.id }, include: { account: true } } );
    if ( !m ) return;
    await prisma.$transaction( [
        prisma.movement.delete( { where: { id } } ),
        prisma.account.update( { where: { id: m.accountId }, data: { balance: m.account.balance - m.amount } } ),
    ] );
    invalidateUser( user.id ); revalidatePath( "/", "layout" );
}
