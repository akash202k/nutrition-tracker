'use client'

import { useState, useEffect } from 'react'
import { format, subDays, startOfWeek, endOfWeek, addDays, isAfter } from 'date-fns'
import TrackerHeader from './TrackerHeader'
import DayCircle from './DayCircle'
import StatsCard from './StatsCard'
import DayDetail from './DayDetail'
import CollapsedSummary from './CollapsedSummary'
import CustomDateRange from './CustomDateRange'
import { DayData, StatsData, DateRangeType } from './types'

interface WeeklyProgressTrackerProps {
    refreshTrigger?: number
}

const WeeklyProgressTracker: React.FC<WeeklyProgressTrackerProps> = ({ refreshTrigger }) => {
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
    const [dateRange, setDateRange] = useState<DateRangeType>('currentWeek')
    const [showDropdown, setShowDropdown] = useState(false)
    const [startDate, setStartDate] = useState<string | null>(null)
    const [endDate, setEndDate] = useState<string | null>(null)
    const [showTotalMetrics, setShowTotalMetrics] = useState(false)
    const [expanded, setExpanded] = useState(false)

    // Date range helper functions
    const getDateRangeText = () => {
        if (dateRange === 'currentWeek') {
            const today = new Date()
            const weekStart = startOfWeek(today, { weekStartsOn: 1 }) // Monday
            const weekEnd = endOfWeek(today, { weekStartsOn: 1 }) // Sunday
            return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`
        } else if (dateRange === 'week') {
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
                }
            } catch (error) {
                console.error('Error fetching goals:', error)
            }

            // Determine fetch parameters based on date range
            let daysToFetch = 7 // Default
            let customStartDate: Date | null = null
            let customEndDate: Date | null = null

            if (dateRange === 'currentWeek') {
                const today = new Date()
                customStartDate = startOfWeek(today, { weekStartsOn: 1 }) // Monday
                customEndDate = endOfWeek(today, { weekStartsOn: 1 }) // Sunday
            } else if (dateRange === 'month') {
                daysToFetch = 30
            } else if (dateRange === 'custom' && startDate && endDate) {
                customStartDate = new Date(startDate)
                customEndDate = new Date(endDate)
            }

            // Fetch history data
            let historyData: any[] = []

            try {
                let historyUrl = '/api/history'

                if (dateRange === 'currentWeek' && customStartDate && customEndDate) {
                    historyUrl = `/api/history?startDate=${format(customStartDate, 'yyyy-MM-dd')}&endDate=${format(customEndDate, 'yyyy-MM-dd')}`
                } else if (dateRange === 'custom' && startDate && endDate) {
                    historyUrl = `/api/history?startDate=${startDate}&endDate=${endDate}`
                } else {
                    historyUrl = `/api/history?days=${daysToFetch}`
                }

                const historyRes = await fetch(historyUrl)
                if (historyRes.ok) {
                    historyData = await historyRes.json()
                } else {
                    // Fall back to mock data
                    const mockRes = await fetch('/api/mock-history')
                    if (mockRes.ok) {
                        historyData = await mockRes.json()
                    }
                }
            } catch (error) {
                console.error('Error fetching history:', error)
                // Fall back to mock data in case of errors
                try {
                    const mockRes = await fetch('/api/mock-history')
                    if (mockRes.ok) {
                        historyData = await mockRes.json()
                    }
                } catch (fallbackError) {
                    console.error('Error fetching mock history:', fallbackError)
                }
            }

            // Create array of days based on the selected date range
            const days: DayData[] = []

            if (dateRange === 'currentWeek') {
                // Create days for the current week (Monday to Sunday)
                const today = new Date()
                const weekStart = startOfWeek(today, { weekStartsOn: 1 }) // Monday

                for (let i = 0; i < 7; i++) {
                    const date = addDays(weekStart, i)
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
            } else if (dateRange === 'custom' && startDate && endDate) {
                // For custom date range
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
                // For week or month - trailing days
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

            // Sort days chronologically for week view
            if (dateRange === 'currentWeek' || dateRange === 'custom') {
                days.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            } else {
                // Reverse for the trailing days view
                days.reverse()
            }

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

    const calculateStats = (): StatsData => {
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

        // For current week mode, only count days up to today
        const today = new Date()
        const relevantData = dateRange === 'currentWeek'
            ? weekData.filter(day => !isAfter(new Date(day.date), today))
            : weekData;

        // Calculate the total consumptions and goals
        const totals = relevantData.reduce((acc, day) => {
            return {
                calories: acc.calories + day.caloriesConsumed,
                protein: acc.protein + day.proteinConsumed,
                calorieGoalTotal: acc.calorieGoalTotal + day.calorieGoal,
                proteinGoalTotal: acc.proteinGoalTotal + day.proteinGoal
            }
        }, { calories: 0, protein: 0, calorieGoalTotal: 0, proteinGoalTotal: 0 })

        const daysCount = relevantData.length || 1; // Avoid division by zero

        // Calculate percentages based on totals or averages
        const caloriePercent = (totals.calories / totals.calorieGoalTotal) * 100;
        const proteinPercent = (totals.protein / totals.proteinGoalTotal) * 100;

        return {
            // Average daily values
            calories: totals.calories / daysCount,
            protein: totals.protein / daysCount,
            // Current percentages (based on accumulated values vs. accumulated goals)
            caloriePercent: caloriePercent,
            proteinPercent: proteinPercent,
            // Total values
            totalCalories: totals.calories,
            totalProtein: totals.protein,
            // Average goal values (should be fairly constant unless goals changed during period)
            avgCalorieGoal: totals.calorieGoalTotal / daysCount,
            avgProteinGoal: totals.proteinGoalTotal / daysCount,
            // Total goal values
            totalCalorieGoal: totals.calorieGoalTotal,
            totalProteinGoal: totals.proteinGoalTotal,
            // Number of days counted
            daysCount: daysCount
        }
    }

    const handleRangeChange = (range: DateRangeType) => {
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

    // Calculate stats
    const stats = calculateStats()

    return (
        <div className="bg-blue-950/20 backdrop-blur-md p-6 rounded-2xl border border-blue-900/20">
            <TrackerHeader
                expanded={expanded}
                setExpanded={setExpanded}
                showTotalMetrics={showTotalMetrics}
                setShowTotalMetrics={setShowTotalMetrics}
                dateRange={dateRange}
                showDropdown={showDropdown}
                setShowDropdown={setShowDropdown}
                handleRangeChange={handleRangeChange}
            />

            {/* Date range summary - always show this even when collapsed */}
            {weekData.length > 0 && (
                <div className="flex justify-center mb-4">
                    <div className="text-sm text-blue-300 bg-blue-900/20 px-3 py-1 rounded-full">
                        {getDateRangeText()} {showTotalMetrics ? '(Total Metrics)' : '(Daily Averages)'}
                    </div>
                </div>
            )}

            {/* Collapsible content */}
            {expanded && (
                <>
                    {dateRange === 'custom' && (
                        <CustomDateRange
                            startDate={startDate}
                            endDate={endDate}
                            setStartDate={setStartDate}
                            setEndDate={setEndDate}
                            onApply={handleCustomRangeSubmit}
                        />
                    )}

                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <StatsCard
                                    stats={stats}
                                    showTotalMetrics={showTotalMetrics}
                                    type="calories"
                                />
                                <StatsCard
                                    stats={stats}
                                    showTotalMetrics={showTotalMetrics}
                                    type="protein"
                                />
                            </div>

                            {/* Weekly view header */}
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-medium text-blue-200">
                                    {dateRange === 'currentWeek' ? 'Current Week' : 'Recent Activity'}
                                </h3>
                                {weekData.length > 7 && dateRange !== 'currentWeek' && (
                                    <div className="text-xs text-blue-400">
                                        Showing most recent days of your {weekData.length}-day selection
                                    </div>
                                )}
                            </div>

                            {/* Daily circles */}
                            <div className="flex justify-between items-end gap-1 md:gap-2">
                                {(dateRange === 'currentWeek' ? weekData : weekData.slice(-7)).map((day, index) => (
                                    <DayCircle
                                        key={day.date}
                                        day={day}
                                        index={index}
                                        dateRange={dateRange}
                                        onDayClick={handleDayClick}
                                    />
                                ))}
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
                                {dateRange === 'currentWeek' && (
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 border border-dashed border-blue-500/40 rounded-full"></div>
                                        <span className="text-blue-300/70">Future days</span>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </>
            )}

            {/* Weekly summary banner when collapsed */}
            {!expanded && !isLoading && weekData.length > 0 && (
                <CollapsedSummary stats={stats} showTotalMetrics={showTotalMetrics} />
            )}

            {/* Day detail popup */}
            {selectedStats && selectedDate && (
                <DayDetail
                    isOpen={showDetails}
                    onClose={closeDetails}
                    selectedDate={selectedDate}
                    stats={selectedStats}
                />
            )}
        </div>
    )
}

export default WeeklyProgressTracker