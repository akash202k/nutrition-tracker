'use client'

import { useState, useEffect } from 'react'
import { X, Trash2, Search, Edit, Plus, Save, ArrowLeft } from 'lucide-react'

interface Food {
    id: string
    name: string
    caloriesPerUnit: number
    proteinPerUnit: number
}

interface ManageFoodsProps {
    isOpen: boolean
    onClose: () => void
    onFoodUpdated?: () => void
}

type FoodFormData = {
    id?: string;
    name: string;
    caloriesPerUnit: string;
    proteinPerUnit: string;
}

enum Mode {
    LIST,
    ADD,
    EDIT
}

export function ManageFoods({ isOpen, onClose, onFoodUpdated }: ManageFoodsProps) {
    const [foods, setFoods] = useState<Food[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [mode, setMode] = useState<Mode>(Mode.LIST)
    const [formData, setFormData] = useState<FoodFormData>({
        name: '',
        caloriesPerUnit: '',
        proteinPerUnit: ''
    })
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; foodId: string; foodName: string }>({
        isOpen: false,
        foodId: '',
        foodName: ''
    })
    const [formError, setFormError] = useState('')

    const fetchFoods = async () => {
        try {
            setIsLoading(true)
            const res = await fetch('/api/food')
            if (!res.ok) throw new Error('Failed to fetch foods')
            const data = await res.json()
            setFoods(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error('Error fetching foods:', error)
            setFoods([])
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteFood = async (foodId: string) => {
        try {
            const res = await fetch(`/api/food?id=${foodId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (!res.ok) throw new Error('Failed to delete food')

            await fetchFoods()
            if (onFoodUpdated) onFoodUpdated()
            setDeleteConfirmation({ isOpen: false, foodId: '', foodName: '' })
        } catch (error) {
            console.error('Error deleting food:', error)
        }
    }

    const handleEditFood = (food: Food) => {
        setFormData({
            id: food.id,
            name: food.name,
            caloriesPerUnit: food.caloriesPerUnit.toString(),
            proteinPerUnit: food.proteinPerUnit.toString()
        })
        setMode(Mode.EDIT)
    }

    const handleAddNew = () => {
        setFormData({
            name: '',
            caloriesPerUnit: '',
            proteinPerUnit: ''
        })
        setMode(Mode.ADD)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    const validateForm = (): boolean => {
        if (!formData.name.trim()) {
            setFormError('Food name is required')
            return false
        }

        const calories = parseFloat(formData.caloriesPerUnit)
        if (isNaN(calories) || calories < 0) {
            setFormError('Calories must be a positive number')
            return false
        }

        const protein = parseFloat(formData.proteinPerUnit)
        if (isNaN(protein) || protein < 0) {
            setFormError('Protein must be a positive number')
            return false
        }

        setFormError('')
        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return

        try {
            let res;

            if (mode === Mode.ADD) {
                res = await fetch('/api/food', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: formData.name,
                        caloriesPerUnit: parseFloat(formData.caloriesPerUnit),
                        proteinPerUnit: parseFloat(formData.proteinPerUnit),
                    }),
                })
            } else {
                // Using the updated PUT endpoint without dynamic route
                res = await fetch('/api/food', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        id: formData.id,
                        name: formData.name,
                        caloriesPerUnit: parseFloat(formData.caloriesPerUnit),
                        proteinPerUnit: parseFloat(formData.proteinPerUnit),
                    }),
                })
            }

            if (!res.ok) throw new Error(`Failed to ${mode === Mode.ADD ? 'add' : 'update'} food`)

            await fetchFoods()
            if (onFoodUpdated) onFoodUpdated()
            setMode(Mode.LIST)
        } catch (error) {
            console.error(`Error ${mode === Mode.ADD ? 'adding' : 'updating'} food:`, error)
            setFormError(`Failed to ${mode === Mode.ADD ? 'add' : 'update'} food. Please try again.`)
        }
    }

    const resetForm = () => {
        setFormData({
            name: '',
            caloriesPerUnit: '',
            proteinPerUnit: ''
        })
        setFormError('')
        setMode(Mode.LIST)
    }

    useEffect(() => {
        if (isOpen) {
            fetchFoods()
            setMode(Mode.LIST)
        }
    }, [isOpen])

    if (!isOpen) return null

    const filteredFoods = foods.filter(food =>
        food.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#020617] border border-blue-900/20 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-blue-900/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {mode !== Mode.LIST && (
                            <button
                                onClick={resetForm}
                                className="p-1 hover:bg-blue-900/30 rounded-lg transition-colors"
                                aria-label="Back to list"
                            >
                                <ArrowLeft className="w-5 h-5 text-blue-300" />
                            </button>
                        )}
                        <h2 className="text-xl font-semibold text-white">
                            {mode === Mode.LIST && "Manage Foods"}
                            {mode === Mode.ADD && "Add New Food"}
                            {mode === Mode.EDIT && "Edit Food"}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-blue-900/30 rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-blue-300" />
                    </button>
                </div>

                {/* Food List Mode */}
                {mode === Mode.LIST && (
                    <>
                        {/* Search and Add Button */}
                        <div className="p-4 border-b border-blue-900/20 flex gap-4">
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search size={18} className="text-blue-400" />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 bg-blue-900/20 border border-blue-800/30 rounded-xl px-4 py-2.5 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Search foods..."
                                />
                            </div>
                            <button
                                onClick={handleAddNew}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 transition-colors"
                            >
                                <Plus size={18} />
                                <span>Add New</span>
                            </button>
                        </div>

                        {/* Food List */}
                        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-blue-800/50">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-32">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                </div>
                            ) : filteredFoods.length > 0 ? (
                                <div className="divide-y divide-blue-900/10">
                                    {filteredFoods.map(food => (
                                        <div key={food.id} className="p-4 hover:bg-blue-900/10 rounded-lg flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-medium text-white">{food.name}</h3>
                                                <div className="text-sm text-blue-300 mt-1 space-x-2">
                                                    <span>{food.caloriesPerUnit} calories</span>
                                                    <span>•</span>
                                                    <span>{food.proteinPerUnit}g protein</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEditFood(food)}
                                                    className="p-2 hover:bg-blue-500/10 rounded-lg transition-colors text-blue-400 hover:text-blue-300"
                                                    aria-label={`Edit ${food.name}`}
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirmation({
                                                        isOpen: true,
                                                        foodId: food.id,
                                                        foodName: food.name
                                                    })}
                                                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-400 hover:text-red-300"
                                                    aria-label={`Delete ${food.name}`}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center p-8 text-blue-300">
                                    {searchQuery ? 'No foods match your search' : 'No foods added yet'}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Add/Edit Form Mode */}
                {(mode === Mode.ADD || mode === Mode.EDIT) && (
                    <div className="flex-1 overflow-y-auto p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {formError && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm">
                                    {formError}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-blue-200">Food Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full bg-blue-900/20 border border-blue-800/30 rounded-xl px-4 py-2.5 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter food name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-blue-200">Calories per Unit</label>
                                    <input
                                        type="number"
                                        name="caloriesPerUnit"
                                        value={formData.caloriesPerUnit}
                                        onChange={handleInputChange}
                                        min="0"
                                        step="0.1"
                                        className="w-full bg-blue-900/20 border border-blue-800/30 rounded-xl px-4 py-2.5 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter calories per unit"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-blue-200">Protein per Unit (g)</label>
                                    <input
                                        type="number"
                                        name="proteinPerUnit"
                                        value={formData.proteinPerUnit}
                                        onChange={handleInputChange}
                                        min="0"
                                        step="0.1"
                                        className="w-full bg-blue-900/20 border border-blue-800/30 rounded-xl px-4 py-2.5 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter protein per unit in grams"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    {mode === Mode.ADD ? 'Add Food' : 'Save Changes'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 px-6 py-2.5 bg-blue-900/50 hover:bg-blue-900/70 text-white font-medium rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirmation.isOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60]">
                    <div className="bg-[#020617] border border-blue-900/20 rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-semibold text-white mb-4">Confirm Deletion</h3>
                        <p className="text-blue-200 mb-6">
                            Are you sure you want to delete "{deleteConfirmation.foodName}"? This will also remove all consumption records associated with this food.
                        </p>
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setDeleteConfirmation({ isOpen: false, foodId: '', foodName: '' })}
                                className="px-4 py-2 text-sm text-blue-300 hover:text-white bg-blue-900/30 hover:bg-blue-800/50 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteFood(deleteConfirmation.foodId)}
                                className="px-4 py-2 text-sm text-red-300 hover:text-white bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}