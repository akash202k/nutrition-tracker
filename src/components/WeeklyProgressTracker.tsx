'use client'

import { useState, useEffect } from 'react'
import { format, subDays, isToday, startOfDay, endOfDay } from 'date-fns'
import { parseISO } from 'date-fns/parseISO'
import { Calendar, ChevronDown, Info, PieChart } from 'lucide-react'

interface DayData {
    date: string
    caloriesConsumed: number
    proteinConsumed: number
    calorieGoal: number
    proteinGoal: number
}

interface WeeklyProgressTrackerProps {
    refreshTrigger?: number
}

const WeeklyProgressTracker = ({ refreshTrigger }: WeeklyProgressTrackerProps) => {
    const [weekData, setWeekData] = useState<DayData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showDetails, setShowDetails] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [selectedStats, setSelectedStats] = useState<{
        caloriesConsumed: number
        proteinConsumed: number
        calorieGoal: number
        proteinGoal: number
    } | null>(null)
    const [dateRange, setDateRange] = useState<'week' | 'month' | 'custom'>('week')
    const [showDropdown, setShowDropdown] = useState(false)
    const [startDate, setStartDate] = useState<string | null>(null)
    const [endDate, setEndDate] = useState<string | null>(null)
    const [showTotalMetrics, setShowTotalMetrics] = useState(false)

    // Date range helper functions
    const getDateRangeText = () => {
        if (dateRange === 'week') {
            return 'Last 7 days'
        } else if (dateRange === 'month') {
            return 'Last 30 days'
        } else if (dateRange === 'custom' && startDate && endDate) {
            const start = new Date(startDate)
            const end = new Date(endDate)
            const diffTime = Math.abs(end.getTime() - start.getTime())
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
            return `${format(start, 'MMM d')} - ${format(end, 'MMM d')} (${diffDays} days)`
        }
        return ''
    }

    const fetchWeekData = async () => {
        try {
            setIsLoading(true)

            // Get current goal - with error handling
            let currentGoal = {
                calorieGoal: 2000, // Default values
                proteinGoal: 120
            }

            try {
                const goalRes = await fetch('/api/daily-goal')
                if (goalRes.ok) {
                    const goalData = await goalRes.json()
                    if (goalData) {
                        currentGoal = {
                            calorieGoal: goalData.calorieGoal || 2000,
                            proteinGoal: goalData.proteinGoal || 120
                        }
                    }
                } else {
                    console.error('Failed to fetch goals:', await goalRes.text())
                }
            } catch (error) {
                console.error('Error fetching goals:', error)
            }

            // Determine date range based on selection
            let daysToFetch = 7
            if (dateRange === 'month') {
                daysToFetch = 30
            }

            // Mock data if we can't fetch from API (for development/fallback)
            let historyData: any[] = []

            // Get consumption history
            try {
                const historyRes = await fetch('/api/history')
                if (historyRes.ok) {
                    historyData = await historyRes.json()
                    if (!Array.isArray(historyData)) {
                        console.error('History data is not an array:', historyData)

                        // Try our mock API as fallback
                        const mockRes = await fetch('/api/mock-history')
                        if (mockRes.ok) {
                            historyData = await mockRes.json()
                        } else {
                            historyData = []
                        }
                    }
                } else {
                    console.error('Failed to fetch history:', await historyRes.text())

                    // Try our mock API as fallback
                    try {
                        const mockRes = await fetch('/api/mock-history')
                        if (mockRes.ok) {
                            historyData = await mockRes.json()
                        } else {
                            // Last resort - generate data in component
                            historyData = Array.from({ length: 30 }, (_, i) => ({
                                date: format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'),
                                calories: Math.floor(Math.random() * currentGoal.calorieGoal),
                                protein: Math.floor(Math.random() * currentGoal.proteinGoal)
                            }))
                        }
                    } catch (fallbackError) {
                        console.error('Error fetching mock history:', fallbackError)
                        historyData = Array.from({ length: 30 }, (_, i) => ({
                            date: format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'),
                            calories: Math.floor(Math.random() * currentGoal.calorieGoal),
                            protein: Math.floor(Math.random() * currentGoal.proteinGoal)
                        }))
                    }
                }
            } catch (error) {
                console.error('Error fetching history:', error)

                // Try our mock API as fallback
                try {
                    const mockRes = await fetch('/api/mock-history')
                    if (mockRes.ok) {
                        historyData = await mockRes.json()
                    } else {
                        // Last resort - generate data in component
                        historyData = Array.from({ length: 30 }, (_, i) => ({
                            date: format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'),
                            calories: Math.floor(Math.random() * currentGoal.calorieGoal),
                            protein: Math.floor(Math.random() * currentGoal.proteinGoal)
                        }))
                    }
                } catch (fallbackError) {
                    console.error('Error fetching mock history:', fallbackError)
                    historyData = Array.from({ length: 30 }, (_, i) => ({
                        date: format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'),
                        calories: Math.floor(Math.random() * currentGoal.calorieGoal),
                        protein: Math.floor(Math.random() * currentGoal.proteinGoal)
                    }))
                }
            }

            // Create array of last N days
            const days: DayData[] = []

            // For custom date range
            if (dateRange === 'custom' && startDate && endDate) {
                const start = new Date(startDate)
                const end = new Date(endDate)
                const dayCount = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

                for (let i = 0; i < dayCount; i++) {
                    const date = new Date(start)
                    date.setDate(date.getDate() + i)
                    const dateString = format(date, 'yyyy-MM-dd')

                    const dayData = historyData.find((d: any) => d.date === dateString) || {
                        date: dateString,
                        calories: 0,
                        protein: 0
                    }

                    days.push({
                        date: dateString,
                        caloriesConsumed: dayData.calories || 0,
                        proteinConsumed: dayData.protein || 0,
                        calorieGoal: currentGoal.calorieGoal,
                        proteinGoal: currentGoal.proteinGoal
                    })
                }
            } else {
                // For week or month
                for (let i = 0; i < daysToFetch; i++) {
                    const date = subDays(new Date(), i)
                    const dateString = format(date, 'yyyy-MM-dd')

                    const dayData = historyData.find((d: any) => d.date === dateString) || {
                        date: dateString,
                        calories: 0,
                        protein: 0
                    }

                    days.push({
                        date: dateString,
                        caloriesConsumed: dayData.calories || 0,
                        proteinConsumed: dayData.protein || 0,
                        calorieGoal: currentGoal.calorieGoal,
                        proteinGoal: currentGoal.proteinGoal
                    })
                }
            }

            // Reverse the array to show days in chronological order
            days.reverse()
            setWeekData(days)
        } catch (error) {
            console.error('Error fetching weekly data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDayClick = (day: DayData, date: Date) => {
        setSelectedDate(date)
        setSelectedStats({
            caloriesConsumed: day.caloriesConsumed,
            proteinConsumed: day.proteinConsumed,
            calorieGoal: day.calorieGoal,
            proteinGoal: day.proteinGoal
        })
        setShowDetails(true)
    }

    const closeDetails = () => {
        setShowDetails(false)
        setSelectedDate(null)
        setSelectedStats(null)
    }

    const weeklyAverage = () => {
        if (weekData.length === 0) return {
            calories: 0,
            protein: 0,
            caloriePercent: 0,
            proteinPercent: 0,
            totalCalories: 0,
            totalProtein: 0,
            avgCalorieGoal: 0,
            avgProteinGoal: 0,
            totalCalorieGoal: 0,
            totalProteinGoal: 0,
            daysCount: 0
        }

        const totals = weekData.reduce((acc, day) => {
            return {
                calories: acc.calories + day.caloriesConsumed,
                protein: acc.protein + day.proteinConsumed,
                calorieGoalTotal: acc.calorieGoalTotal + day.calorieGoal,
                proteinGoalTotal: acc.proteinGoalTotal + day.proteinGoal
            }
        }, { calories: 0, protein: 0, calorieGoalTotal: 0, proteinGoalTotal: 0 })

        return {
            calories: totals.calories / weekData.length,
            protein: totals.protein / weekData.length,
            caloriePercent: (totals.calories / totals.calorieGoalTotal) * 100,
            proteinPercent: (totals.protein / totals.proteinGoalTotal) * 100,
            totalCalories: totals.calories,
            totalProtein: totals.protein,
            avgCalorieGoal: totals.calorieGoalTotal / weekData.length,
            avgProteinGoal: totals.proteinGoalTotal / weekData.length,
            totalCalorieGoal: totals.calorieGoalTotal,
            totalProteinGoal: totals.proteinGoalTotal,
            daysCount: weekData.length
        }
    }

    const handleRangeChange = (range: 'week' | 'month' | 'custom') => {
        setDateRange(range)
        setShowDropdown(false)

        // Set default custom date range if needed
        if (range === 'custom' && !startDate && !endDate) {
            const end = new Date()
            const start = subDays(end, 7)
            setStartDate(format(start, 'yyyy-MM-dd'))
            setEndDate(format(end, 'yyyy-MM-dd'))
        }
    }

    const handleCustomRangeSubmit = () => {
        if (startDate && endDate) {
            fetchWeekData()
        }
    }

    useEffect(() => {
        fetchWeekData()
    }, [refreshTrigger, dateRange])

    // Calculate weekly stats
    const weeklyStats = weeklyAverage()

    // Day abbreviations
    const dayAbbreviations = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

    return (
        <div className="bg-blue-950/20 backdrop-blur-md p-6 rounded-2xl border border-blue-900/20">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-blue-100">Progress Tracker</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowTotalMetrics(!showTotalMetrics)}
                        className="p-2 text-blue-200 hover:text-blue-100 bg-blue-900/30 hover:bg-blue-800/40 rounded-lg transition-colors"
                        title={showTotalMetrics ? "Show averages" : "Show totals"}
                    >
                        <PieChart size={18} />
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-200 bg-blue-900/30 hover:bg-blue-800/40 rounded-lg transition-colors"
                        >
                            {dateRange === 'week' ? 'Last 7 days' :
                                dateRange === 'month' ? 'Last 30 days' : 'Custom range'}
                            <ChevronDown size={16} />
                        </button>

                        {showDropdown && (
                            <div className="absolute right-0 mt-2 w-48 bg-blue-950 border border-blue-800/50 rounded-xl shadow-lg z-10">
                                <div className="py-1">
                                    <button
                                        onClick={() => handleRangeChange('week')}
                                        className="w-full text-left px-4 py-2 text-sm text-blue-200 hover:bg-blue-900/50 hover:text-white"
                                    >
                                        Last 7 days
                                    </button>
                                    <button
                                        onClick={() => handleRangeChange('month')}
                                        className="w-full text-left px-4 py-2 text-sm text-blue-200 hover:bg-blue-900/50 hover:text-white"
                                    >
                                        Last 30 days
                                    </button>
                                    <button
                                        onClick={() => handleRangeChange('custom')}
                                        className="w-full text-left px-4 py-2 text-sm text-blue-200 hover:bg-blue-900/50 hover:text-white"
                                    >
                                        Custom range
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Date range summary */}
            {weekData.length > 0 && (
                <div className="flex justify-center mb-4">
                    <div className="text-sm text-blue-300 bg-blue-900/20 px-3 py-1 rounded-full">
                        {getDateRangeText()} {showTotalMetrics ? '(Total Metrics)' : '(Daily Averages)'}
                    </div>
                </div>
            )}

            {dateRange === 'custom' && (
                <div className="mb-6 p-4 bg-blue-900/20 rounded-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-blue-200 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={startDate || ''}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-blue-900/20 border border-blue-800/30 rounded-xl px-4 py-2 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-blue-200 mb-1">End Date</label>
                            <input
                                type="date"
                                value={endDate || ''}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full bg-blue-900/20 border border-blue-800/30 rounded-xl px-4 py-2 text-white"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleCustomRangeSubmit}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        Apply Range
                    </button>
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="p-4 bg-blue-900/20 rounded-xl">
                            <h3 className="text-sm font-medium text-blue-300 mb-2">
                                {showTotalMetrics ? 'Total Calories' : 'Avg. Daily Calories'}
                            </h3>
                            <div className="flex items-center gap-4">
                                <div className="relative w-16 h-16">
                                    <svg className="w-16 h-16 transform -rotate-90">
                                        <circle
                                            cx="32"
                                            cy="32"
                                            r="28"
                                            stroke="currentColor"
                                            strokeWidth="6"
                                            fill="transparent"
                                            className="text-blue-900/30"
                                        />
                                        <circle
                                            cx="32"
                                            cy="32"
                                            r="28"
                                            stroke="currentColor"
                                            strokeWidth="6"
                                            fill="transparent"
                                            strokeDasharray={2 * Math.PI * 28}
                                            strokeDashoffset={2 * Math.PI * 28 * (1 - Math.min(weeklyStats.caloriePercent / 100, 1))}
                                            className="text-blue-500"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-sm font-bold text-blue-100">
                                            {Math.round(weeklyStats.caloriePercent)}%
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-white">
                                        {showTotalMetrics
                                            ? Math.round(weeklyStats.totalCalories)
                                            : Math.round(weeklyStats.calories)
                                        }
                                    </p>
                                    <p className="text-sm text-blue-300">
                                        {showTotalMetrics ? 'calories total' : 'cal/day'}
                                    </p>
                                    <p className="text-xs text-blue-400 mt-1">
                                        {showTotalMetrics
                                            ? `Target: ${Math.round(weeklyStats.totalCalorieGoal)} for ${weeklyStats.daysCount} days`
                                            : `Total: ${Math.round(weeklyStats.totalCalories)} cal`
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-900/20 rounded-xl">
                            <h3 className="text-sm font-medium text-emerald-300 mb-2">
                                {showTotalMetrics ? 'Total Protein' : 'Avg. Daily Protein'}
                            </h3>
                            <div className="flex items-center gap-4">
                                <div className="relative w-16 h-16">
                                    <svg className="w-16 h-16 transform -rotate-90">
                                        <circle
                                            cx="32"
                                            cy="32"
                                            r="28"
                                            stroke="currentColor"
                                            strokeWidth="6"
                                            fill="transparent"
                                            className="text-emerald-900/30"
                                        />
                                        <circle
                                            cx="32"
                                            cy="32"
                                            r="28"
                                            stroke="currentColor"
                                            strokeWidth="6"
                                            fill="transparent"
                                            strokeDasharray={2 * Math.PI * 28}
                                            strokeDashoffset={2 * Math.PI * 28 * (1 - Math.min(weeklyStats.proteinPercent / 100, 1))}
                                            className="text-emerald-500"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-sm font-bold text-emerald-100">
                                            {Math.round(weeklyStats.proteinPercent)}%
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-white">
                                        {showTotalMetrics
                                            ? Math.round(weeklyStats.totalProtein)
                                            : Math.round(weeklyStats.protein)
                                        }
                                    </p>
                                    <p className="text-sm text-emerald-300">
                                        {showTotalMetrics ? 'grams total' : 'g/day'}
                                    </p>
                                    <p className="text-xs text-emerald-400 mt-1">
                                        {showTotalMetrics
                                            ? `Target: ${Math.round(weeklyStats.totalProteinGoal)}g for ${weeklyStats.daysCount} days`
                                            : `Total: ${Math.round(weeklyStats.totalProtein)}g`
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Last 7 days header */}
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-blue-200">Last 7 Days Activity</h3>
                        {weekData.length > 7 && (
                            <div className="text-xs text-blue-400">
                                Showing most recent days of your {weekData.length}-day selection
                            </div>
                        )}
                    </div>

                    {/* Daily circles */}
                    <div className="flex justify-between items-end gap-1 md:gap-2">
                        {weekData.slice(-7).map((day, index) => {
                            const date = parseISO(day.date)
                            const dayOfWeek = format(date, 'E')[0] // Get first letter of day name
                            const isCurrentDay = isToday(date)

                            // Calculate progress percentages
                            const caloriePercent = day.calorieGoal > 0 ? (day.caloriesConsumed / day.calorieGoal) * 100 : 0
                            const proteinPercent = day.proteinGoal > 0 ? (day.proteinConsumed / day.proteinGoal) * 100 : 0

                            return (
                                <div
                                    key={day.date}
                                    className={`flex flex-col items-center ${isCurrentDay ? 'relative' : ''}`}
                                    onClick={() => handleDayClick(day, date)}
                                >
                                    {isCurrentDay && (
                                        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 -translate-y-full">
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                        </div>
                                    )}

                                    <div
                                        className={`relative cursor-pointer transition-transform hover:scale-110 mb-1 ${isCurrentDay ? 'scale-110' : ''
                                            }`}
                                    >
                                        {/* Stacked circles for calories and protein */}
                                        <div className="relative w-10 h-10 md:w-12 md:h-12">
                                            {/* Calorie circle (outer) */}
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle
                                                    cx="50%"
                                                    cy="50%"
                                                    r="45%"
                                                    stroke="currentColor"
                                                    strokeWidth="10%"
                                                    fill="transparent"
                                                    className="text-blue-900/30"
                                                />
                                                <circle
                                                    cx="50%"
                                                    cy="50%"
                                                    r="45%"
                                                    stroke="currentColor"
                                                    strokeWidth="10%"
                                                    fill="transparent"
                                                    strokeDasharray={`${2 * Math.PI * 45}%`}
                                                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - Math.min(caloriePercent / 100, 1))}%`}
                                                    className={`${caloriePercent >= 100 ? 'text-blue-400' : 'text-blue-500'
                                                        }`}
                                                    strokeLinecap="round"
                                                />
                                            </svg>

                                            {/* Protein circle (inner) */}
                                            <svg className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 md:w-7 md:h-7 -rotate-90">
                                                <circle
                                                    cx="50%"
                                                    cy="50%"
                                                    r="45%"
                                                    stroke="currentColor"
                                                    strokeWidth="20%"
                                                    fill="transparent"
                                                    className="text-emerald-900/30"
                                                />
                                                <circle
                                                    cx="50%"
                                                    cy="50%"
                                                    r="45%"
                                                    stroke="currentColor"
                                                    strokeWidth="20%"
                                                    fill="transparent"
                                                    strokeDasharray={`${2 * Math.PI * 45}%`}
                                                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - Math.min(proteinPercent / 100, 1))}%`}
                                                    className={`${proteinPercent >= 100 ? 'text-emerald-400' : 'text-emerald-500'
                                                        }`}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center">
                                        <span className={`text-xs font-medium ${isCurrentDay ? 'text-blue-200' : 'text-blue-400'
                                            }`}>
                                            {dayAbbreviations[date.getDay()]}
                                        </span>
                                        <span className="text-[10px] text-blue-500/80">
                                            {format(date, 'd')}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-center mt-4 gap-6 text-xs">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-blue-300">Calories</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                            <span className="text-emerald-300">Protein</span>
                        </div>
                    </div>
                </>
            )}

            {/* Daily detail popup */}
            {showDetails && selectedDate && selectedStats && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#020617] border border-blue-900/20 rounded-xl p-6 max-w-xs w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Calendar size={18} />
                                {format(selectedDate, 'EEEE, MMM d')}
                            </h3>
                            <button
                                onClick={closeDetails}
                                className="p-1 hover:bg-blue-900/50 rounded-full transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-blue-900/20 p-3 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-blue-300">Calories</span>
                                    <span className="text-sm font-medium text-white">
                                        {Math.round(selectedStats.caloriesConsumed)} / {selectedStats.calorieGoal}
                                    </span>
                                </div>
                                <div className="mt-2 h-2 bg-blue-900/40 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full"
                                        style={{ width: `${Math.min((selectedStats.caloriesConsumed / selectedStats.calorieGoal) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="bg-blue-900/20 p-3 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-emerald-300">Protein</span>
                                    <span className="text-sm font-medium text-white">
                                        {Math.round(selectedStats.proteinConsumed)}g / {selectedStats.proteinGoal}g
                                    </span>
                                </div>
                                <div className="mt-2 h-2 bg-emerald-900/40 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full"
                                        style={{ width: `${Math.min((selectedStats.proteinConsumed / selectedStats.proteinGoal) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default WeeklyProgressTracker