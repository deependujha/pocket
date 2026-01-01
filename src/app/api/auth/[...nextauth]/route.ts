import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!

const authOptions: NextAuthOptions = {
    session: {
        strategy: 'jwt',
    },
    providers: [
        // OAuth authentication providers...
        GoogleProvider( {
            clientId: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET
        } ),
    ],
    callbacks: {
        async signIn( { account, profile } ) {
            if ( !profile?.email ) {
                throw new Error( "No email found in user profile" );
            }
            console.log( "User signed in:", profile.email, profile.name, account?.provider );
            return true;
        }
    }
}

const handler = NextAuth( authOptions );

export { handler as GET, handler as POST }
