'use client'

import { StatsData } from './types'

interface CollapsedSummaryProps {
    stats: StatsData
    showTotalMetrics: boolean
}

const CollapsedSummary: React.FC<CollapsedSummaryProps> = ({ stats, showTotalMetrics }) => {
    // Calculate values to display based on toggle state
    const calorieValue = showTotalMetrics
        ? Math.round(stats.totalCalories)
        : Math.round(stats.calories);

    const proteinValue = showTotalMetrics
        ? Math.round(stats.totalProtein)
        : Math.round(stats.protein);

    const calorieGoal = showTotalMetrics
        ? Math.round(stats.totalCalorieGoal)
        : Math.round(stats.avgCalorieGoal);

    const proteinGoal = showTotalMetrics
        ? Math.round(stats.totalProteinGoal)
        : Math.round(stats.avgProteinGoal);

    // Percentages are always calculated the same way
    const caloriePercent = stats.caloriePercent;
    const proteinPercent = stats.proteinPercent;

    return (
        <div className="bg-blue-900/20 p-4 rounded-xl mt-2">
            <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12">
                        <svg className="w-12 h-12 transform -rotate-90">
                            <circle
                                cx="24"
                                cy="24"
                                r="20"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="transparent"
                                className="text-blue-900/30"
                            />
                            <circle
                                cx="24"
                                cy="24"
                                r="20"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 20}
                                strokeDashoffset={2 * Math.PI * 20 * (1 - Math.min(caloriePercent / 100, 1))}
                                className="text-blue-500"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-100">
                                {Math.round(caloriePercent)}%
                            </span>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-blue-300">Calories</p>
                        <p className="text-white">
                            {calorieValue} / {calorieGoal} {!showTotalMetrics && <span className="text-xs text-blue-400">per day</span>}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12">
                        <svg className="w-12 h-12 transform -rotate-90">
                            <circle
                                cx="24"
                                cy="24"
                                r="20"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="transparent"
                                className="text-emerald-900/30"
                            />
                            <circle
                                cx="24"
                                cy="24"
                                r="20"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 20}
                                strokeDashoffset={2 * Math.PI * 20 * (1 - Math.min(proteinPercent / 100, 1))}
                                className="text-emerald-500"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-emerald-100">
                                {Math.round(proteinPercent)}%
                            </span>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-emerald-300">Protein</p>
                        <p className="text-white">
                            {proteinValue}g / {proteinGoal}g {!showTotalMetrics && <span className="text-xs text-emerald-400">per day</span>}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CollapsedSummary