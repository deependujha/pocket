import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { loadEverything } from "@/lib/data";

export async function GET() {
    const user = await getCurrentUser();
    if ( !user ) return NextResponse.json( { error: "Unauthorized" }, { status: 401 } );
    const data = await loadEverything( user.id );
    const body = JSON.stringify( { exportedAt: new Date().toISOString(), user: { email: user.email, name: user.name }, ...data }, null, 2 );
    return new NextResponse( body, {
        headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="pocket-${new Date().toISOString().slice( 0, 10 )}.json"` },
    } );
}
