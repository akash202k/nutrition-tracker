import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const consumptions = await prisma.consumption.findMany({
            where: {
                userId: session.user.id,
                date: {
                    gte: sevenDaysAgo,
                },
            },
            include: {
                food: true,
            },
        })

        // Aggregate data by date
        const aggregatedData = consumptions.reduce((acc, consumption) => {
            const date = consumption.date.toISOString().split('T')[0]
            if (!acc[date]) {
                acc[date] = {
                    date,
                    calories: 0,
                    protein: 0,
                }
            }

            acc[date].calories += consumption.food.caloriesPerUnit * consumption.quantity
            acc[date].protein += consumption.food.proteinPerUnit * consumption.quantity

            return acc
        }, {} as Record<string, { date: string; calories: number; protein: number }>)

        return NextResponse.json(Object.values(aggregatedData))
    } catch (error) {
        return NextResponse.json(
            { error: 'Error fetching consumption history' },
            { status: 500 }
        )
    }
}