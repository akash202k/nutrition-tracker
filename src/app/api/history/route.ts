import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { startOfDay, endOfDay, subDays, format } from 'date-fns'

export async function GET(request: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // Get query parameters for custom date range
        const { searchParams } = new URL(request.url)
        const startDateParam = searchParams.get('startDate')
        const endDateParam = searchParams.get('endDate')
        const daysParam = searchParams.get('days')

        // Default to 30 days if not specified
        let days = 30
        try {
            if (daysParam) {
                days = parseInt(daysParam)
                if (isNaN(days) || days <= 0) {
                    days = 30
                }
            }
        } catch (e) {
            days = 30
        }

        // Determine date range
        let startDate: Date
        let endDate: Date = endOfDay(new Date())

        if (startDateParam && endDateParam) {
            try {
                startDate = startOfDay(new Date(startDateParam))
                endDate = endOfDay(new Date(endDateParam))

                // Validate dates
                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                    throw new Error('Invalid date format')
                }
            } catch (e) {
                console.error('Invalid date parameters:', e)
                startDate = startOfDay(subDays(new Date(), days - 1))
            }
        } else {
            startDate = startOfDay(subDays(new Date(), days - 1))
        }

        // Fetch the consumption data for the specified date range
        const consumptions = await prisma.consumption.findMany({
            where: {
                userId: session.user.id,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                food: true,
            },
        })

        // Aggregate data by date
        const aggregatedData = consumptions.reduce((acc, consumption) => {
            const date = format(consumption.date, 'yyyy-MM-dd')
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

        // Convert to array and sort by date
        const result = Object.values(aggregatedData).sort((a, b) => {
            return new Date(a.date).getTime() - new Date(b.date).getTime()
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error('Error fetching consumption history:', error)
        return NextResponse.json(
            { error: 'Error fetching consumption history' },
            { status: 500 }
        )
    }
}