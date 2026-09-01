'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import Link from 'next/link'
import { ManageFoods } from '@/components/ManageFoods'
import { Plus, Book, CalendarDays } from 'lucide-react'
import { SetDailyGoalForm } from '@/components/SetDailyGoalForm'
import { ProfileDropdown } from '@/components/ProfileDropdown'
import { isClientAuthDisabled, useAppSession } from '@/lib/use-app-session'

interface NavigationBarProps {
    onGoalUpdate?: () => void;
    onFoodUpdate?: () => void;
}

export function NavigationBar({ onGoalUpdate, onFoodUpdate }: NavigationBarProps) {
    const { data: session, status } = useAppSession()
    const authDisabled = isClientAuthDisabled()
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
                        <div className="flex items-center gap-4">
                            <Link href="/" className="text-xl font-bold text-white hover:text-blue-100 transition-colors">
                                Nutrition Tracker
                            </Link>
                            {authDisabled && (
                                <span className="text-xs px-2 py-1 rounded-md bg-amber-500/15 text-amber-200 border border-amber-500/30">
                                    Auth disabled
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4">
                            {status === 'loading' ? (
                                <div className="text-blue-200 text-sm">Loading...</div>
                            ) : session ? (
                                <>
                                    <Link
                                        href="/templates"
                                        className="px-3 py-2 text-blue-100 hover:text-white bg-blue-900/30 hover:bg-blue-800/50 rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <CalendarDays size={20} />
                                        <span className="hidden md:inline">Meal templates</span>
                                    </Link>
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
