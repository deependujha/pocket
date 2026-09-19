import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AppLayout( { children }: { children: React.ReactNode } ) {
    const user = await getCurrentUser();
    if ( !user ) redirect( "/login" );
    return <div className="min-h-dvh text-foreground">{ children }</div>;
}
