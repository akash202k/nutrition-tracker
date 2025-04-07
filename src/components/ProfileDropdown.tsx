'use client'

import { useState, useRef, useEffect } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { LogOut, User, Trash2, AlertCircle } from 'lucide-react'
import Image from 'next/image'

export function ProfileDropdown() {
    const { data: session } = useSession()
    const [isOpen, setIsOpen] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [error, setError] = useState('')
    const dropdownRef = useRef<HTMLDivElement>(null)

    const toggleDropdown = () => setIsOpen(!isOpen)

    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsOpen(false)
        }
    }

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const handleDeleteAccount = async () => {
        try {
            setIsDeleting(true)
            setError('')

            const res = await fetch('/api/user/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (res.ok) {
                // Sign out and redirect to home page
                await signOut({ callbackUrl: '/' })
            } else {
                const data = await res.json()
                setError(data.error || 'An error occurred while deleting your account')
                setIsDeleting(false)
            }
        } catch (error) {
            console.error('Error deleting account:', error)
            setError('An unexpected error occurred')
            setIsDeleting(false)
        }
    }

    if (!session) return null

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className="p-2 text-blue-100 hover:text-white bg-blue-900/30 hover:bg-blue-800/50 rounded-lg transition-colors"
                aria-label="Profile menu"
            >
                {session.user?.image ? (
                    <Image
                        src={session.user.image}
                        alt="Profile"
                        width={32}
                        height={32}
                        className="rounded-full border border-blue-800/30"
                    />
                ) : (
                    <div className="w-8 h-8 bg-blue-700/50 rounded-full flex items-center justify-center">
                        <User size={18} className="text-blue-100" />
                    </div>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#020617] border border-blue-900/30 rounded-xl shadow-lg overflow-hidden z-50">
                    <div className="py-2">
                        <div className="px-4 py-3 border-b border-blue-900/30">
                            <div className="text-sm font-medium text-white truncate">{session.user?.name}</div>
                            <div className="text-xs text-blue-300 truncate">{session.user?.email}</div>
                        </div>

                        <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="w-full text-left px-4 py-2 text-sm text-blue-200 hover:bg-blue-900/50 hover:text-white flex items-center gap-2 transition-colors"
                        >
                            <LogOut size={16} />
                            <span>Sign Out</span>
                        </button>

                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-red-900/30 hover:text-red-200 flex items-center gap-2 transition-colors"
                        >
                            <Trash2 size={16} />
                            <span>Delete Account</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Account Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60]">
                    <div className="bg-[#020617] border border-blue-900/20 rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-semibold text-white mb-4">Delete Account</h3>
                        <p className="text-blue-200 mb-6">
                            Are you sure you want to delete your account? This action cannot be undone and will permanently delete all of your data, including your foods and consumption records.
                        </p>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                                <AlertCircle size={18} className="text-red-400 mt-0.5" />
                                <p className="text-sm text-red-300">{error}</p>
                            </div>
                        )}

                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => {
                                    setShowDeleteConfirm(false)
                                    setError('')
                                }}
                                className="px-4 py-2 text-sm text-blue-300 hover:text-white bg-blue-900/30 hover:bg-blue-800/50 rounded-lg transition-colors"
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm text-red-300 hover:text-white bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors flex items-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-red-300 border-t-transparent rounded-full animate-spin"></div>
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={16} />
                                        <span>Delete My Account</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}   