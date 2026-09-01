import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionOrBypass } from '@/lib/auth'
import { foodSelect } from '@/lib/meal-plan'

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

    if (!item.completed) {
      return NextResponse.json(item)
    }

    if (item.consumptionId) {
      try {
        await prisma.consumption.delete({
          where: { id: item.consumptionId },
        })
      } catch {
        // Consumption may already be gone; continue clearing the link
      }
    }

    const updated = await prisma.dailyMealPlanItem.update({
      where: { id },
      data: {
        completed: false,
        consumptionId: null,
      },
      include: {
        food: { select: foodSelect },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error uncompleting meal plan item:', error)
    return NextResponse.json({ error: 'Error undoing plan item' }, { status: 500 })
  }
}
