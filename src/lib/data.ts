import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import type { AccountWithGoal, LoanWithPayments } from "@/lib/finance";

/**
 * All reads for a user are cached under one tag and invalidated by every write,
 * so navigating between screens costs zero database round-trips.
 * Cached values are JSON, so Date fields come back as strings and are revived here.
 */

const DATE_KEYS = new Set( [ "createdAt", "updatedAt", "lastLoginAt", "startDate", "maturityDate", "targetDate", "achievedAt", "dueDate", "closedAt", "date" ] );

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

export function invalidateUser( userId: string ) {
    revalidateTag( userTag( userId ), "max" );
}

const goalSel = { select: { id: true, name: true, kind: true, status: true } } as const;

const fetchEverything = unstable_cache(
    async ( userId: string ) => {
        const [ accounts, goals, loans, movements, settings ] = await Promise.all( [
            prisma.account.findMany( { where: { userId }, include: { goal: goalSel }, orderBy: [ { archived: "asc" }, { createdAt: "asc" } ] } ),
            prisma.goal.findMany( { where: { userId }, orderBy: [ { status: "asc" }, { priority: "asc" }, { createdAt: "asc" } ] } ),
            prisma.loan.findMany( { where: { userId }, include: { payments: { orderBy: { date: "desc" } } }, orderBy: [ { status: "asc" }, { createdAt: "desc" } ] } ),
            prisma.movement.findMany( { where: { userId }, orderBy: { date: "asc" } } ),
            prisma.settings.findUnique( { where: { userId } } ),
        ] );
        return { accounts, goals, loans, movements, settings };
    },
    [ "everything" ],
    { tags: [] as string[] },
);

export type Everything = {
    accounts: AccountWithGoal[];
    goals: Awaited<ReturnType<typeof prisma.goal.findMany>>;
    loans: LoanWithPayments[];
    movements: Awaited<ReturnType<typeof prisma.movement.findMany>>;
    settings: Awaited<ReturnType<typeof prisma.settings.findUnique>>;
};

/** Everything the user owns, in one cached read. */
export async function loadEverything( userId: string ): Promise<Everything> {
    const cached = unstable_cache( () => fetchEverything( userId ), [ "everything", userId ], { tags: [ userTag( userId ) ], revalidate: 3600 } );
    return revive( await cached() ) as Everything;
}

export async function loadAccounts( userId: string, includeArchived = false ) {
    const { accounts } = await loadEverything( userId );
    return includeArchived ? accounts : accounts.filter( a => !a.archived );
}
export async function loadGoals( userId: string ) { return ( await loadEverything( userId ) ).goals; }
export async function loadLoans( userId: string ) { return ( await loadEverything( userId ) ).loans; }
export async function loadMovements( userId: string, accountId?: string ) {
    const { movements } = await loadEverything( userId );
    return accountId ? movements.filter( m => m.accountId === accountId ) : movements;
}
export async function loadSettings( userId: string ) { return ( await loadEverything( userId ) ).settings; }
