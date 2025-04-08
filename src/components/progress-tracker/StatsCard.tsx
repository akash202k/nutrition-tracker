'use client'

import { StatsData } from './types'

interface StatsCardProps {
    stats: StatsData
    showTotalMetrics: boolean
    type: 'calories' | 'protein'
}

const StatsCard: React.FC<StatsCardProps> = ({ stats, showTotalMetrics, type }) => {
    const isCalories = type === 'calories'
    const color = isCalories ? 'blue' : 'emerald'

    const percent = isCalories ? stats.caloriePercent : stats.proteinPercent
    const total = isCalories ? stats.totalCalories : stats.totalProtein
    const average = isCalories ? stats.calories : stats.protein
    const totalGoal = isCalories ? stats.totalCalorieGoal : stats.totalProteinGoal

    const displayValue = showTotalMetrics ? Math.round(total) : Math.round(average)
    const unit = isCalories ? '' : 'g'
    const unitText = isCalories ? 'calories' : 'grams'

    return (
        <div className={`p-4 bg-blue-900/20 rounded-xl`}>
            <h3 className={`text-sm font-medium text-${color}-300 mb-2`}>
                {showTotalMetrics ? `Total ${isCalories ? 'Calories' : 'Protein'}` : `Avg. Daily ${isCalories ? 'Calories' : 'Protein'}`}
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
                            className={`text-${color}-900/30`}
                        />
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 28}
                            strokeDashoffset={2 * Math.PI * 28 * (1 - Math.min(percent / 100, 1))}
                            className={`text-${color}-500`}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-sm font-bold text-${color}-100`}>
                            {Math.round(percent)}%
                        </span>
                    </div>
                </div>
                <div>
                    <p className="text-xl font-bold text-white">
                        {displayValue}{unit}
                    </p>
                    <p className={`text-sm text-${color}-300`}>
                        {showTotalMetrics ? `${unitText} total` : `${isCalories ? 'cal' : 'g'}/day`}
                    </p>
                    <p className={`text-xs text-${color}-400 mt-1`}>
                        {showTotalMetrics
                            ? `Target: ${Math.round(totalGoal)}${unit} for ${stats.daysCount} days`
                            : `Total: ${Math.round(total)}${unit}`
                        }
                    </p>
                </div>
            </div>
        </div>
    )
}

export default StatsCard