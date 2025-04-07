import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id

        // Delete all related data in the correct order (respecting referential integrity)

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