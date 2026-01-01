import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/prisma/connection";
import { AuthOptions } from "../../authoptions";


export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const session = await getServerSession( AuthOptions );
    if ( !session?.user?.email ) {
        return NextResponse.json( { error: "Unauthorized" }, { status: 401 } );
    }

    const body = await req.json();
    const { title, description, amount, categoryId } = body;

    if ( !title || !amount || !categoryId ) {
        return NextResponse.json( { error: "Invalid payload" }, { status: 400 } );
    }

    const user = await prisma.user.findUnique( {
        where: { email: session.user.email },
        select: { id: true },
    } );

    if ( !user ) {
        return NextResponse.json( { error: "User not found" }, { status: 404 } );
    }

    const expense = await prisma.expense.findFirst( {
        where: {
            id,
            userId: user.id,
        },
    } );

    if ( !expense ) {
        return NextResponse.json( { error: "Not found" }, { status: 404 } );
    }

    const updated = await prisma.expense.update( {
        where: { id },
        data: {
            title,
            description,
            amount,
            categoryId,
        },
    } );

    return NextResponse.json( updated );
}


export async function DELETE(
    _: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const session = await getServerSession( AuthOptions );

    if ( !session?.user?.email ) {
        return NextResponse.json( { error: "Unauthorized" }, { status: 401 } );
    }

    const user = await prisma.user.findUnique( {
        where: { email: session.user.email },
        select: { id: true },
    } );

    if ( !user ) {
        return NextResponse.json( { error: "User not found" }, { status: 404 } );
    }

    const expense = await prisma.expense.findFirst( {
        where: {
            id: id,
            userId: user.id,
        },
    } );

    if ( !expense ) {
        return NextResponse.json( { error: "Not found" }, { status: 404 } );
    }

    await prisma.expense.delete( {
        where: { id: id },
    } );

    return NextResponse.json( { success: true } );
}
