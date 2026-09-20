"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { invalidateUser } from "@/lib/data";
import { type ActionResult, fail, optStr, parseForm, reqStr } from "./_shared";

const amount = z.string().trim().optional().transform( v => Math.round( Number( ( v ?? "" ).replace( /[^\d]/g, "" ) ) || 0 ) ).pipe( z.number().int().min( 0 ).max( 1e9 ) );

const sectionSchema = z.object( { name: reqStr, emoji: optStr } );

export async function saveSection( id: string | null, _: ActionResult | null, fd: FormData ): Promise<ActionResult> {
    try {
        const user = await requireUser();
        const p = parseForm( sectionSchema, fd );
        if ( "error" in p ) return { ok: false, error: p.error };
        if ( id ) await prisma.wishSection.updateMany( { where: { id, userId: user.id }, data: p.data } );
        else {
            const count = await prisma.wishSection.count( { where: { userId: user.id } } );
            await prisma.wishSection.create( { data: { ...p.data, userId: user.id, order: count } } );
        }
        invalidateUser( user.id ); revalidatePath( "/", "layout" );
        return { ok: true };
    } catch ( e ) { return fail( e ); }
}

export async function deleteSection( id: string ) {
    const user = await requireUser();
    await prisma.wishSection.deleteMany( { where: { id, userId: user.id } } );
    invalidateUser( user.id ); revalidatePath( "/", "layout" );
}

const wishSchema = z.object( {
    sectionId: reqStr,
    name: reqStr,
    amount,
    links: z.string().optional().transform( v => ( v ?? "" ).split( /\n|,\s*/ ).map( s => s.trim() ).filter( Boolean ).map( s => ( /^https?:\/\//i.test( s ) ? s : `https://${s}` ) ).slice( 0, 6 ) ),
    note: optStr,
} );

export async function saveWish( id: string | null, _: ActionResult | null, fd: FormData ): Promise<ActionResult> {
    try {
        const user = await requireUser();
        const p = parseForm( wishSchema, fd );
        if ( "error" in p ) return { ok: false, error: p.error };
        const section = await prisma.wishSection.findFirst( { where: { id: p.data.sectionId, userId: user.id }, select: { id: true } } );
        if ( !section ) return { ok: false, error: "Section not found" };
        if ( id ) await prisma.wish.updateMany( { where: { id, userId: user.id }, data: p.data } );
        else await prisma.wish.create( { data: { ...p.data, userId: user.id } } );
        invalidateUser( user.id ); revalidatePath( "/", "layout" );
        return { ok: true };
    } catch ( e ) { return fail( e ); }
}

export async function setWishDone( id: string, done: boolean ) {
    const user = await requireUser();
    await prisma.wish.updateMany( { where: { id, userId: user.id }, data: { done } } );
    invalidateUser( user.id ); revalidatePath( "/", "layout" );
}

export async function deleteWish( id: string ) {
    const user = await requireUser();
    await prisma.wish.deleteMany( { where: { id, userId: user.id } } );
    invalidateUser( user.id ); revalidatePath( "/", "layout" );
}
