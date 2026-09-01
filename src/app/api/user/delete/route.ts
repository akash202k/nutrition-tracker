import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionOrBypass } from '@/lib/auth'

export async function DELETE(request: Request) {
    try {
        const session = await getSessionOrBypass()

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id

        // Delete all related data in the correct order (respecting referential integrity)

        // Clear plan-item links to consumptions before deleting consumptions
        const userPlans = await prisma.dailyMealPlan.findMany({
            where: { userId },
            select: { id: true },
        })
        const planIds = userPlans.map((p) => p.id)
        if (planIds.length > 0) {
            await prisma.dailyMealPlanItem.deleteMany({
                where: { planId: { in: planIds } },
            })
            await prisma.dailyMealPlan.deleteMany({
                where: { userId },
            })
        }

        const userTemplates = await prisma.weeklyMealPlanTemplate.findMany({
            where: { userId },
            select: { id: true },
        })
        const templateIds = userTemplates.map((t) => t.id)
        if (templateIds.length > 0) {
            await prisma.weeklyMealPlanItem.deleteMany({
                where: { templateId: { in: templateIds } },
            })
            await prisma.weeklyMealPlanTemplate.deleteMany({
                where: { userId },
            })
        }

        // 1. Delete consumptions associated with the user
        await prisma.consumption.deleteMany({
            where: {
                userId: userId
            }
        })

        // 2. Delete foods associated with the user
        await prisma.food.deleteMany({
            where: {
                userId: userId
            }
        })

        // 3. Delete daily goals associated with the user
        await prisma.dailyGoal.deleteMany({
            where: {
                userId: userId
            }
        })

        // 4. Delete sessions associated with the user
        await prisma.session.deleteMany({
            where: {
                userId: userId
            }
        })

        // 5. Delete accounts associated with the user
        await prisma.account.deleteMany({
            where: {
                userId: userId
            }
        })

        // 6. Finally, delete the user record
        await prisma.user.delete({
            where: {
                id: userId
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting user account:', error)
        return NextResponse.json(
            { error: 'Error deleting user account' },
            { status: 500 }
        )
    }
}