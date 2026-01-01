"use client";

import { useSession, signOut } from "next-auth/react";
import { FaUser } from "react-icons/fa6";
import { LogOut } from "lucide-react";
import { CURRENT_VERSION } from "@/constants/version";

export const MoreTab = () => {
    const { data: session } = useSession();

    return (
        <div className="flex min-h-screen flex-col items-center justify-between p-6">
            {/* Profile */ }
            <div className="flex flex-col items-center gap-4 mt-12">
                <div className="h-24 w-24 rounded-full bg-neutral-200 overflow-hidden flex items-center justify-center">
                    { session?.user?.image ? (
                        <img
                            src={ session.user.image }
                            alt={ session.user.name ?? "User" }
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <FaUser size={ 44 } className="text-neutral-500" />
                    ) }
                </div>

                <div className="text-center space-y-1">
                    <div className="text-lg font-medium">
                        { session?.user?.name ?? "Guest" }
                    </div>

                    <div className="text-sm text-neutral-500">
                        { session?.user?.email ?? "Not signed in" }
                    </div>
                </div>
            </div>

            {/* Actions */ }
            <div className="w-full max-w-sm space-y-4 mb-12">
                { session && (
                    <button
                        onClick={ () => signOut() }
                        className="w-full flex items-center justify-center gap-2 rounded-xl border border-neutral-300 py-3 text-sm text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                    >
                        <LogOut size={ 16 } />
                        Sign out
                    </button>
                ) }

                <div className="text-center text-xs text-neutral-400">
                    Pocket • v{ CURRENT_VERSION }
                </div>
            </div>
        </div>
    );
};
