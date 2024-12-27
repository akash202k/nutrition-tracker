'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState } from 'react'
import { AddFoodForm } from '@/components/AddFoodForm'
import { Plus } from 'lucide-react'

export function NavigationBar() {
    const { data: session, status } = useSession()
    const [isAddFoodOpen, setIsAddFoodOpen] = useState(false)

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
                                        onClick={() => setIsAddFoodOpen(true)}
                                        className="px-3 py-2 text-blue-100 hover:text-white bg-blue-900/30 hover:bg-blue-800/50 rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <Plus size={20} />
                                        <span className="hidden md:inline">Add Food</span>
                                    </button>
                                    <div className="hidden md:flex items-center gap-2">
                                        {session.user?.image && (
                                            <img
                                                src={session.user.image}
                                                alt="Profile"
                                                className="w-8 h-8 rounded-full border border-blue-800/30"
                                            />
                                        )}
                                        <span className="text-blue-200 text-sm">
                                            {session.user?.name}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => signOut({ callbackUrl: '/' })}
                                        className="px-4 py-2 text-sm text-blue-100 hover:text-white bg-blue-900/30 hover:bg-blue-800/50 rounded-lg transition-colors"
                                    >
                                        Sign Out
                                    </button>
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

            {/* Add Food Modal */}
            {isAddFoodOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[#020617] border border-blue-900/20 rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-white">Add New Food</h2>
                            <button
                                onClick={() => setIsAddFoodOpen(false)}
                                className="text-blue-200 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                        <AddFoodForm
                            onSuccess={() => {
                                setIsAddFoodOpen(false)
                                // You might want to refresh your food list here
                            }}
                        />
                    </div>
                </div>
            )}
        </>
    )
}