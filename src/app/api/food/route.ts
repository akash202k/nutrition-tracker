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

        console.log("food add request coming to api", {
            name,
            caloriesPerUnit,
            proteinPerUnit,
            userId: session.user.id
        })

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