import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
    const user = await getCurrentUser();
    if ( !user ) return NextResponse.json( { error: "Unauthorized" }, { status: 401 } );
    const [ settings, accounts, movements, goals, loans ] = await Promise.all( [
        prisma.settings.findUnique( { where: { userId: user.id } } ),
        prisma.account.findMany( { where: { userId: user.id } } ),
        prisma.movement.findMany( { where: { userId: user.id }, orderBy: { date: "asc" } } ),
        prisma.goal.findMany( { where: { userId: user.id } } ),
        prisma.loan.findMany( { where: { userId: user.id }, include: { payments: true } } ),
    ] );
    const body = JSON.stringify( { exportedAt: new Date().toISOString(), user: { email: user.email, name: user.name }, settings, accounts, movements, goals, loans }, null, 2 );
    return new NextResponse( body, {
        headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="pocket-${new Date().toISOString().slice( 0, 10 )}.json"`,
        },
    } );
}
