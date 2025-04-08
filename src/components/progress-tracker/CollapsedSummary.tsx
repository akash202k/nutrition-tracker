'use client'

import { StatsData } from './types'

interface CollapsedSummaryProps {
    stats: StatsData
}

const CollapsedSummary: React.FC<CollapsedSummaryProps> = ({ stats }) => {
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
                                strokeDashoffset={2 * Math.PI * 20 * (1 - Math.min(stats.caloriePercent / 100, 1))}
                                className="text-blue-500"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-100">
                                {Math.round(stats.caloriePercent)}%
                            </span>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-blue-300">Calories</p>
                        <p className="text-white">
                            {Math.round(stats.totalCalories)} / {Math.round(stats.totalCalorieGoal)}
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
                                strokeDashoffset={2 * Math.PI * 20 * (1 - Math.min(stats.proteinPercent / 100, 1))}
                                className="text-emerald-500"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-emerald-100">
                                {Math.round(stats.proteinPercent)}%
                            </span>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-emerald-300">Protein</p>
                        <p className="text-white">
                            {Math.round(stats.totalProtein)}g / {Math.round(stats.totalProteinGoal)}g
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CollapsedSummary