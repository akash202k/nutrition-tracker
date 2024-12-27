import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { foodId, quantity } = await request.json()

        const consumption = await prisma.consumption.create({
            data: {
                userId: session.user.id,
                foodId,
                quantity,
            },
            include: {
                food: true,
            },
        })

        return NextResponse.json(consumption)
    } catch (error) {
        return NextResponse.json(
            { error: 'Error recording consumption' },
            { status: 500 }
        )
    }
}

export async function GET(request: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const consumptions = await prisma.consumption.findMany({
            where: {
                userId: session.user.id,
                date: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                },
            },
            include: {
                food: true,
            },
            orderBy: {
                date: 'desc',
            },
        })

        return NextResponse.json(consumptions)
    } catch (error) {
        return NextResponse.json(
            { error: 'Error fetching consumptions' },
            { status: 500 }
        )
    }
}
