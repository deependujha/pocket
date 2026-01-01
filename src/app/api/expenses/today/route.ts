import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/prisma/connection";
import { AuthOptions } from "@/app/api/authoptions";

const startOfToday = () => {
    const d = new Date();
    d.setHours( 0, 0, 0, 0 );
    return d;
};

const endOfToday = () => {
    const d = new Date();
    d.setHours( 23, 59, 59, 999 );
    return d;
};

export async function GET() {
    const session = await getServerSession( AuthOptions );
    if ( !session?.user?.email ) {
        return NextResponse.json( [], { status: 401 } );
    }

    const user = await prisma.user.findUnique( {
        where: { email: session.user.email },
        select: { id: true },
    } );

    if ( !user ) return NextResponse.json( [] );

    const expenses = await prisma.expense.findMany( {
        where: {
            userId: user.id,
            createdAt: {
                gte: startOfToday(),
                lte: endOfToday(),
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    } );

    return NextResponse.json( expenses );
}
