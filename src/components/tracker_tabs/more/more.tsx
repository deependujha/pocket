"use client";

import { clearAllData } from "@/db/index_db_helper";
import { toast } from "sonner";
import { FaUser } from "react-icons/fa6";




export const MoreTab = () => {
    const handleDeleteAll = async () => {
        const confirmed = window.confirm(
            "This will permanently delete all your expenses. This action cannot be undone."
        );

        if ( !confirmed ) return;

        await clearAllData();
        toast.error( "All expense data deleted" );

        // simple reload to reset state everywhere
        window.location.reload();
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
            {/* Account section */ }
            <div className="flex flex-col items-center gap-3">
                <div className="h-20 w-20 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-500 text-2xl">
                    <FaUser size={ 40 } />
                </div>
                <div className="text-lg font-medium">Guest</div>
            </div>

            {/* Danger zone */ }
            <div className="w-full max-w-sm border border-red-200 rounded-lg p-4">
                <p className="text-sm text-neutral-600 mb-3">
                    This will remove all stored expenses from this device.
                </p>

                <button
                    onClick={ handleDeleteAll }
                    className="w-full py-2 rounded bg-red-500 text-white font-medium hover:bg-red-600"
                >
                    Delete All Data
                </button>
            </div>
        </div>
    );
};
