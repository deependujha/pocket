import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if ( !connectionString ) {
    throw new Error( "DATABASE_URL is not set" );
}

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

/**
 * In dev the client is kept on globalThis across hot reloads. After `prisma generate`
 * adds a model, that cached instance is stale (e.g. prisma.planPhase is undefined),
 * so we check that every model we use exists before reusing it.
 */
const MODELS = [ "user", "wishSection", "wish", "fund", "fundEntry", "loan", "loanPayment" ] as const;
const isCurrent = ( c: PrismaClient | undefined ): c is PrismaClient =>
    !!c && MODELS.every( m => typeof ( c as unknown as Record<string, unknown> )[ m ] === "object" );

export const prisma = isCurrent( globalForPrisma.prisma )
    ? globalForPrisma.prisma
    : new PrismaClient( {
        adapter: new PrismaPg( { connectionString } ),
        log: [ "error" ],
    } );

if ( process.env.NODE_ENV !== "production" ) {
    globalForPrisma.prisma = prisma;
}
