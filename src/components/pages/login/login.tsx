"use client";

import { signIn } from "next-auth/react";

export const LoginPage = () => {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
            {/* Logo with circular background */ }
            <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-neutral-100">
                <img
                    src="/logo.svg"
                    alt="Pocket"
                    className="h-16 w-16"
                />
            </div>

            {/* App name & tagline */ }
            <div className="mb-8">
                <h1 className="text-2xl font-semibold">Pocket</h1>
                <p className="mt-2 text-sm text-neutral-500">
                    A simple place to track your spending.
                </p>
            </div>

            {/* CTA */ }
            <button
                onClick={ () => signIn( "google" ) }
                className="w-full max-w-sm flex items-center justify-center gap-3 rounded-xl bg-black py-3 text-white font-medium hover:bg-neutral-800 cursor-pointer"
            >
                <img
                    src="/google.svg"
                    alt=""
                    className="h-5 w-5"
                />
                Continue with Google
            </button>


            {/* Trust text */ }
            <p className="mt-6 max-w-xs text-xs text-neutral-400">
                No ads. No noise.
                <br />
                Built for personal use. Private by default.
            </p>
        </div>
    );
};
