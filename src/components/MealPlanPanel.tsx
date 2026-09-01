'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { ClipboardList, Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import { FoodSearchPicker } from '@/components/FoodSearchPicker'
import { QuantityInput } from '@/components/QuantityInput'
import { itemMacros, sumItemMacros } from '@/lib/nutrition'
import type { DailyMealPlanItem, Food, NutritionTotals } from '@/types'
import { WEEKDAY_FULL, WEEKDAY_LABELS, WEEKDAY_SLUGS } from '@/types'

interface MealPlanPanelProps {
  selectedViewDate: string
  refreshTrigger?: number
  onPlanUpdate?: () => void
  onPlannedTotalsChange?: (totals: NutritionTotals) => void
}

interface PlanResponse {
  id: string
  date: string
  dayOfWeek: number
  sourceDayOfWeek: number | null
  items: DailyMealPlanItem[]
  fromTemplate: boolean
  hasTemplate: boolean
}

export function MealPlanPanel({
  selectedViewDate,
  refreshTrigger,
  onPlanUpdate,
  onPlannedTotalsChange,
}: MealPlanPanelProps) {
  const [plan, setPlan] = useState<PlanResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyItemId, setBusyItemId] = useState<string | null>(null)
  const [actionBusy, setActionBusy] = useState<'reset' | 'sync' | 'add' | null>(null)
  const [confirmAction, setConfirmAction] = useState<'reset' | 'sync' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionFlash, setActionFlash] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const addFormRef = useRef<HTMLDivElement>(null)

  const [foods, setFoods] = useState<Food[]>([])
  const [selectedFoodId, setSelectedFoodId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [quantity, setQuantity] = useState('1')

  const openAddForm = () => {
    setShowAddForm(true)
    requestAnimationFrame(() => {
      addFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }

  const applyPlan = useCallback(
    (data: PlanResponse) => {
      setPlan(data)
    },
    []
  )

  const fetchPlan = useCallback(async () => {
    setLoading(true)
    setActionError(null)
    try {
      const res = await fetch(`/api/meal-plan?date=${selectedViewDate}`)
      if (!res.ok) throw new Error('Failed to load day plan')
      const data: PlanResponse = await res.json()
      applyPlan(data)
    } catch (error) {
      console.error(error)
      setPlan(null)
    } finally {
      setLoading(false)
    }
  }, [selectedViewDate, applyPlan])

  useEffect(() => {
    fetchPlan()
  }, [fetchPlan, refreshTrigger])

  useEffect(() => {
    fetch('/api/food')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setFoods(Array.isArray(data) ? data : []))
      .catch(() => setFoods([]))
  }, [])

  const plannedTotals = useMemo(() => sumItemMacros(plan?.items ?? []), [plan?.items])

  // Notify parent outside render / setState updaters
  useEffect(() => {
    onPlannedTotalsChange?.(plannedTotals)
  }, [plannedTotals, onPlannedTotalsChange])

  const dayOfWeek = plan?.dayOfWeek ?? 0
  const daySlug = WEEKDAY_SLUGS[dayOfWeek]
  const dayName = WEEKDAY_FULL[dayOfWeek]
  const dayShort = WEEKDAY_LABELS[dayOfWeek]

  const flash = (message: string) => {
    setActionFlash(message)
    setTimeout(() => setActionFlash(null), 2500)
  }

  const toggleComplete = async (item: DailyMealPlanItem) => {
    setBusyItemId(item.id)
    try {
      const endpoint = item.completed
        ? `/api/meal-plan/item/${item.id}/uncomplete`
        : `/api/meal-plan/item/${item.id}/complete`
      const res = await fetch(endpoint, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to update plan item')
      const updated: DailyMealPlanItem = await res.json()
      setPlan((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          items: prev.items.map((i) =>
            i.id === updated.id
              ? {
                  ...i,
                  completed: updated.completed,
                  consumptionId: updated.consumptionId,
                  quantity: updated.quantity,
                  food: updated.food as Food,
                }
              : i
          ),
        }
      })
      onPlanUpdate?.()
    } catch (error) {
      console.error(error)
    } finally {
      setBusyItemId(null)
    }
  }

  const updateQuantity = async (item: DailyMealPlanItem, qty: number) => {
    // Mirror local display (including 0); only persist when qty > 0
    setPlan((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        items: prev.items.map((i) => (i.id === item.id ? { ...i, quantity: qty } : i)),
      }
    })

    if (isNaN(qty) || qty <= 0) return

    try {
      const res = await fetch('/api/meal-plan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, quantity: qty }),
      })
      if (!res.ok) throw new Error('Failed to update quantity')
      if (item.completed) {
        onPlanUpdate?.()
      }
    } catch (error) {
      console.error(error)
      fetchPlan()
    }
  }

  const removeItem = async (item: DailyMealPlanItem) => {
    setBusyItemId(item.id)
    try {
      const res = await fetch(`/api/meal-plan?itemId=${item.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to remove plan item')
      const data: PlanResponse = await res.json()
      applyPlan(data)
      onPlanUpdate?.()
    } catch (error) {
      console.error(error)
    } finally {
      setBusyItemId(null)
    }
  }

  const handleAdd = async () => {
    const qty = parseFloat(quantity)
    if (!selectedFoodId || isNaN(qty) || qty <= 0) return

    setActionBusy('add')
    setActionError(null)
    try {
      // Merge into existing row if same food already on the plan
      const existing = plan?.items.find((i) => i.foodId === selectedFoodId)
      if (existing) {
        await updateQuantity(existing, existing.quantity + qty)
      } else {
        const res = await fetch('/api/meal-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: selectedViewDate,
            foodId: selectedFoodId,
            quantity: qty,
          }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to add to plan')
        }
        const data: PlanResponse = await res.json()
        applyPlan(data)
      }
      setSelectedFoodId('')
      setSearchQuery('')
      setQuantity('1')
      setShowAddForm(false)
      onPlanUpdate?.()
    } catch (error) {
      console.error(error)
      setActionError(error instanceof Error ? error.message : 'Failed to add')
    } finally {
      setActionBusy(null)
    }
  }

  const handleReset = async () => {
    setActionBusy('reset')
    setActionError(null)
    try {
      const res = await fetch('/api/meal-plan/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedViewDate }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to reset plan')
      applyPlan(data)
      setConfirmAction(null)
      flash('Plan reset from template')
      onPlanUpdate?.()
    } catch (error) {
      console.error(error)
      setActionError(error instanceof Error ? error.message : 'Failed to reset')
    } finally {
      setActionBusy(null)
    }
  }

  const handleSyncTemplate = async () => {
    setActionBusy('sync')
    setActionError(null)
    try {
      const res = await fetch('/api/meal-plan/sync-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedViewDate }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update template')
      setConfirmAction(null)
      flash(`${dayShort} template updated`)
    } catch (error) {
      console.error(error)
      setActionError(error instanceof Error ? error.message : 'Failed to update template')
    } finally {
      setActionBusy(null)
    }
  }

  return (
    <div className="bg-blue-950/20 backdrop-blur-md rounded-2xl border border-blue-900/20 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-blue-900/20 space-y-3">
        <div className="flex items-center gap-2 min-w-0">
          <ClipboardList size={20} className="text-blue-300 shrink-0" />
          <h2 className="text-xl font-semibold text-blue-100 truncate">{dayName} plan</h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setConfirmAction('reset')}
            disabled={!!actionBusy || !plan?.hasTemplate}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-lg bg-blue-900/40 text-blue-100 hover:bg-blue-800/50 transition-colors disabled:opacity-40"
            title="Replace this day’s plan with the weekday template"
          >
            <RotateCcw size={14} />
            Reset
          </button>
          <button
            type="button"
            onClick={() => setConfirmAction('sync')}
            disabled={!!actionBusy || !plan || plan.items.length === 0}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-lg bg-emerald-900/40 text-emerald-100 hover:bg-emerald-800/50 transition-colors disabled:opacity-40"
            title="Save this day’s foods as the weekday template"
          >
            <Save size={14} />
            <span className="hidden sm:inline">Update template</span>
            <span className="sm:hidden">Update</span>
          </button>
          <Link
            href={`/templates?day=${daySlug}`}
            className="text-sm text-blue-300 hover:text-white whitespace-nowrap px-1"
          >
            Edit {dayShort} template
          </Link>
          <button
            type="button"
            onClick={() => {
              if (showAddForm) {
                setShowAddForm(false)
              } else {
                openAddForm()
              }
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-lg transition-colors ${
              showAddForm
                ? 'bg-blue-600 text-white'
                : 'bg-blue-900/40 text-blue-100 hover:bg-blue-800/50'
            }`}
            title="Add a food to this day’s plan"
          >
            <Plus size={14} />
            Add food
          </button>
        </div>

        {plan && (
          <div className="flex items-center justify-between gap-3 text-sm flex-wrap">
            <span className="text-blue-300">Planned total</span>
            <span className="text-white font-medium">
              {plannedTotals.calories.toFixed(1)} cal · {plannedTotals.protein.toFixed(1)}g protein
            </span>
          </div>
        )}

        {showAddForm && (
          <div ref={addFormRef} className="space-y-3 pt-1">
            <FoodSearchPicker
              foods={foods}
              selectedFoodId={selectedFoodId}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onFoodSelect={(food) => {
                setSelectedFoodId(food.id)
                setSearchQuery(food.name)
              }}
              onClear={() => {
                setSelectedFoodId('')
                setSearchQuery('')
              }}
              quantity={quantity}
              onQuantityChange={setQuantity}
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!selectedFoodId || !quantity || parseFloat(quantity) <= 0 || actionBusy === 'add'}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              {actionBusy === 'add' ? 'Adding…' : 'Add to plan'}
            </button>
          </div>
        )}

        {actionFlash && <p className="text-xs text-emerald-300">{actionFlash}</p>}
        {actionError && <p className="text-xs text-red-300">{actionError}</p>}
      </div>

      {confirmAction && (
        <div className="px-4 py-3 bg-blue-950/60 border-b border-blue-900/30 space-y-3">
          <p className="text-sm text-blue-100">
            {confirmAction === 'reset'
              ? `Replace today’s plan with the ${dayName} template. Logged meals stay; you can delete those from the consumption list.`
              : `Overwrite the ${dayName} template with this day’s plan items? Other dates are unchanged.`}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => (confirmAction === 'reset' ? handleReset() : handleSyncTemplate())}
              disabled={!!actionBusy}
              className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {actionBusy ? 'Working…' : 'Confirm'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmAction(null)}
              disabled={!!actionBusy}
              className="px-3 py-1.5 text-sm rounded-lg bg-blue-900/40 text-blue-200 hover:bg-blue-800/50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-6 text-center text-blue-300">Loading plan…</div>
      ) : !plan || plan.items.length === 0 ? (
        <div className="p-6 text-center space-y-3">
          <p className="text-blue-300">
            {plan?.hasTemplate
              ? 'This day’s plan is empty.'
              : `No ${dayName} template yet.`}
          </p>
          {!plan?.hasTemplate && (
            <Link
              href={`/templates?day=${daySlug}`}
              className="inline-flex px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Create {dayName} template
            </Link>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-blue-900/20">
          {plan.items.map((item) => {
            const macros = itemMacros(item.food, item.quantity)
            const busy = busyItemId === item.id
            return (
              <li
                key={item.id}
                className={`px-4 py-3 flex items-center gap-3 ${
                  item.completed ? 'bg-emerald-950/20' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  disabled={busy}
                  onChange={() => toggleComplete(item)}
                  className="h-4 w-4 shrink-0 rounded border-blue-700 bg-blue-900/40 text-emerald-500 focus:ring-emerald-500"
                  title={item.completed ? 'Undo done' : 'Mark done'}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={`font-medium truncate ${
                      item.completed ? 'text-emerald-200 line-through' : 'text-white'
                    }`}
                  >
                    {item.food.name}
                  </p>
                  <p className="text-xs text-blue-300">
                    {macros.calories.toFixed(1)} cal · {macros.protein.toFixed(1)}g protein
                  </p>
                </div>
                <QuantityInput
                  value={item.quantity}
                  disabled={busy}
                  onCommit={(qty) => updateQuantity(item, qty)}
                  title="Quantity for this day"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => removeItem(item)}
                  className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                  title="Remove from plan (keeps logged meals)"
                >
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
