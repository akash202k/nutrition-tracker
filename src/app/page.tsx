'use client'

import { useAppSession } from '@/lib/use-app-session'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { addDays, format, startOfWeek } from 'date-fns'
import NutritionTracker from '@/components/NutritionTracker'
import { MealPlanPanel } from '@/components/MealPlanPanel'
import WeeklyProgressTracker from '@/components/progress-tracker/WeeklyProgressTracker'
import { Clock, Utensils, X, RefreshCcw } from 'lucide-react'
import { WEEKDAY_LABELS } from '@/types'
import type { NutritionTotals } from '@/types'

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
  const { data: session } = useAppSession()
  const [consumptions, setConsumptions] = useState<Consumption[]>([])
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedConsumption, setSelectedConsumption] = useState<Consumption | null>(null)
  const [refreshCounter, setRefreshCounter] = useState(0)
  const [foodRefreshCounter, setFoodRefreshCounter] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedViewDate, setSelectedViewDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [plannedTotals, setPlannedTotals] = useState<NutritionTotals>({ calories: 0, protein: 0 })

  const weekDates = useMemo(() => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 })
    return WEEKDAY_LABELS.map((_, i) => format(addDays(monday, i), 'yyyy-MM-dd'))
  }, [])

  const todayStr = format(new Date(), 'yyyy-MM-dd')

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
      setRefreshCounter((prev) => prev + 1)
    } catch (error) {
      console.error('Error deleting consumption:', error)
    }
  }

  const fetchConsumptions = async (date?: string) => {
    try {
      setIsRefreshing(true)
      const dateParam = date || selectedViewDate
      const res = await fetch(`/api/consumption?date=${dateParam}`, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!res.ok) throw new Error('Failed to fetch consumptions')
      const data = await res.json()
      const sortedData = data.sort((a: Consumption, b: Consumption) => {
        const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime()
        if (dateCompare !== 0) return dateCompare
        return b.id.localeCompare(a.id)
      })
      setConsumptions(sortedData)
    } catch (error) {
      console.error('Error fetching consumptions:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchConsumptions(selectedViewDate)
      const refreshInterval = setInterval(() => {
        fetchConsumptions(selectedViewDate)
      }, 30000)

      return () => clearInterval(refreshInterval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, selectedViewDate])

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    })
  }

  const handlePlanOrConsumptionUpdate = () => {
    fetchConsumptions(selectedViewDate)
    setRefreshCounter((prev) => prev + 1)
  }

  const handlePlannedTotalsChange = useCallback((totals: NutritionTotals) => {
    setPlannedTotals(totals)
  }, [])

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
    <main className="min-h-[calc(100vh-64px)] pt-8 px-4 overscroll-none pb-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-white drop-shadow-md">
            Welcome back, {session.user?.name}
          </h1>

          <div className="flex items-center gap-1 md:gap-2" role="tablist" aria-label="Select day of week">
            {WEEKDAY_LABELS.map((day, i) => {
              const dateStr = weekDates[i]
              const isSelected = selectedViewDate === dateStr
              const isToday = dateStr === todayStr
              const isFuture = dateStr > todayStr
              return (
                <button
                  key={day}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  disabled={isFuture}
                  onClick={() => setSelectedViewDate(dateStr)}
                  title={format(new Date(dateStr + 'T12:00:00'), 'EEE, MMM d')}
                  className={`flex flex-col items-center gap-0.5 px-1 disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <span
                    className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-xs font-medium transition-colors
                      ${
                        isSelected
                          ? 'bg-blue-600 text-white border border-blue-400'
                          : isToday
                            ? 'bg-blue-900/50 border border-blue-500/50 text-blue-200'
                            : 'bg-blue-900/20 text-blue-400 hover:bg-blue-800/40 hover:text-blue-200'
                      }`}
                  >
                    {day.charAt(0)}
                  </span>
                  <span className="text-[10px] text-blue-400 hidden sm:block">
                    {format(new Date(dateStr + 'T12:00:00'), 'd')}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="mb-8">
          <WeeklyProgressTracker refreshTrigger={refreshCounter} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <MealPlanPanel
            selectedViewDate={selectedViewDate}
            refreshTrigger={refreshCounter}
            onPlanUpdate={handlePlanOrConsumptionUpdate}
            onPlannedTotalsChange={handlePlannedTotalsChange}
          />

          <div className="space-y-6">
            <NutritionTracker
              onConsumptionUpdate={handlePlanOrConsumptionUpdate}
              refreshTrigger={refreshCounter}
              foodRefreshTrigger={foodRefreshCounter}
              selectedViewDate={selectedViewDate}
              onDateChange={setSelectedViewDate}
              plannedTotals={plannedTotals}
            />

            <div className="bg-blue-950/20 backdrop-blur-md rounded-2xl border border-blue-900/20 flex flex-col max-h-[420px]">
              <div className="p-4 border-b border-blue-900/20">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-blue-100 flex items-center gap-2">
                    <Clock size={18} />
                    Log · {format(new Date(selectedViewDate + 'T12:00:00'), 'EEE, MMM d')}
                  </h2>
                  <button
                    onClick={() => {
                      fetchConsumptions(selectedViewDate)
                      setRefreshCounter((prev) => prev + 1)
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
                className="flex-1 overflow-y-auto p-3 min-h-0 scrollbar-thin scrollbar-thumb-blue-800/50 scrollbar-track-transparent hover:scrollbar-thumb-blue-700/50"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {consumptions.length === 0 ? (
                  <div className="text-center py-8 text-blue-300 text-sm">
                    No consumptions recorded for this day
                  </div>
                ) : (
                  consumptions.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-start gap-3 p-3 hover:bg-blue-900/10 rounded-xl transition-colors"
                    >
                      <div className="p-2 bg-blue-900/30 rounded-lg">
                        <Utensils size={16} className="text-blue-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium mb-0.5 truncate text-sm">{item.food.name}</h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                          <span className="text-blue-300">Qty {item.quantity}</span>
                          <span className="text-blue-300">
                            {(item.food.caloriesPerUnit * item.quantity).toFixed(1)} cal
                          </span>
                          <span className="text-emerald-300">
                            {(item.food.proteinPerUnit * item.quantity).toFixed(1)}g protein
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-blue-400 whitespace-nowrap">{formatTime(item.date)}</span>
                        <button
                          onClick={() => {
                            setSelectedConsumption(item)
                            setDeleteModalOpen(true)
                          }}
                          className="opacity-100 lg:opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                          title="Delete consumption"
                        >
                          <X size={16} className="text-red-400 hover:text-red-300" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
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
