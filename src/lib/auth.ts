import GoogleProvider from "next-auth/providers/google";
import { getServerSession, type NextAuthOptions } from "next-auth";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/db";

/**
 * The JWT carries the user's id, name and picture, so pages never hit the
 * database just to find out who is signed in. The DB row is only touched at sign-in.
 */
export const authOptions: NextAuthOptions = {
    session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 90 },
    pages: { signIn: "/login" },
    providers: [
        GoogleProvider( {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        } ),
    ],
    callbacks: {
        async signIn( { account, profile } ) {
            if ( !profile?.email || !account?.providerAccountId ) throw new Error( "Invalid Google profile" );
            return true;
        },
        async jwt( { token, account, profile } ) {
            if ( account && profile?.email ) {
                const picture = ( profile as { picture?: string } ).picture;
                const user = await prisma.user.upsert( {
                    where: { email: profile.email },
                    update: { name: profile.name, image: picture },
                    create: { email: profile.email, name: profile.name, image: picture, provider: account.provider, providerId: account.providerAccountId },
                    select: { id: true, email: true, name: true, image: true },
                } );
                token.uid = user.id;
                token.email = user.email;
                token.name = user.name;
                token.picture = user.image;
            }
            return token;
        },
        async session( { session, token } ) {
            if ( session.user ) {
                session.user.email = token.email as string;
                session.user.name = ( token.name as string | null ) ?? null;
                session.user.image = ( token.picture as string | null ) ?? null;
                ( session.user as { id?: string } ).id = token.uid as string | undefined;
            }
            return session;
        },
    },
};

export type SessionUser = { id: string; email: string; name: string | null; image: string | null };

/** The signed-in user from the session token (no DB). Deduped per request. */
export const getCurrentUser = cache( async (): Promise<SessionUser | null> => {
    const session = await getServerSession( authOptions );
    const u = session?.user as ( SessionUser & { id?: string } ) | undefined;
    if ( !u?.email ) return null;
    if ( !u.id ) {
        // Token issued before ids were embedded: one lookup, then it's cached for this request.
        const row = await prisma.user.findUnique( { where: { email: u.email }, select: { id: true } } );
        if ( !row ) return null;
        u.id = row.id;
    }
    return { id: u.id, email: u.email, name: u.name ?? null, image: u.image ?? null };
} );

/** For pages: the signed-in user, or a redirect to /login. */
export async function requirePageUser() {
    const user = await getCurrentUser();
    if ( !user ) redirect( "/login" );
    return user;
}

/** For server actions. */
export async function requireUser() {
    const user = await getCurrentUser();
    if ( !user ) throw new Error( "Not signed in" );
    return user;
}
