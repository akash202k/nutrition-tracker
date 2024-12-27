'use client'

import { useState, useEffect } from 'react'

interface Props {
    onConsumptionUpdate?: () => void;
}
interface Props {
    onConsumptionUpdate?: () => void;
    refreshTrigger?: number;
}
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

const NutritionTracker: React.FC<Props> = ({ onConsumptionUpdate, refreshTrigger }) => {
    const [foods, setFoods] = useState<Food[]>([])
    const [selectedFood, setSelectedFood] = useState('')
    const [quantity, setQuantity] = useState('')
    const [dailyStats, setDailyStats] = useState<DailyStats>({
        totalCalories: 0,
        totalProtein: 0,
        remainingCalories: 0,
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

            // 4. Update stats
            const newStats = {
                totalCalories: totals.calories,
                totalProtein: totals.protein,
                remainingCalories: goal.calorieGoal - totals.calories,
                remainingProtein: goal.proteinGoal - totals.protein,
            }
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
            const res = await fetch('/api/consumption', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    foodId: selectedFood,
                    quantity: parseFloat(quantity),
                }),
            })

            if (!res.ok) throw new Error('Failed to record consumption')

            await refreshDailyStats()
            onConsumptionUpdate?.()

            setSelectedFood('')
            setQuantity('')
        } catch (error) {
            console.error('Error recording consumption:', error)
        }
    }

    useEffect(() => {
        refreshDailyStats()
    }, [refreshTrigger])

    useEffect(() => {
        const initializeData = async () => {
            await fetchFoods()
            await refreshDailyStats()
        }

        initializeData()
    }, [])

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-950/20 backdrop-blur-md p-4 rounded-2xl border border-blue-900/20">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-blue-100">Daily Calories</h3>
                        <span className="text-xs bg-blue-500/20 text-blue-200 px-2 py-1 rounded-full">Goal</span>
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">
                        {dailyStats.remainingCalories.toFixed(1)}
                        <span className="text-sm font-normal text-blue-300">remaining</span>
                    </p>
                    <div className="flex items-center gap-2 text-sm text-blue-300">
                        <div className="flex-1 h-1.5 bg-blue-900/40 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${Math.min((dailyStats.totalCalories / (dailyStats.totalCalories + dailyStats.remainingCalories)) * 100, 100)}%` }}></div>
                        </div>
                        <span>{dailyStats.totalCalories.toFixed(1)} consumed</span>
                    </div>
                </div>

                <div className="bg-blue-950/20 backdrop-blur-md p-4 rounded-2xl border border-blue-900/20">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-blue-100">Daily Protein</h3>
                        <span className="text-xs bg-emerald-500/20 text-emerald-200 px-2 py-1 rounded-full">Goal</span>
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">
                        {dailyStats.remainingProtein.toFixed(1)}g
                        <span className="text-sm font-normal text-emerald-300">remaining</span>
                    </p>
                    <div className="flex items-center gap-2 text-sm text-emerald-300">
                        <div className="flex-1 h-1.5 bg-emerald-900/40 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${Math.min((dailyStats.totalProtein / (dailyStats.totalProtein + dailyStats.remainingProtein)) * 100, 100)}%` }}></div>
                        </div>
                        <span>{dailyStats.totalProtein.toFixed(1)}g consumed</span>
                    </div>
                </div>
            </div>

            {/* Record Consumption Form */}
            <div className="bg-blue-950/20 backdrop-blur-md p-6 rounded-2xl border border-blue-900/20">
                <h2 className="text-xl font-semibold text-blue-100 mb-6">Record Consumption</h2>
                <form onSubmit={handleConsumption} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-blue-200">Select Food</label>
                            <select
                                value={selectedFood}
                                onChange={(e) => setSelectedFood(e.target.value)}
                                className="w-full bg-blue-900/20 border border-blue-800/30 rounded-xl px-4 py-2.5 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select a food</option>
                                {foods.map((food) => (
                                    <option key={food.id} value={food.id} className="bg-blue-900">
                                        {food.name} ({food.caloriesPerUnit} cal, {food.proteinPerUnit}g protein)
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-blue-200">Quantity</label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                min="0"
                                step="0.1"
                                className="w-full bg-blue-900/20 border border-blue-800/30 rounded-xl px-4 py-2.5 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                                placeholder="Enter quantity"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-blue-950"
                    >
                        Add Consumption
                    </button>
                </form>
            </div>
        </div>
    )
}

export default NutritionTracker