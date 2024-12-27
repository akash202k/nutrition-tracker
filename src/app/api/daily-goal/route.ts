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
        const { calorieGoal, proteinGoal } = await request.json()

        const dailyGoal = await prisma.dailyGoal.create({
            data: {
                userId: session.user.id,
                calorieGoal,
                proteinGoal,
            },
        })

        return NextResponse.json(dailyGoal)
    } catch (error) {
        return NextResponse.json(
            { error: 'Error creating daily goal' },
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
        const dailyGoal = await prisma.dailyGoal.findFirst({
            where: {
                userId: session.user.id,
            },
            orderBy: {
                date: 'desc',
            },
        })

        return NextResponse.json(dailyGoal)
    } catch (error) {
        return NextResponse.json(
            { error: 'Error fetching daily goal' },
            { status: 500 }
        )
    }
}