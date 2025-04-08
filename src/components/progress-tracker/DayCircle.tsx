'use client'

import { format, isToday, isAfter } from 'date-fns'
import { parseISO } from 'date-fns/parseISO'
import { DayData } from './types'

interface DayCircleProps {
    day: DayData
    index: number
    dateRange: 'currentWeek' | 'week' | 'month' | 'custom'
    onDayClick: (day: DayData, date: Date) => void
}

const DayCircle: React.FC<DayCircleProps> = ({ day, index, dateRange, onDayClick }) => {
    const date = parseISO(day.date)
    const dayAbbreviations = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
    const dayOfWeek = dateRange === 'currentWeek'
        ? dayAbbreviations[index] // Use index for current week (M-S)
        : format(date, 'E')[0] // Get first letter of day name for other views

    const isCurrentDay = isToday(date)
    const isFutureDay = isAfter(date, new Date())

    // Calculate progress percentages
    const caloriePercent = day.calorieGoal > 0 ? (day.caloriesConsumed / day.calorieGoal) * 100 : 0
    const proteinPercent = day.proteinGoal > 0 ? (day.proteinConsumed / day.proteinGoal) * 100 : 0

    const handleClick = () => {
        if (!isFutureDay) {
            onDayClick(day, date)
        }
    }

    return (
        <div
            key={day.date}
            className={`flex flex-col items-center ${isCurrentDay ? 'relative' : ''} ${isFutureDay ? 'opacity-50' : ''}`}
            onClick={handleClick}
            style={!isFutureDay ? { cursor: 'pointer' } : undefined}
        >
            {isCurrentDay && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 -translate-y-full">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                </div>
            )}

            <div
                className={`relative ${!isFutureDay ? 'transition-transform hover:scale-110' : ''} mb-1 ${isCurrentDay ? 'scale-110' : ''}`}
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
                            className={`${isFutureDay ? 'text-blue-800/30' : caloriePercent >= 100 ? 'text-blue-400' : 'text-blue-500'}`}
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
                            className={`${isFutureDay ? 'text-emerald-800/30' : proteinPercent >= 100 ? 'text-emerald-400' : 'text-emerald-500'}`}
                            strokeLinecap="round"
                        />
                    </svg>
                </div>
            </div>

            <div className="flex flex-col items-center">
                <span className={`text-xs font-medium ${isCurrentDay ? 'text-blue-200' : isFutureDay ? 'text-blue-500/40' : 'text-blue-400'}`}>
                    {dayOfWeek}
                </span>
                <span className={`text-[10px] ${isFutureDay ? 'text-blue-500/40' : 'text-blue-500/80'}`}>
                    {format(date, 'd')}
                </span>
            </div>
        </div>
    )
}

export default DayCircle