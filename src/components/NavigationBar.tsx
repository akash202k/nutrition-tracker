'use client'

import { useSession, signIn } from 'next-auth/react'
import { useState } from 'react'
import { ManageFoods } from '@/components/ManageFoods'
import { Plus, Book } from 'lucide-react'
import { SetDailyGoalForm } from '@/components/SetDailyGoalForm'
import { ProfileDropdown } from '@/components/ProfileDropdown'

interface NavigationBarProps {
    onGoalUpdate?: () => void;
    onFoodUpdate?: () => void;
}

export function NavigationBar({ onGoalUpdate, onFoodUpdate }: NavigationBarProps) {
    const { data: session, status } = useSession()
    const [showGoalForm, setShowGoalForm] = useState(false)
    const [showManageFoods, setShowManageFoods] = useState(false)

    const handleFoodUpdated = () => {
        if (onFoodUpdate) {
            onFoodUpdate()
        }
    }

    return (
        <>
            <nav className="bg-[#020617] border-b border-blue-900/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-white">
                                Nutrition Tracker
                            </h1>
                        </div>
                        <div className="flex items-center gap-4">
                            {status === 'loading' ? (
                                <div className="text-blue-200 text-sm">Loading...</div>
                            ) : session ? (
                                <>
                                    <button
                                        onClick={() => setShowGoalForm(true)}
                                        className="px-3 py-2 text-blue-100 hover:text-white bg-blue-900/30 hover:bg-blue-800/50 rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <Plus size={20} />
                                        <span className="hidden md:inline">Set Goal</span>
                                    </button>
                                    <button
                                        onClick={() => setShowManageFoods(true)}
                                        className="px-3 py-2 text-blue-100 hover:text-white bg-blue-900/30 hover:bg-blue-800/50 rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <Book size={20} />
                                        <span className="hidden md:inline">Manage Foods</span>
                                    </button>

                                    {/* Profile Dropdown replacing the separate profile and sign out sections */}
                                    <ProfileDropdown />
                                </>
                            ) : (
                                <button
                                    onClick={() => signIn('google', { callbackUrl: '/' })}
                                    className="px-4 py-2 text-sm text-blue-100 hover:text-white bg-blue-900/30 hover:bg-blue-800/50 rounded-lg transition-colors"
                                >
                                    Sign In with Google
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Daily Goal Form Modal */}
            {showGoalForm && (
                <SetDailyGoalForm
                    onClose={() => setShowGoalForm(false)}
                    onSuccess={() => {
                        if (onGoalUpdate) {
                            onGoalUpdate()
                        }
                    }}
                />
            )}

            {/* Manage Foods Modal */}
            {showManageFoods && (
                <ManageFoods
                    isOpen={showManageFoods}
                    onClose={() => setShowManageFoods(false)}
                    onFoodUpdated={handleFoodUpdated}
                />
            )}
        </>
    )
}