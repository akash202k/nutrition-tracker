import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionOrBypass } from '@/lib/auth'
import { foodSelect, formatLocalDate, getDayBounds, toMondayBasedDayOfWeek } from '@/lib/meal-plan'

async function getPlanWithItems(planId: string) {
  return prisma.dailyMealPlan.findUnique({
    where: { id: planId },
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

async function fillPlanFromTemplateIfEmpty(
  planId: string,
  templateItems: Array<{ foodId: string; quantity: number }>
): Promise<boolean> {
  // Re-check emptiness to reduce duplicate fills from concurrent GETs
  const current = await prisma.dailyMealPlanItem.count({ where: { planId } })
  if (current > 0) return false

  await prisma.dailyMealPlanItem.createMany({
    data: templateItems.map((item, index) => ({
      planId,
      foodId: item.foodId,
      quantity: item.quantity,
      sortOrder: index,
      completed: false,
    })),
  })
  return true
}

async function materializePlan(userId: string, startOfDay: Date) {
  const dayOfWeek = toMondayBasedDayOfWeek(startOfDay.getDay())
  const template = await loadTemplate(userId, dayOfWeek)
  const hasTemplate = !!(template && template.items.length > 0)

  const existing = await getPlanByDate(userId, startOfDay)

  if (existing) {
    // If plan was created empty before a template existed, fill it once from the template
    if (existing.items.length === 0 && hasTemplate) {
      await prisma.dailyMealPlan.update({
        where: { id: existing.id },
        data: { sourceDayOfWeek: dayOfWeek },
      })
      await fillPlanFromTemplateIfEmpty(existing.id, template!.items)
      const filled = await getPlanByDate(userId, startOfDay)
      return { plan: filled!, fromTemplate: true, hasTemplate: true }
    }
    return {
      plan: existing,
      fromTemplate: false,
      hasTemplate: hasTemplate || existing.items.length > 0,
    }
  }

  try {
    const plan = await prisma.dailyMealPlan.create({
      data: {
        userId,
        date: startOfDay,
        sourceDayOfWeek: hasTemplate ? dayOfWeek : null,
        items: hasTemplate
          ? {
              create: template!.items.map((item, index) => ({
                foodId: item.foodId,
                quantity: item.quantity,
                sortOrder: index,
                completed: false,
              })),
            }
          : undefined,
      },
      include: {
        items: {
          include: { food: { select: foodSelect } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })
    return { plan, fromTemplate: hasTemplate, hasTemplate }
  } catch (error) {
    // Concurrent create — re-read; fill if still empty and template exists
    const raced = await getPlanByDate(userId, startOfDay)
    if (raced) {
      if (raced.items.length === 0 && hasTemplate) {
        await prisma.dailyMealPlan.update({
          where: { id: raced.id },
          data: { sourceDayOfWeek: dayOfWeek },
        })
        await fillPlanFromTemplateIfEmpty(raced.id, template!.items)
        const filled = await getPlanByDate(userId, startOfDay)
        return { plan: filled!, fromTemplate: true, hasTemplate: true }
      }
      return { plan: raced, fromTemplate: false, hasTemplate }
    }
    throw error
  }
}

function planResponse(
  plan: NonNullable<Awaited<ReturnType<typeof getPlanByDate>>>,
  dateParam: string,
  extras: { fromTemplate?: boolean; hasTemplate: boolean; dayOfWeek: number }
) {
  return {
    id: plan.id,
    date: dateParam,
    sourceDayOfWeek: plan.sourceDayOfWeek,
    dayOfWeek: extras.dayOfWeek,
    items: plan.items,
    fromTemplate: extras.fromTemplate ?? false,
    hasTemplate: extras.hasTemplate,
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSessionOrBypass()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    if (!dateParam) {
      return NextResponse.json({ error: 'date query param required (YYYY-MM-DD)' }, { status: 400 })
    }

    const bounds = getDayBounds(dateParam)
    if (!bounds) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 })
    }

    const { plan, fromTemplate, hasTemplate } = await materializePlan(session.user.id, bounds.startOfDay)

    const dayOfWeek = toMondayBasedDayOfWeek(bounds.startOfDay.getDay())
    const template = await prisma.weeklyMealPlanTemplate.findUnique({
      where: {
        userId_dayOfWeek: { userId: session.user.id, dayOfWeek },
      },
      select: { id: true },
    })

    return NextResponse.json(
      planResponse(plan, dateParam, {
        fromTemplate,
        hasTemplate: hasTemplate || !!template,
        dayOfWeek,
      })
    )
  } catch (error) {
    console.error('Error in GET /api/meal-plan:', error)
    return NextResponse.json({ error: 'Error fetching meal plan' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionOrBypass()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { itemId, quantity } = body

    if (!itemId || typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json({ error: 'itemId and quantity > 0 required' }, { status: 400 })
    }

    const item = await prisma.dailyMealPlanItem.findUnique({
      where: { id: itemId },
      include: { plan: true },
    })

    if (!item || item.plan.userId !== session.user.id) {
      return NextResponse.json({ error: 'Plan item not found' }, { status: 404 })
    }

    await prisma.dailyMealPlanItem.update({
      where: { id: itemId },
      data: { quantity },
    })

    if (item.completed && item.consumptionId) {
      await prisma.consumption.update({
        where: { id: item.consumptionId },
        data: { quantity },
      })
    }

    const plan = await getPlanWithItems(item.planId)
    return NextResponse.json({
      id: plan!.id,
      date: formatLocalDate(plan!.date),
      sourceDayOfWeek: plan!.sourceDayOfWeek,
      items: plan!.items,
    })
  } catch (error) {
    console.error('Error in PUT /api/meal-plan:', error)
    return NextResponse.json({ error: 'Error updating meal plan item' }, { status: 500 })
  }
}

/** Append a food item to the day's plan (does not create a consumption). */
export async function POST(request: Request) {
  try {
    const session = await getSessionOrBypass()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { date: dateParam, foodId, quantity } = body

    if (!dateParam || !foodId || typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json(
        { error: 'date, foodId, and quantity > 0 required' },
        { status: 400 }
      )
    }

    const bounds = getDayBounds(dateParam)
    if (!bounds) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 })
    }

    const food = await prisma.food.findFirst({
      where: { id: foodId, userId: session.user.id },
      select: foodSelect,
    })
    if (!food) {
      return NextResponse.json({ error: 'Food not found' }, { status: 404 })
    }

    const { plan, hasTemplate } = await materializePlan(session.user.id, bounds.startOfDay)
    const dayOfWeek = toMondayBasedDayOfWeek(bounds.startOfDay.getDay())
    const maxSort = plan.items.reduce((max, item) => Math.max(max, item.sortOrder), -1)

    await prisma.dailyMealPlanItem.create({
      data: {
        planId: plan.id,
        foodId,
        quantity,
        sortOrder: maxSort + 1,
        completed: false,
      },
    })

    const updated = await getPlanByDate(session.user.id, bounds.startOfDay)
    return NextResponse.json(
      planResponse(updated!, dateParam, { hasTemplate, dayOfWeek })
    )
  } catch (error) {
    console.error('Error in POST /api/meal-plan:', error)
    return NextResponse.json({ error: 'Error adding meal plan item' }, { status: 500 })
  }
}

/** Remove one day-plan item; unlink if completed, never delete consumption. */
export async function DELETE(request: Request) {
  try {
    const session = await getSessionOrBypass()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')
    if (!itemId) {
      return NextResponse.json({ error: 'itemId query param required' }, { status: 400 })
    }

    const item = await prisma.dailyMealPlanItem.findUnique({
      where: { id: itemId },
      include: { plan: true },
    })

    if (!item || item.plan.userId !== session.user.id) {
      return NextResponse.json({ error: 'Plan item not found' }, { status: 404 })
    }

    // Unlink consumption before delete so the log is preserved
    if (item.consumptionId) {
      await prisma.dailyMealPlanItem.update({
        where: { id: itemId },
        data: { completed: false, consumptionId: null },
      })
    }

    await prisma.dailyMealPlanItem.delete({ where: { id: itemId } })

    const dateParam = formatLocalDate(item.plan.date)
    const bounds = getDayBounds(dateParam)
    const dayOfWeek = toMondayBasedDayOfWeek(item.plan.date.getDay())
    const updated = await getPlanByDate(session.user.id, bounds!.startOfDay)
    const template = await loadTemplate(session.user.id, dayOfWeek)

    return NextResponse.json(
      planResponse(updated!, dateParam, {
        hasTemplate: !!(template && template.items.length > 0) || (updated?.items.length ?? 0) > 0,
        dayOfWeek,
      })
    )
  } catch (error) {
    console.error('Error in DELETE /api/meal-plan:', error)
    return NextResponse.json({ error: 'Error deleting meal plan item' }, { status: 500 })
  }
}
