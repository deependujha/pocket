import { requirePageUser } from "@/lib/auth";
import { loadEverything } from "@/lib/data";
import { AppShell } from "@/components/shell/app-shell";

/** The one app page. Data is loaded once here; every screen after that is a client-side swap. */
export default async function AppPage() {
    const user = await requirePageUser();
    const everything = await loadEverything( user.id );
    return <AppShell initial={ everything } user={ user } />;
}
