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
        const { foodId, quantity, date } = await request.json()

        // Validate that date is not in the future
        let consumptionDate = new Date()
        if (date) {
            const providedDate = new Date(date)
            if (providedDate > new Date()) {
                return NextResponse.json(
                    { error: 'Cannot add consumption for future dates' },
                    { status: 400 }
                )
            }
            consumptionDate = providedDate
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
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const dateParam = searchParams.get('date')

        let startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)

        // If a specific date is provided, use that date
        if (dateParam) {
            const providedDate = new Date(dateParam)
            if (isNaN(providedDate.getTime())) {
                return NextResponse.json(
                    { error: 'Invalid date format. Use YYYY-MM-DD' },
                    { status: 400 }
                )
            }
            startOfDay = new Date(providedDate)
            startOfDay.setHours(0, 0, 0, 0)
        }

        // Calculate end of day
        const endOfDay = new Date(startOfDay)
        endOfDay.setHours(23, 59, 59, 999)

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
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Consumption ID required' }, { status: 400 })
        }

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