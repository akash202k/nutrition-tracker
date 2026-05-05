'use client'

import { useState } from 'react'
import { format } from 'date-fns'

interface Food {
    id: string
    name: string
    caloriesPerUnit: number
    proteinPerUnit: number
}

interface ConsumptionFormProps {
    foods: Food[]
    onConsume: (foodId: string, quantity: number, date?: string) => void
}

export function ConsumptionForm({ foods, onConsume }: ConsumptionFormProps) {
    const [selectedFood, setSelectedFood] = useState('')
    const [quantity, setQuantity] = useState('')
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (selectedFood && quantity) {
            onConsume(selectedFood, parseFloat(quantity), selectedDate)
            setSelectedFood('')
            setQuantity('')
            setSelectedDate(format(new Date(), 'yyyy-MM-dd'))
        }
    }

    const getTodayString = () => format(new Date(), 'yyyy-MM-dd')
    const maxDate = getTodayString()

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Select Food</label>
                    <select
                        value={selectedFood}
                        onChange={(e) => setSelectedFood(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                        required
                    >
                        <option value="">Choose a food item</option>
                        {foods.map((food) => (
                            <option key={food.id} value={food.id}>
                                {food.name} ({food.caloriesPerUnit} cal, {food.proteinPerUnit}g protein)
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Quantity</label>
                    <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        max={maxDate}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                        required
                    />
                </div>
            </div>
            <div className="text-xs text-gray-600">
                You can add food consumption for any past day or today
            </div>
            <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
                Add Consumption
            </button>
        </form>
    )
}