'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

interface Props {
    onConsumptionUpdate?: () => void;
    refreshTrigger?: number;
    foodRefreshTrigger?: number;
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

const NutritionTracker: React.FC<Props> = ({ onConsumptionUpdate, refreshTrigger, foodRefreshTrigger }) => {
    const [foods, setFoods] = useState<Food[]>([])
    const [selectedFood, setSelectedFood] = useState('')
    const [quantity, setQuantity] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [showDropdown, setShowDropdown] = useState(false)
    const [filteredFoods, setFilteredFoods] = useState<Food[]>([])
    const searchInputRef = useRef<HTMLInputElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
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

            // 2. Get today's consumptions
            const consumptionsRes = await fetch('/api/consumption')
            if (!consumptionsRes.ok) throw new Error('Failed to fetch consumptions')
            const consumptions: Consumption[] = await consumptionsRes.json()

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
                remainingCalories: goal?.calorieGoal ? goal.calorieGoal - totals.calories : 0,
                remainingProtein: goal?.proteinGoal ? goal.proteinGoal - totals.protein : 0,
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
            setSearchQuery('')
        } catch (error) {
            console.error('Error recording consumption:', error)
        }
    }

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value
        setSearchQuery(query)

        const filtered = foods.filter(food =>
            food.name.toLowerCase().includes(query.toLowerCase())
        )
        setFilteredFoods(filtered)
        setShowDropdown(true)
    }

    const handleFoodSelect = (food: Food) => {
        setSelectedFood(food.id)
        setSearchQuery(food.name)
        setShowDropdown(false)
    }

    const handleClickOutside = (e: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
            searchInputRef.current && !searchInputRef.current.contains(e.target as Node)) {
            setShowDropdown(false)
        }
    }

    const clearSearch = () => {
        setSearchQuery('')
        setSelectedFood('')
        setShowDropdown(false)
        if (searchInputRef.current) {
            searchInputRef.current.focus()
        }
    }

    // Close dropdown on outside click
    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    // Update filtered foods when all foods change
    useEffect(() => {
        if (searchQuery) {
            const filtered = foods.filter(food =>
                food.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            setFilteredFoods(filtered)
        }
    }, [foods, searchQuery])

    // Refresh when consumption data changes
    useEffect(() => {
        refreshDailyStats()
    }, [refreshTrigger])

    // Refresh when food data changes
    useEffect(() => {
        fetchFoods()
    }, [foodRefreshTrigger])

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
                        <span className="text-sm font-normal text-blue-300">&nbsp;remaining</span>
                    </p>
                    <div className="flex items-center gap-2 text-sm text-blue-300">
                        <div className="flex-1 h-1.5 bg-blue-900/40 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500"
                                style={{
                                    width: `${Math.min((dailyStats.totalCalories / (dailyStats.totalCalories + Math.max(dailyStats.remainingCalories, 0.1))) * 100, 100)}%`
                                }}
                            ></div>
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
                        <span className="text-sm font-normal text-emerald-300">&nbsp;remaining</span>
                    </p>
                    <div className="flex items-center gap-2 text-sm text-emerald-300">
                        <div className="flex-1 h-1.5 bg-emerald-900/40 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500"
                                style={{
                                    width: `${Math.min((dailyStats.totalProtein / (dailyStats.totalProtein + Math.max(dailyStats.remainingProtein, 0.1))) * 100, 100)}%`
                                }}
                            ></div>
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
                        <div className="space-y-2 relative">
                            <label className="block text-sm font-medium text-blue-200">Search Food</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search size={16} className="text-blue-400" />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    onFocus={() => setShowDropdown(true)}
                                    ref={searchInputRef}
                                    className="w-full pl-10 pr-10 bg-blue-900/20 border border-blue-800/30 rounded-xl px-4 py-2.5 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Search for a food..."
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={clearSearch}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        <X size={16} className="text-blue-400 hover:text-blue-200" />
                                    </button>
                                )}
                            </div>

                            {/* Dropdown results */}
                            {showDropdown && filteredFoods.length > 0 && (
                                <div
                                    ref={dropdownRef}
                                    className="absolute z-10 mt-1 w-full bg-blue-950 border border-blue-800/50 rounded-xl shadow-lg max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-800/50"
                                >
                                    {filteredFoods.map(food => (
                                        <div
                                            key={food.id}
                                            onClick={() => handleFoodSelect(food)}
                                            className="px-4 py-2 cursor-pointer hover:bg-blue-900/50 transition-colors text-blue-100"
                                        >
                                            <div className="font-medium">{food.name}</div>
                                            <div className="text-xs text-blue-300">
                                                {food.caloriesPerUnit} cal, {food.proteinPerUnit}g protein
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {showDropdown && searchQuery && filteredFoods.length === 0 && (
                                <div className="absolute z-10 mt-1 w-full bg-blue-950 border border-blue-800/50 rounded-xl shadow-lg p-4 text-center">
                                    <p className="text-blue-300">No foods found</p>
                                </div>
                            )}
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