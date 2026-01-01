import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/prisma/connection";
import { AuthOptions } from "../../authoptions";


export async function GET( req: Request ) {
    const { searchParams } = new URL( req.url );
    const year = Number( searchParams.get( "year" ) );
    const month = Number( searchParams.get( "month" ) );

    if ( Number.isNaN( year ) || Number.isNaN( month ) ) {
        return NextResponse.json( [], { status: 400 } );
    }

    const start = new Date( year, month, 1 );
    const end = new Date( year, month + 1, 0, 23, 59, 59, 999 );

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
            createdAt: { gte: start, lte: end },
        },
        orderBy: { createdAt: "desc" },
    } );

    return NextResponse.json( expenses );
}
