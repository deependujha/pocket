import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if ( !connectionString ) {
    throw new Error( "DATABASE_URL is not set" );
}

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient( {
        adapter: new PrismaPg( { connectionString } ),
        log: [ "error" ],
    } );

if ( process.env.NODE_ENV !== "production" ) {
    globalForPrisma.prisma = prisma;
}
