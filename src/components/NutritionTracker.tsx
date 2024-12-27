'use client'

import { useState, useEffect } from 'react'

interface Food {
    id: string
    name: string
    caloriesPerUnit: number
    proteinPerUnit: number
}

interface DailyStats {
    totalCalories: number
    totalProtein: number
    remainingCalories: number
    remainingProtein: number
}

interface Consumption {
    id: string
    foodId: string
    quantity: number
    food: Food
}

export default function NutritionTracker() {
    const [foods, setFoods] = useState<Food[]>([])
    const [selectedFood, setSelectedFood] = useState('')
    const [quantity, setQuantity] = useState('')
    const [dailyStats, setDailyStats] = useState<DailyStats>({
        totalCalories: 0,
        totalProtein: 0,
        remainingCalories: 0, // Start at 0 until we load real data
        remainingProtein: 0,
    })

    const refreshDailyStats = async () => {
        try {
            // 1. Get daily goal
            const goalRes = await fetch('/api/daily-goal')
            if (!goalRes.ok) throw new Error('Failed to fetch daily goal')
            const goal = await goalRes.json()
            console.log('Fetched goal:', goal)

            // 2. Get today's consumptions
            const consumptionsRes = await fetch('/api/consumption')
            if (!consumptionsRes.ok) throw new Error('Failed to fetch consumptions')
            const consumptions: Consumption[] = await consumptionsRes.json()
            console.log('Fetched consumptions:', consumptions)

            // 3. Calculate totals
            const totals = consumptions.reduce(
                (acc, consumption) => {
                    const calories = consumption.food.caloriesPerUnit * consumption.quantity
                    const protein = consumption.food.proteinPerUnit * consumption.quantity
                    return {
                        calories: acc.calories + calories,
                        protein: acc.protein + protein,
                    }
                },
                { calories: 0, protein: 0 }
            )
            console.log('Calculated totals:', totals)

            // 4. Update stats
            const newStats = {
                totalCalories: totals.calories,
                totalProtein: totals.protein,
                remainingCalories: goal.calorieGoal - totals.calories,
                remainingProtein: goal.proteinGoal - totals.protein,
            }
            console.log('Setting new stats:', newStats)
            setDailyStats(newStats)
        } catch (error) {
            console.error('Error refreshing daily stats:', error)
        }
    }

    const fetchFoods = async () => {
        try {
            const res = await fetch('/api/food')
            if (!res.ok) throw new Error('Failed to fetch foods')
            const data = await res.json()
            console.log('Fetched foods:', data)
            setFoods(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error('Error fetching foods:', error)
            setFoods([])
        }
    }

    const handleConsumption = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedFood || !quantity) return

        try {
            console.log('Recording consumption:', { foodId: selectedFood, quantity })
            const res = await fetch('/api/consumption', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    foodId: selectedFood,
                    quantity: parseFloat(quantity),
                }),
            })

            if (!res.ok) throw new Error('Failed to record consumption')
            console.log('Consumption recorded successfully')

            // Refresh stats after successful consumption
            await refreshDailyStats()

            // Reset form
            setSelectedFood('')
            setQuantity('')
        } catch (error) {
            console.error('Error recording consumption:', error)
        }
    }

    useEffect(() => {
        const initializeData = async () => {
            try {
                console.log('Initializing data...')
                await fetchFoods()
                await refreshDailyStats()
                console.log('Data initialization complete')
            } catch (error) {
                console.error('Error initializing data:', error)
            }
        }

        initializeData()
    }, [])

    return (
        <div className="space-y-6">
            <form onSubmit={handleConsumption} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Select Food</label>
                        <select
                            value={selectedFood}
                            onChange={(e) => setSelectedFood(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                            required
                        >
                            <option value="">Select a food</option>
                            {foods.map((food) => (
                                <option key={food.id} value={food.id}>
                                    {food.name} ({food.caloriesPerUnit} cal, {food.proteinPerUnit}g protein)
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Quantity</label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            min="0"
                            step="0.1"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                            required
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                    Add Consumption
                </button>
            </form>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-lg shadow">
                    <h3 className="font-medium">Daily Calories</h3>
                    <p className="text-2xl">
                        {dailyStats.remainingCalories.toFixed(1)} remaining
                    </p>
                    <p className="text-sm text-gray-500">
                        {dailyStats.totalCalories.toFixed(1)} consumed
                    </p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow">
                    <h3 className="font-medium">Daily Protein</h3>
                    <p className="text-2xl">
                        {dailyStats.remainingProtein.toFixed(1)}g remaining
                    </p>
                    <p className="text-sm text-gray-500">
                        {dailyStats.totalProtein.toFixed(1)}g consumed
                    </p>
                </div>
            </div>
        </div>
    )
}