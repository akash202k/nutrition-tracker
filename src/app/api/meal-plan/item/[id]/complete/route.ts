import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionOrBypass } from '@/lib/auth'
import { foodSelect, formatLocalDate } from '@/lib/meal-plan'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionOrBypass()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const item = await prisma.dailyMealPlanItem.findUnique({
      where: { id },
      include: {
        plan: true,
        food: { select: foodSelect },
      },
    })

    if (!item || item.plan.userId !== session.user.id) {
      return NextResponse.json({ error: 'Plan item not found' }, { status: 404 })
    }

    if (item.completed && item.consumptionId) {
      return NextResponse.json({
        id: item.id,
        completed: true,
        consumptionId: item.consumptionId,
        food: item.food,
        quantity: item.quantity,
      })
    }

    const planDay = formatLocalDate(item.plan.date)
    const today = formatLocalDate(new Date())
    let consumptionDate: Date
    if (planDay === today) {
      consumptionDate = new Date()
    } else {
      consumptionDate = new Date(item.plan.date)
      const now = new Date()
      consumptionDate.setHours(
        now.getHours(),
        now.getMinutes(),
        now.getSeconds(),
        now.getMilliseconds()
      )
    }

    const consumption = await prisma.consumption.create({
      data: {
        userId: session.user.id,
        foodId: item.foodId,
        quantity: item.quantity,
        date: consumptionDate,
      },
    })

    const updated = await prisma.dailyMealPlanItem.update({
      where: { id },
      data: {
        completed: true,
        consumptionId: consumption.id,
      },
      include: {
        food: { select: foodSelect },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error completing meal plan item:', error)
    return NextResponse.json({ error: 'Error completing plan item' }, { status: 500 })
  }
}
