import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionOrBypass } from '@/lib/auth'
import { formatLocalDate, getDayBounds } from '@/lib/meal-plan'

export async function POST(request: Request) {
    const session = await getSessionOrBypass()

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { foodId, quantity, date } = await request.json()

        // Validate that date is not in the future
        let consumptionDate = new Date()
        if (date) {
            const bounds = getDayBounds(date)
            if (!bounds) {
                return NextResponse.json(
                    { error: 'Invalid date format. Use YYYY-MM-DD' },
                    { status: 400 }
                )
            }
            const today = formatLocalDate(new Date())
            if (date > today) {
                return NextResponse.json(
                    { error: 'Cannot add consumption for future dates' },
                    { status: 400 }
                )
            }
            // Keep wall-clock time in IST-local day: use now if logging today, else noon local
            if (date === today) {
                consumptionDate = new Date()
            } else {
                consumptionDate = new Date(bounds.startOfDay)
                consumptionDate.setHours(12, 0, 0, 0)
            }
        }

        const consumption = await prisma.consumption.create({
            data: {
                userId: session.user.id,
                foodId,
                quantity,
                date: consumptionDate,
            },
            include: {
                food: true,
            },
        })

        return NextResponse.json(consumption)
    } catch (error) {
        console.error('Error in POST /api/consumption:', error)
        return NextResponse.json(
            { error: 'Error recording consumption' },
            { status: 500 }
        )
    }
}

export async function GET(request: Request) {
    const session = await getSessionOrBypass()

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const dateParam = searchParams.get('date')

        let startOfDay: Date
        let endOfDay: Date

        if (dateParam) {
            const bounds = getDayBounds(dateParam)
            if (!bounds) {
                return NextResponse.json(
                    { error: 'Invalid date format. Use YYYY-MM-DD' },
                    { status: 400 }
                )
            }
            startOfDay = bounds.startOfDay
            endOfDay = bounds.endOfDay
        } else {
            const today = formatLocalDate(new Date())
            const bounds = getDayBounds(today)!
            startOfDay = bounds.startOfDay
            endOfDay = bounds.endOfDay
        }

        const consumptions = await prisma.consumption.findMany({
            where: {
                userId: session.user.id,
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            include: {
                food: true,
            },
            orderBy: [
                { date: 'desc' },
                { id: 'desc' },
            ],
        })

        // Transform the date before sending
        const formattedConsumptions = consumptions.map(consumption => ({
            ...consumption,
            date: consumption.date.toISOString(),
        }))

        return NextResponse.json(formattedConsumptions)
    } catch (error) {
        console.error('Error in GET /api/consumption:', error)
        return NextResponse.json(
            { error: 'Error fetching consumptions' },
            { status: 500 }
        )
    }
}


// Add this DELETE method to your existing route.ts
export async function DELETE(request: Request) {
    const session = await getSessionOrBypass()

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Consumption ID required' }, { status: 400 })
        }

        // Clear any meal-plan item linked to this consumption
        await prisma.dailyMealPlanItem.updateMany({
            where: {
                consumptionId: id,
            },
            data: {
                completed: false,
                consumptionId: null,
            },
        })

        await prisma.consumption.delete({
            where: {
                id,
                userId: session.user.id, // Ensure user can only delete their own consumptions
            },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error in DELETE /api/consumption:', error)
        return NextResponse.json(
            { error: 'Error deleting consumption' },
            { status: 500 }
        )
    }
}
