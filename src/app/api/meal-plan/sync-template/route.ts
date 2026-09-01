import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionOrBypass } from '@/lib/auth'
import { foodSelect, getDayBounds, toMondayBasedDayOfWeek } from '@/lib/meal-plan'

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

/**
 * Overwrite the weekday template with this date's current plan items.
 * Does not change other dates' plans or any consumptions.
 */
export async function POST(request: Request) {
  try {
    const session = await getSessionOrBypass()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const dateParam = body.date as string | undefined
    if (!dateParam) {
      return NextResponse.json({ error: 'date required (YYYY-MM-DD)' }, { status: 400 })
    }

    const bounds = getDayBounds(dateParam)
    if (!bounds) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 })
    }

    const dayOfWeek = toMondayBasedDayOfWeek(bounds.startOfDay.getDay())

    const plan = await prisma.dailyMealPlan.findUnique({
      where: {
        userId_date: { userId: session.user.id, date: bounds.startOfDay },
      },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!plan) {
      return NextResponse.json({ error: 'No plan for this date' }, { status: 404 })
    }

    const items = plan.items.map((item) => ({
      foodId: item.foodId,
      quantity: item.quantity,
    }))

    if (items.length > 0) {
      const foodIds = items.map((i) => i.foodId)
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

    await prisma.dailyMealPlan.update({
      where: { id: plan.id },
      data: { sourceDayOfWeek: dayOfWeek },
    })

    const template = await getTemplateForDay(session.user.id, dayOfWeek)
    return NextResponse.json({
      template,
      dayOfWeek,
      date: dateParam,
    })
  } catch (error) {
    console.error('Error in POST /api/meal-plan/sync-template:', error)
    return NextResponse.json({ error: 'Error updating template from day plan' }, { status: 500 })
  }
}
