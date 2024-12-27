'use client'

import { useState } from "react"
import { X } from 'lucide-react'

interface SetDailyGoalFormProps {
    onSuccess?: () => void;
    onClose: () => void;
}

export function SetDailyGoalForm({ onSuccess, onClose }: SetDailyGoalFormProps) {
    const [calories, setCalories] = useState('')
    const [protein, setProtein] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/daily-goal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    calorieGoal: parseFloat(calories),
                    proteinGoal: parseFloat(protein),
                }),
            })

            if (res.ok) {
                if (onSuccess) {
                    onSuccess()
                }
                onClose()
            }
        } catch (error) {
            console.error('Error setting daily goal:', error)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#020617] border border-blue-900/20 rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-white">Set Daily Goals</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-blue-900/50 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-blue-300" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-blue-200">
                                Daily Calorie Goal
                            </label>
                            <input
                                type="number"
                                value={calories}
                                onChange={(e) => setCalories(e.target.value)}
                                className="w-full bg-blue-900/20 border border-blue-800/30 rounded-xl px-4 py-2.5 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter calorie goal"
                                min="0"
                                step="50"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-blue-200">
                                Daily Protein Goal (g)
                            </label>
                            <input
                                type="number"
                                value={protein}
                                onChange={(e) => setProtein(e.target.value)}
                                className="w-full bg-blue-900/20 border border-blue-800/30 rounded-xl px-4 py-2.5 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter protein goal in grams"
                                min="0"
                                step="5"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            className="flex-1 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-blue-950"
                        >
                            Save Goals
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-2.5 bg-blue-900/50 hover:bg-blue-900/70 text-white font-medium rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-blue-950"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}