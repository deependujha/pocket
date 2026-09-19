"use server";

import { revalidatePath } from "next/cache";
import { invalidateUser } from "@/lib/data";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { GoalKind, GoalStatus } from "@/generated/prisma/enums";
import { type ActionResult, fail, optDate, optInt, optStr, parseForm, reqInt, reqStr } from "./_shared";

const goalSchema = z.object( {
    name: reqStr,
    kind: z.nativeEnum( GoalKind ),
    emoji: optStr,
    forWhom: optStr,
    target: reqInt.pipe( z.number().positive( "Target must be positive" ) ),
    targetDate: optDate,
    trigger: optStr,
    monthlyPlan: optInt,
    priority: optInt.transform( v => v ?? 2 ),
    note: optStr,
    accountIds: z.array( z.string() ).optional().default( [] ),
} );

async function link( userId: string, goalId: string, accountIds: string[] ) {
    await prisma.account.updateMany( { where: { userId, goalId, id: { notIn: accountIds } }, data: { goalId: null } } );
    if ( accountIds.length ) {
        await prisma.account.updateMany( { where: { userId, id: { in: accountIds }, type: { not: "CREDIT_CARD" } }, data: { goalId } } );
    }
}

export async function createGoal( _: ActionResult | null, fd: FormData ): Promise<ActionResult> {
    try {
        const user = await requireUser();
        const p = parseForm( goalSchema, fd );
        if ( "error" in p ) return { ok: false, error: p.error };
        const { accountIds, ...data } = p.data;
        const g = await prisma.goal.create( { data: { ...data, userId: user.id } } );
        await link( user.id, g.id, accountIds );
        invalidateUser( user.id ); revalidatePath( "/", "layout" );
        return { ok: true, id: g.id };
    } catch ( e ) { return fail( e ); }
}

export async function updateGoal( id: string, _: ActionResult | null, fd: FormData ): Promise<ActionResult> {
    try {
        const user = await requireUser();
        const p = parseForm( goalSchema, fd );
        if ( "error" in p ) return { ok: false, error: p.error };
        const { accountIds, ...data } = p.data;
        const r = await prisma.goal.updateMany( { where: { id, userId: user.id }, data } );
        if ( r.count === 0 ) return { ok: false, error: "Goal not found" };
        await link( user.id, id, accountIds );
        invalidateUser( user.id ); revalidatePath( "/", "layout" );
        return { ok: true, id };
    } catch ( e ) { return fail( e ); }
}

export async function setGoalStatus( id: string, status: GoalStatus ) {
    const user = await requireUser();
    await prisma.goal.updateMany( {
        where: { id, userId: user.id },
        data: { status, achievedAt: status === "ACHIEVED" ? new Date() : null },
    } );
    invalidateUser( user.id ); revalidatePath( "/", "layout" );
}

export async function deleteGoal( id: string ) {
    const user = await requireUser();
    await prisma.goal.deleteMany( { where: { id, userId: user.id } } );
    invalidateUser( user.id ); revalidatePath( "/", "layout" );
}
