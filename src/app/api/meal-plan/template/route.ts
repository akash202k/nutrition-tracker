import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionOrBypass } from '@/lib/auth'
import { foodSelect, parseDayOfWeek } from '@/lib/meal-plan'

async function getTemplateForDay(userId: string, dayOfWeek: number) {
  return prisma.weeklyMealPlanTemplate.findUnique({
    where: {
      userId_dayOfWeek: { userId, dayOfWeek },
    },
    include: {
      items: {
        include: { food: { select: foodSelect } },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })
}

export async function GET(request: Request) {
  try {
    const session = await getSessionOrBypass()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dayOfWeek = parseDayOfWeek(searchParams.get('dayOfWeek'))

    if (dayOfWeek === null) {
      return NextResponse.json(
        { error: 'dayOfWeek query param required (0=Mon … 6=Sun)' },
        { status: 400 }
      )
    }

    const template = await getTemplateForDay(session.user.id, dayOfWeek)

    if (!template) {
      return NextResponse.json({
        id: null,
        dayOfWeek,
        items: [],
      })
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error in GET /api/meal-plan/template:', error)
    return NextResponse.json({ error: 'Error fetching template' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionOrBypass()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const dayOfWeek = typeof body.dayOfWeek === 'number' ? body.dayOfWeek : parseDayOfWeek(String(body.dayOfWeek ?? ''))
    const items: Array<{ foodId: string; quantity: number }> = Array.isArray(body.items) ? body.items : []

    if (dayOfWeek === null) {
      return NextResponse.json(
        { error: 'dayOfWeek required (0=Mon … 6=Sun)' },
        { status: 400 }
      )
    }

    for (const item of items) {
      if (!item.foodId || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return NextResponse.json(
          { error: 'Each item needs foodId and quantity > 0' },
          { status: 400 }
        )
      }
    }

    const foodIds = items.map((i) => i.foodId)
    if (foodIds.length > 0) {
      const ownedFoods = await prisma.food.findMany({
        where: { userId: session.user.id, id: { in: foodIds } },
        select: { id: true },
      })
      if (ownedFoods.length !== new Set(foodIds).size) {
        return NextResponse.json({ error: 'One or more foods not found' }, { status: 400 })
      }
    }

    const existing = await prisma.weeklyMealPlanTemplate.findUnique({
      where: {
        userId_dayOfWeek: { userId: session.user.id, dayOfWeek },
      },
    })

    if (existing) {
      await prisma.weeklyMealPlanItem.deleteMany({ where: { templateId: existing.id } })
      await prisma.weeklyMealPlanTemplate.update({
        where: { id: existing.id },
        data: {
          items: {
            create: items.map((item, index) => ({
              foodId: item.foodId,
              quantity: item.quantity,
              sortOrder: index,
            })),
          },
        },
      })
    } else {
      await prisma.weeklyMealPlanTemplate.create({
        data: {
          userId: session.user.id,
          dayOfWeek,
          items: {
            create: items.map((item, index) => ({
              foodId: item.foodId,
              quantity: item.quantity,
              sortOrder: index,
            })),
          },
        },
      })
    }

    const template = await getTemplateForDay(session.user.id, dayOfWeek)
    return NextResponse.json(template)
  } catch (error) {
    console.error('Error in PUT /api/meal-plan/template:', error)
    return NextResponse.json({ error: 'Error saving template' }, { status: 500 })
  }
}
