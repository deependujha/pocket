import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import type { Fund, FundEntry, Loan, LoanPayment, Wish, WishSection } from "@/generated/prisma/client";

/**
 * All reads for a user are one cached call, invalidated by every write.
 * Cached values are JSON, so Date fields are revived here.
 */
const DATE_KEYS = new Set( [ "createdAt", "updatedAt", "endDate", "date" ] );

function revive<T>( v: T ): T {
    if ( Array.isArray( v ) ) return v.map( revive ) as T;
    if ( v && typeof v === "object" ) {
        const o = v as Record<string, unknown>;
        for ( const k of Object.keys( o ) ) {
            const x = o[ k ];
            if ( DATE_KEYS.has( k ) && typeof x === "string" ) o[ k ] = new Date( x );
            else if ( x && typeof x === "object" ) o[ k ] = revive( x );
        }
    }
    return v;
}

export const userTag = ( userId: string ) => `user:${userId}`;
export function invalidateUser( userId: string ) { revalidateTag( userTag( userId ), "max" ); }

export type SectionWithWishes = WishSection & { wishes: Wish[] };
export type FundWithEntries = Fund & { entries: FundEntry[] };
export type LoanWithPayments = Loan & { payments: LoanPayment[] };
export type Everything = { sections: SectionWithWishes[]; funds: FundWithEntries[]; loans: LoanWithPayments[] };

async function fetchEverything( userId: string ): Promise<Everything> {
    const [ sections, funds, loans ] = await Promise.all( [
        prisma.wishSection.findMany( { where: { userId }, include: { wishes: { orderBy: [ { done: "asc" }, { createdAt: "asc" } ] } }, orderBy: [ { order: "asc" }, { createdAt: "asc" } ] } ),
        prisma.fund.findMany( { where: { userId }, include: { entries: { orderBy: { date: "desc" } } }, orderBy: { createdAt: "asc" } } ),
        prisma.loan.findMany( { where: { userId }, include: { payments: { orderBy: { date: "desc" } } }, orderBy: [ { closed: "asc" }, { createdAt: "desc" } ] } ),
    ] );
    return { sections, funds, loans };
}

export async function loadEverything( userId: string ): Promise<Everything> {
    const cached = unstable_cache( () => fetchEverything( userId ), [ "everything", userId ], { tags: [ userTag( userId ) ], revalidate: 3600 } );
    return revive( await cached() );
}
