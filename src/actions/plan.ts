"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { invalidateUser } from "@/lib/data";
import { type ActionResult, fail } from "./_shared";

/**
 * Saves the whole plan in one go. Fields:
 *   m:<goalId>        monthly amount for a goal
 *   o:<goalId>        overflow goal id ("" = default)
 *   m:loan:<loanId>   EMI for a borrowed loan
 *   o:loan:<loanId>   overflow goal id
 *   planNote          free text
 */
export async function savePlan( _: ActionResult | null, fd: FormData ): Promise<ActionResult> {
    try {
        const user = await requireUser();
        const goalIds = new Set( ( await prisma.goal.findMany( { where: { userId: user.id }, select: { id: true } } ) ).map( g => g.id ) );
        const ops = [];
        const num = ( v: FormDataEntryValue | null ) => { const n = Math.round( Number( String( v ?? "" ).trim() ) ); return Number.isFinite( n ) && n >= 0 ? Math.min( n, 100000000 ) : 0; };
        const ref = ( v: FormDataEntryValue | null ) => { const s = String( v ?? "" ).trim(); return s && goalIds.has( s ) ? s : null; };

        for ( const [ k ] of fd.entries() ) {
            if ( !k.startsWith( "m:" ) ) continue;
            const id = k.slice( 2 );
            const monthly = num( fd.get( k ) );
            const overflow = ref( fd.get( `o:${id}` ) );
            if ( id.startsWith( "loan:" ) ) {
                const loanId = id.slice( 5 );
                ops.push( prisma.loan.updateMany( { where: { id: loanId, userId: user.id }, data: { emi: monthly || null, overflowGoalId: overflow } } ) );
            } else if ( goalIds.has( id ) ) {
                ops.push( prisma.goal.update( { where: { id }, data: { monthlyPlan: monthly, overflowGoalId: overflow === id ? null : overflow } } ) );
            }
        }
        const note = String( fd.get( "planNote" ) ?? "" ).trim() || null;
        ops.push( prisma.settings.upsert( { where: { userId: user.id }, update: { planNote: note }, create: { userId: user.id, planNote: note } } ) );
        await prisma.$transaction( ops );
        invalidateUser( user.id ); revalidatePath( "/", "layout" );
        return { ok: true };
    } catch ( e ) { return fail( e ); }
}
