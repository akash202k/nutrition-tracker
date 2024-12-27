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
                date: new Date(), // Add this line to explicitly set the date
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
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)

        const consumptions = await prisma.consumption.findMany({
            where: {
                userId: session.user.id,
                date: {
                    gte: startOfDay,
                },
            },
            include: {
                food: true,
            },
            orderBy: {
                date: 'desc',
            },
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