'use client'

import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { FoodSearchPicker } from '@/components/FoodSearchPicker'
import { computeDailyStats, sumItemMacros } from '@/lib/nutrition'
import type { DailyNutritionStats, Food, NutritionTotals } from '@/types'

interface Props {
    onConsumptionUpdate?: (date?: string) => void
    refreshTrigger?: number
    foodRefreshTrigger?: number
    selectedViewDate?: string
    onDateChange?: (date: string) => void
    /** Planned macros from the day plan panel — avoids a second meal-plan materialize GET */
    plannedTotals?: NutritionTotals
}

interface Consumption {
    id: string
    foodId: string
    quantity: number
    food: Food
}

const emptyStats: DailyNutritionStats = {
    consumedCalories: 0,
    consumedProtein: 0,
    plannedCalories: 0,
    plannedProtein: 0,
    remainingCalories: 0,
    remainingProtein: 0,
    calorieGoal: 0,
    proteinGoal: 0,
}

const emptyTotals: NutritionTotals = { calories: 0, protein: 0 }

const NutritionTracker: React.FC<Props> = ({
    onConsumptionUpdate,
    refreshTrigger,
    foodRefreshTrigger,
    selectedViewDate,
    onDateChange,
    plannedTotals = emptyTotals,
}) => {
    const [foods, setFoods] = useState<Food[]>([])
    const [selectedFood, setSelectedFood] = useState('')
    const [quantity, setQuantity] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [dailyStats, setDailyStats] = useState<DailyNutritionStats>(emptyStats)
    const plannedTotalsRef = useRef(plannedTotals)
    plannedTotalsRef.current = plannedTotals

    const refreshDailyStats = async () => {
        try {
            const dateParam = selectedViewDate || format(new Date(), 'yyyy-MM-dd')

            const [goalRes, consumptionsRes] = await Promise.all([
                fetch('/api/daily-goal'),
                fetch(`/api/consumption?date=${dateParam}`),
            ])

            if (!goalRes.ok) throw new Error('Failed to fetch daily goal')
            if (!consumptionsRes.ok) throw new Error('Failed to fetch consumptions')

            const goal = await goalRes.json()
            const consumptions: Consumption[] = await consumptionsRes.json()
            const consumed = sumItemMacros(consumptions)
            const planned = plannedTotalsRef.current

            setDailyStats(
                computeDailyStats({
                    calorieGoal: goal?.calorieGoal ?? 0,
                    proteinGoal: goal?.proteinGoal ?? 0,
                    consumed,
                    planned,
                })
            )
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
                    date: selectedDate,
                }),
            })

            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.error || 'Failed to record consumption')
            }

            if (onDateChange) {
                onDateChange(selectedDate)
            }

            await refreshDailyStats()
            onConsumptionUpdate?.(selectedDate)

            setSelectedFood('')
            setQuantity('')
            setSearchQuery('')
            setSelectedDate(format(new Date(), 'yyyy-MM-dd'))
        } catch (error) {
            console.error('Error recording consumption:', error)
        }
    }

    const getTodayString = () => format(new Date(), 'yyyy-MM-dd')
    const maxDate = getTodayString()

    const handleDateChange = (date: string) => {
        setSelectedDate(date)
        if (onDateChange) {
            onDateChange(date)
        }
    }

    useEffect(() => {
        refreshDailyStats()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshTrigger, selectedViewDate])

    useEffect(() => {
        setDailyStats((prev) => ({
            ...prev,
            plannedCalories: plannedTotals.calories,
            plannedProtein: plannedTotals.protein,
        }))
    }, [plannedTotals.calories, plannedTotals.protein])

    useEffect(() => {
        fetchFoods()
    }, [foodRefreshTrigger])

    useEffect(() => {
        const initializeData = async () => {
            await fetchFoods()
            await refreshDailyStats()
        }

        initializeData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (selectedViewDate) {
            setSelectedDate(selectedViewDate)
        }
    }, [selectedViewDate])

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-950/20 backdrop-blur-md p-4 rounded-2xl border border-blue-900/20">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-blue-100">Daily Calories</h3>
                        <span className="text-xs bg-blue-500/20 text-blue-200 px-2 py-1 rounded-full">Goal</span>
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">
                        {dailyStats.remainingCalories.toFixed(1)}
                        <span className="text-sm font-normal text-blue-300">&nbsp;remaining</span>
                    </p>
                    <div className="flex items-center gap-2 text-sm text-blue-300">
                        <div className="flex-1 h-1.5 bg-blue-900/40 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500"
                                style={{
                                    width: `${Math.min((dailyStats.consumedCalories / (dailyStats.consumedCalories + Math.max(dailyStats.remainingCalories, 0.1))) * 100, 100)}%`
                                }}
                            ></div>
                        </div>
                        <span>{dailyStats.consumedCalories.toFixed(1)} consumed</span>
                    </div>
                    <p className="text-xs text-blue-400 mt-2">
                        Planned {dailyStats.plannedCalories.toFixed(1)} cal
                    </p>
                </div>

                <div className="bg-blue-950/20 backdrop-blur-md p-4 rounded-2xl border border-blue-900/20">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-blue-100">Daily Protein</h3>
                        <span className="text-xs bg-emerald-500/20 text-emerald-200 px-2 py-1 rounded-full">Goal</span>
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">
                        {dailyStats.remainingProtein.toFixed(1)}g
                        <span className="text-sm font-normal text-emerald-300">&nbsp;remaining</span>
                    </p>
                    <div className="flex items-center gap-2 text-sm text-emerald-300">
                        <div className="flex-1 h-1.5 bg-emerald-900/40 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500"
                                style={{
                                    width: `${Math.min((dailyStats.consumedProtein / (dailyStats.consumedProtein + Math.max(dailyStats.remainingProtein, 0.1))) * 100, 100)}%`
                                }}
                            ></div>
                        </div>
                        <span>{dailyStats.consumedProtein.toFixed(1)}g consumed</span>
                    </div>
                    <p className="text-xs text-emerald-400/80 mt-2">
                        Planned {dailyStats.plannedProtein.toFixed(1)}g
                    </p>
                </div>
            </div>

            <div className="bg-blue-950/20 backdrop-blur-md p-6 rounded-2xl border border-blue-900/20">
                <h2 className="text-xl font-semibold text-blue-100 mb-6">Record extra</h2>
                <form onSubmit={handleConsumption} className="space-y-6">
                    <FoodSearchPicker
                        foods={foods}
                        selectedFoodId={selectedFood}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onFoodSelect={(food) => {
                            setSelectedFood(food.id)
                            setSearchQuery(food.name)
                        }}
                        onClear={() => {
                            setSelectedFood('')
                            setSearchQuery('')
                        }}
                        quantity={quantity}
                        onQuantityChange={setQuantity}
                    />

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-blue-200">Date</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => handleDateChange(e.target.value)}
                            max={maxDate}
                            className="w-full md:w-auto bg-blue-900/20 border border-blue-800/30 rounded-xl px-4 py-2.5 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div className="text-xs text-blue-300">
                        Use the day plan to check off planned foods. Log anything else here.
                    </div>
                    <button
                        type="submit"
                        disabled={!selectedFood || !quantity}
                        className="w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-blue-950 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Add Consumption
                    </button>
                </form>
            </div>
        </div>
    )
}

export default NutritionTracker
