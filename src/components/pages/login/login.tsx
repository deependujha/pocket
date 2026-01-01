"use client";

import { signIn } from "next-auth/react";

export const LoginPage = () => {
    return (
        <div className="min-h-screen flex flex-col px-6">
            {/* Top spacer */ }
            <div className="flex-1" />

            {/* Center content */ }
            <div className="flex flex-col items-center text-center">
                {/* Logo */ }
                <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-neutral-100">
                    <img
                        src="/logo.svg"
                        alt="Pocket"
                        className="h-16 w-16"
                    />
                </div>

                {/* Title */ }
                <h1 className="text-2xl font-semibold">Pocket</h1>
                <p className="mt-2 text-sm text-neutral-500">
                    A simple place to track your spending.
                </p>

                {/* CTA */ }
                <button
                    onClick={ () => signIn( "google" ) }
                    className="mt-8 w-full max-w-sm flex items-center justify-center gap-3 rounded-xl bg-black py-3 text-white font-medium hover:bg-neutral-800"
                >
                    <img src="/google.svg" alt="" className="h-5 w-5" />
                    Continue with Google
                </button>

                {/* Trust copy */ }
                <p className="mt-6 max-w-xs text-xs text-neutral-400">
                    No ads. No noise.
                    <br />
                    Built for personal use. Private by default.
                </p>
            </div>

            {/* Bottom spacer */ }
            <div className="flex-1" />
        </div>
    );
};
