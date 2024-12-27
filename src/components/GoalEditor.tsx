// GoalEditor.tsx
'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'

interface GoalEditorProps {
    currentGoal: number
    isProtein?: boolean
    onUpdateGoal: (newValue: number) => Promise<void>
}

const GoalEditor: React.FC<GoalEditorProps> = ({ currentGoal, isProtein = false, onUpdateGoal }) => {
    const [isEditing, setIsEditing] = useState(false)
    const [newGoal, setNewGoal] = useState('')

    const handleSave = async () => {
        const value = parseFloat(newGoal)
        if (isNaN(value) || value <= 0) return

        await onUpdateGoal(value)
        setIsEditing(false)
        setNewGoal('')
    }

    const colorClass = isProtein ? 'emerald' : 'blue'

    return (
        <div className="relative">
            <div className="flex items-center gap-2">
                <span className={`text-xs bg-${colorClass}-500/20 text-${colorClass}-200 px-2 py-1 rounded-full`}>
                    Goal: {currentGoal}{isProtein ? 'g' : ''}
                </span>
                <button
                    onClick={() => setIsEditing(true)}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-${colorClass}-800/30 rounded-full`}
                >
                    <Pencil className={`w-4 h-4 text-${colorClass}-300`} />
                </button>
            </div>

            {isEditing && (
                <div className="absolute inset-0 bg-blue-950/95 backdrop-blur-sm rounded-2xl p-4 flex items-center justify-center">
                    <div className="space-y-4">
                        <input
                            type="number"
                            value={newGoal}
                            onChange={(e) => setNewGoal(e.target.value)}
                            className="w-full bg-blue-900/20 border border-blue-800/30 rounded-xl px-4 py-2 text-white"
                            placeholder={`Enter new ${isProtein ? 'protein' : 'calorie'} goal`}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleSave}
                                className={`flex-1 px-4 py-2 bg-${colorClass}-600 hover:bg-${colorClass}-700 rounded-xl text-white`}
                            >
                                Save
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="flex-1 px-4 py-2 bg-blue-900/50 hover:bg-blue-900/70 rounded-xl text-white"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default GoalEditor