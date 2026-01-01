import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/prisma/connection";
import { AuthOptions } from "../../authoptions";

export async function GET() {
    const session = await getServerSession( AuthOptions );

    if ( !session?.user?.email ) {
        return NextResponse.json( [], { status: 401 } );
    }

    const user = await prisma.user.findUnique( {
        where: { email: session.user.email },
        select: { id: true },
    } );

    if ( !user ) {
        return NextResponse.json( [] );
    }

    const expenses = await prisma.expense.findMany( {
        where: {
            userId: user.id,
        },
        orderBy: {
            createdAt: "desc",
        },
    } );

    return NextResponse.json( expenses );
}
