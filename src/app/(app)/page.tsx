import { redirect } from "next/navigation";
import { requirePageUser } from "@/lib/auth";
import { loadEverything } from "@/lib/data";
import { AppShell } from "@/components/shell/app-shell";

/**
 * The one and only app page. Data is loaded once here (server, cached per user),
 * then every screen is a client component swapped in place.
 */
export default async function AppPage() {
    const user = await requirePageUser();
    const everything = await loadEverything( user.id );
    if ( !everything.settings?.onboarded ) redirect( "/onboarding" );
    return <AppShell initial={ everything } user={ user } />;
}
