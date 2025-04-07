// src/app/api/food/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { name, caloriesPerUnit, proteinPerUnit } = body

        const food = await prisma.food.create({
            data: {
                name,
                caloriesPerUnit,
                proteinPerUnit,
                userId: session.user.id // Use the authenticated user's ID
            },
        })

        return NextResponse.json(food, { status: 201 })
    } catch (error) {
        console.error('Error creating food:', error)
        return NextResponse.json(
            { error: 'Error creating food item' },
            { status: 500 }
        )
    }
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Only fetch foods created by the authenticated user
        const foods = await prisma.food.findMany({
            where: {
                userId: session.user.id
            },
            orderBy: {
                name: 'asc' // Sort foods alphabetically by name
            }
        })

        return NextResponse.json(foods)
    } catch (error) {
        console.error('Error fetching foods:', error)
        return NextResponse.json(
            { error: 'Error fetching foods' },
            { status: 500 }
        )
    }
}

// src/app/api/food/route.ts - Fixed DELETE handler
export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Food ID required' }, { status: 400 })
        }

        // First check if the food belongs to the user
        const food = await prisma.food.findUnique({
            where: {
                id,
                userId: session.user.id
            }
        })

        if (!food) {
            return NextResponse.json({ error: 'Food not found or unauthorized' }, { status: 404 })
        }

        // Delete all consumption records associated with this food
        await prisma.consumption.deleteMany({
            where: {
                foodId: id,
                userId: session.user.id
            }
        })

        // Then delete the food
        await prisma.food.delete({
            where: {
                id,
                userId: session.user.id
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting food:', error)
        return NextResponse.json(
            { error: 'Error deleting food item' },
            { status: 500 }
        )
    }
}