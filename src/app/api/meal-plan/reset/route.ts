import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionOrBypass } from '@/lib/auth'
import { foodSelect, getDayBounds, toMondayBasedDayOfWeek } from '@/lib/meal-plan'

async function getPlanByDate(userId: string, startOfDay: Date) {
  return prisma.dailyMealPlan.findUnique({
    where: {
      userId_date: { userId, date: startOfDay },
    },
    include: {
      items: {
        include: { food: { select: foodSelect } },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })
}

async function loadTemplate(userId: string, dayOfWeek: number) {
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
 * Replace this date's plan items from the weekday template.
 * Keeps all consumptions; only unlinks plan items before replacing.
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
    const template = await loadTemplate(session.user.id, dayOfWeek)

    if (!template || template.items.length === 0) {
      return NextResponse.json(
        { error: 'No weekday template to reset from. Create one on the Meal templates page.' },
        { status: 400 }
      )
    }

    let plan = await getPlanByDate(session.user.id, bounds.startOfDay)

    if (!plan) {
      plan = await prisma.dailyMealPlan.create({
        data: {
          userId: session.user.id,
          date: bounds.startOfDay,
          sourceDayOfWeek: dayOfWeek,
        },
        include: {
          items: {
            include: { food: { select: foodSelect } },
            orderBy: { sortOrder: 'asc' },
          },
        },
      })
    }

    // Unlink completed items so consumptions stay in the log
    await prisma.dailyMealPlanItem.updateMany({
      where: { planId: plan.id, consumptionId: { not: null } },
      data: { completed: false, consumptionId: null },
    })

    await prisma.dailyMealPlanItem.deleteMany({ where: { planId: plan.id } })

    await prisma.dailyMealPlan.update({
      where: { id: plan.id },
      data: {
        sourceDayOfWeek: dayOfWeek,
        items: {
          create: template.items.map((item, index) => ({
            foodId: item.foodId,
            quantity: item.quantity,
            sortOrder: index,
            completed: false,
          })),
        },
      },
    })

    const updated = await getPlanByDate(session.user.id, bounds.startOfDay)

    return NextResponse.json({
      id: updated!.id,
      date: dateParam,
      sourceDayOfWeek: updated!.sourceDayOfWeek,
      dayOfWeek,
      items: updated!.items,
      fromTemplate: true,
      hasTemplate: true,
    })
  } catch (error) {
    console.error('Error in POST /api/meal-plan/reset:', error)
    return NextResponse.json({ error: 'Error resetting meal plan' }, { status: 500 })
  }
}
