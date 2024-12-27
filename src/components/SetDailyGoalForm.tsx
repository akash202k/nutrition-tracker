// src/components/SetDailyGoalForm.tsx
'use client'

import { useState } from "react"

export function SetDailyGoalForm({ onSuccess }: { onSuccess: () => void }) {
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
                onSuccess()
            }
        } catch (error) {
            console.error('Error setting daily goal:', error)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Daily Calorie Goal</label>
                <input
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Daily Protein Goal (g)</label>
                <input
                    type="number"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    required
                />
            </div>
            <button
                type="submit"
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                Save Goals
            </button>
        </form>
    )
}


