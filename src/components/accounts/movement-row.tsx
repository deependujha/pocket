"use client";

import { Trash2 } from "lucide-react";
import { deleteMovement } from "@/actions/accounts";
import { useRefresh } from "@/components/shell/data-provider";

export function DeleteMovementButton( { id }: { id: string } ) {
    const refresh = useRefresh();
    return (
        <button aria-label="Delete entry" className="rounded-full p-1.5 text-muted-foreground/45 hover:bg-muted hover:text-status-critical-text"
            onClick={ async () => { if ( confirm( "Remove this entry and undo its effect on the balance?" ) ) { await deleteMovement( id ); refresh(); } } }>
            <Trash2 size={ 14 } />
        </button>
    );
}
