"use client";

import { signIn } from "next-auth/react";

export function SignInButton() {
    return (
        <button
            onClick={ () => signIn( "google", { callbackUrl: "/" } ) }
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-primary py-3.5 font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.99]"
        >
            { /* eslint-disable-next-line @next/next/no-img-element */ }
            <img src="/google.svg" alt="" className="h-5 w-5" />
            Continue with Google
        </button>
    );
}
