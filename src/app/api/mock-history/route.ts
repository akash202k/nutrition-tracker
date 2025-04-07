import { NextResponse } from 'next/server'
import { subDays, format } from 'date-fns'

export async function GET(request: Request) {
    try {
        // Get query parameters
        const { searchParams } = new URL(request.url)
        const days = Number(searchParams.get('days') || '30')

        // Generate mock data
        const mockData = []
        const today = new Date()

        for (let i = days - 1; i >= 0; i--) {
            const date = subDays(today, i)
            const dateString = format(date, 'yyyy-MM-dd')

            // Create random but reasonable values
            mockData.push({
                date: dateString,
                calories: Math.round(Math.random() * 1800 + 200), // Between 200-2000
                protein: Math.round(Math.random() * 100 + 20), // Between 20-120
            })
        }

        return NextResponse.json(mockData)
    } catch (error) {
        console.error('Error generating mock history:', error)
        return NextResponse.json(
            { error: 'Error generating mock history' },
            { status: 500 }
        )
    }
}