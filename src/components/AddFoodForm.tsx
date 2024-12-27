'use client'

import { useState } from 'react'

export function AddFoodForm({ onSuccess }: { onSuccess: () => void }) {
    const [name, setName] = useState('')
    const [calories, setCalories] = useState('')
    const [protein, setProtein] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/food', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    caloriesPerUnit: parseFloat(calories),
                    proteinPerUnit: parseFloat(protein),
                }),
            })

            if (res.ok) {
                setName('')
                setCalories('')
                setProtein('')
                onSuccess()
            } else {
                const error = await res.json()
                console.error('Error response:', error)
            }
        } catch (error) {
            console.error('Error adding food:', error)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Food Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Calories per Unit (kcal)</label>
                <input
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Protein per Unit (g)</label>
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
                Add Food Item
            </button>
        </form>
    )
}