"use server";

import { requireUser } from "@/lib/auth";
import { loadEverything, type Everything } from "@/lib/data";

/** Fresh copy of everything the signed-in user owns. Called by the client store after each write. */
export async function fetchEverything(): Promise<Everything> {
    const user = await requireUser();
    return loadEverything( user.id );
}
