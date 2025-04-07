'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import NutritionTracker from '@/components/NutritionTracker'
import { Clock, Utensils, X, RefreshCcw } from 'lucide-react'

interface Consumption {
  id: string
  foodId: string
  quantity: number
  date: string
  food: {
    name: string
    caloriesPerUnit: number
    proteinPerUnit: number
  }
}

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  itemName: string
}

function DeleteConfirmationModal({ isOpen, onClose, onConfirm, itemName }: DeleteConfirmationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#020617] border border-blue-900/20 rounded-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-semibold text-white mb-4">Confirm Deletion</h3>
        <p className="text-blue-200 mb-6">
          Are you sure you want to delete {itemName}? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-blue-300 hover:text-white bg-blue-900/30 hover:bg-blue-800/50 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className="px-4 py-2 text-sm text-red-300 hover:text-white bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const { data: session } = useSession()
  const [consumptions, setConsumptions] = useState<Consumption[]>([])
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedConsumption, setSelectedConsumption] = useState<Consumption | null>(null)
  const [refreshCounter, setRefreshCounter] = useState(0)
  const [foodRefreshCounter, setFoodRefreshCounter] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/consumption?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!res.ok) throw new Error('Failed to delete consumption')
      await fetchConsumptions()
      setRefreshCounter(prev => prev + 1)
    } catch (error) {
      console.error('Error deleting consumption:', error)
    }
  }

  const fetchConsumptions = async () => {
    try {
      setIsRefreshing(true)
      const res = await fetch('/api/consumption', {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!res.ok) throw new Error('Failed to fetch consumptions')
      const data = await res.json()
      const sortedData = data.sort((a: Consumption, b: Consumption) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      setConsumptions(sortedData)
    } catch (error) {
      console.error('Error fetching consumptions:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchConsumptions()
      // Set up periodic refresh
      const refreshInterval = setInterval(() => {
        fetchConsumptions()
      }, 30000) // Refresh every 30 seconds

      return () => clearInterval(refreshInterval)
    }
  }, [session])

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const handleFoodUpdate = () => {
    setFoodRefreshCounter(prev => prev + 1)
  }

  if (!session) {
    return (
      <main className="min-h-[calc(100vh-64px)] pt-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6 drop-shadow-lg">
            Welcome to Nutrition Tracker
          </h2>
          <p className="text-xl text-blue-100/90 mb-8 leading-relaxed max-w-2xl mx-auto">
            Track your nutrition journey with our intuitive platform.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-64px)] pt-8 px-4 overscroll-none">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 drop-shadow-md">
          Welcome back, {session.user?.name}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Nutrition Tracker */}
          <div>
            <NutritionTracker
              onConsumptionUpdate={fetchConsumptions}
              refreshTrigger={refreshCounter}
              foodRefreshTrigger={foodRefreshCounter}
            />
          </div>

          {/* Right Column - Consumption History */}
          <div className="bg-blue-950/20 backdrop-blur-md rounded-2xl border border-blue-900/20 flex flex-col lg:h-[calc(100vh-200px)] h-[500px] touch-pan-y">
            <div className="p-6 border-b border-blue-900/20">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-blue-100 flex items-center gap-2">
                  <Clock size={20} />
                  Today's Consumption
                </h2>
                <button
                  onClick={() => {
                    fetchConsumptions()
                    setRefreshCounter(prev => prev + 1)
                  }}
                  disabled={isRefreshing}
                  className="p-2 hover:bg-blue-900/30 rounded-lg transition-colors disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCcw
                    size={18}
                    className={`text-blue-300 hover:text-blue-200 ${isRefreshing ? 'animate-spin' : ''}`}
                  />
                </button>
              </div>
            </div>
            <div
              className="flex-1 overflow-y-auto p-4 min-h-0 scrollbar-thin scrollbar-thumb-blue-800/50 scrollbar-track-transparent hover:scrollbar-thumb-blue-700/50"
              style={{ WebkitOverflowScrolling: 'touch' }}
              onWheel={(e) => {
                const element = e.currentTarget;
                if (element.scrollTop === 0 && e.deltaY < 0 && !isRefreshing) {
                  fetchConsumptions()
                  setRefreshCounter(prev => prev + 1)
                }
              }}
              onTouchStart={(e) => {
                const touch = e.touches[0]
                const element = e.currentTarget
                element.dataset.touchStartY = touch.clientY.toString()
                element.dataset.scrollTop = element.scrollTop.toString()
              }}
              onTouchMove={(e) => {
                const touch = e.touches[0]
                const element = e.currentTarget
                const startY = Number(element.dataset.touchStartY || 0)

                if (element.scrollTop === 0 && touch.clientY > startY && !isRefreshing) {
                  element.classList.add('refreshing')
                }
              }}
              onTouchEnd={(e) => {
                const element = e.currentTarget
                if (element.classList.contains('refreshing')) {
                  fetchConsumptions()
                  setRefreshCounter(prev => prev + 1)
                  element.classList.remove('refreshing')
                }
              }}
            >
              {consumptions.length === 0 ? (
                <div className="text-center py-8 text-blue-300">
                  No consumptions recorded today
                </div>
              ) : (
                consumptions.map((item) => (
                  <div key={item.id} className="group flex items-start gap-4 p-4 hover:bg-blue-900/10 rounded-xl transition-colors">
                    <div className="p-2 bg-blue-900/30 rounded-lg">
                      <Utensils size={20} className="text-blue-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium mb-1 truncate">{item.food.name}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        <span className="text-blue-300">Quantity: {item.quantity}</span>
                        <span className="text-blue-300">
                          {(item.food.caloriesPerUnit * item.quantity).toFixed(1)} cal
                        </span>
                        <span className="text-emerald-300">
                          {(item.food.proteinPerUnit * item.quantity).toFixed(1)}g protein
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-blue-400 whitespace-nowrap">{formatTime(item.date)}</span>
                      <button
                        onClick={() => {
                          setSelectedConsumption(item)
                          setDeleteModalOpen(true)
                        }}
                        className="opacity-100 lg:opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                        title="Delete consumption"
                      >
                        <X size={18} className="text-red-400 hover:text-red-300" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setSelectedConsumption(null)
        }}
        onConfirm={() => {
          if (selectedConsumption) {
            handleDelete(selectedConsumption.id)
          }
        }}
        itemName={selectedConsumption?.food.name || ''}
      />
    </main>
  )
}