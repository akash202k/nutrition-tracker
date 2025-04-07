// src/app/api/food/[id]/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const id = params.id
        const { name, caloriesPerUnit, proteinPerUnit } = await request.json()

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

        // Update the food
        const updatedFood = await prisma.food.update({
            where: {
                id,
                userId: session.user.id
            },
            data: {
                name,
                caloriesPerUnit,
                proteinPerUnit
            }
        })

        return NextResponse.json(updatedFood)
    } catch (error) {
        console.error('Error updating food:', error)
        return NextResponse.json(
            { error: 'Error updating food item' },
            { status: 500 }
        )
    }
}