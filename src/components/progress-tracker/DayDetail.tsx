'use client'

import { format } from 'date-fns'
import { Calendar } from 'lucide-react'

interface DayDetailProps {
    isOpen: boolean
    onClose: () => void
    selectedDate: Date
    stats: {
        caloriesConsumed: number
        proteinConsumed: number
        calorieGoal: number
        proteinGoal: number
    }
}

const DayDetail: React.FC<DayDetailProps> = ({ isOpen, onClose, selectedDate, stats }) => {
    if (!isOpen) return null

    const caloriePercent = Math.round((stats.caloriesConsumed / stats.calorieGoal) * 100)
    const proteinPercent = Math.round((stats.proteinConsumed / stats.proteinGoal) * 100)

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#020617] border border-blue-900/20 rounded-xl p-6 max-w-xs w-full">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Calendar size={18} />
                        {format(selectedDate, 'EEEE, MMM d')}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-blue-900/50 rounded-full transition-colors"
                        type="button"
                        aria-label="Close details"
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
                                {Math.round(stats.caloriesConsumed)} / {stats.calorieGoal}
                            </span>
                        </div>
                        <div className="mt-2 h-2 bg-blue-900/40 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${Math.min(caloriePercent, 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="bg-blue-900/20 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-emerald-300">Protein</span>
                            <span className="text-sm font-medium text-white">
                                {Math.round(stats.proteinConsumed)}g / {stats.proteinGoal}g
                            </span>
                        </div>
                        <div className="mt-2 h-2 bg-emerald-900/40 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${Math.min(proteinPercent, 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Percentage indicators */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center">
                                <span className="text-2xl font-bold text-blue-300">
                                    {caloriePercent}%
                                </span>
                            </div>
                            <p className="text-xs text-blue-400">of calorie goal</p>
                        </div>
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center">
                                <span className="text-2xl font-bold text-emerald-300">
                                    {proteinPercent}%
                                </span>
                            </div>
                            <p className="text-xs text-emerald-400">of protein goal</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DayDetail