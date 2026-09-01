'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAppSession } from '@/lib/use-app-session'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Trash2, Plus, Save, ArrowLeft, RotateCcw } from 'lucide-react'
import { FoodSearchPicker } from '@/components/FoodSearchPicker'
import { QuantityInput } from '@/components/QuantityInput'
import { itemMacros, sumItemMacros } from '@/lib/nutrition'
import type { Food } from '@/types'
import { WEEKDAY_FULL, WEEKDAY_LABELS, WEEKDAY_SLUGS } from '@/types'

interface TemplateItem {
  id?: string
  foodId: string
  quantity: number
  food: Food
}

function slugToDayOfWeek(slug: string | null): number {
  if (!slug) return new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
  const idx = WEEKDAY_SLUGS.indexOf(slug.toLowerCase() as (typeof WEEKDAY_SLUGS)[number])
  return idx >= 0 ? idx : (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1)
}

function itemsSignature(items: TemplateItem[]): string {
  return items.map((i) => `${i.foodId}:${Number(i.quantity).toFixed(2)}`).join('|')
}

export default function TemplatesPageContent() {
  const { data: session, status } = useAppSession()
  const searchParams = useSearchParams()
  const [dayOfWeek, setDayOfWeek] = useState(() => slugToDayOfWeek(searchParams.get('day')))
  const [foods, setFoods] = useState<Food[]>([])
  const [items, setItems] = useState<TemplateItem[]>([])
  const [savedSignature, setSavedSignature] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [selectedFoodId, setSelectedFoodId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [saveError, setSaveError] = useState<string | null>(null)

  const fetchFoods = useCallback(async () => {
    const res = await fetch('/api/food')
    if (!res.ok) return
    const data = await res.json()
    setFoods(Array.isArray(data) ? data : [])
  }, [])

  const applyItems = (next: TemplateItem[], markSaved: boolean) => {
    setItems(next)
    if (markSaved) {
      setSavedSignature(itemsSignature(next))
    }
  }

  const fetchTemplate = useCallback(async (day: number) => {
    setLoading(true)
    setSaveError(null)
    try {
      const res = await fetch(`/api/meal-plan/template?dayOfWeek=${day}`)
      if (!res.ok) throw new Error('Failed to load template')
      const data = await res.json()
      const mapped: TemplateItem[] = (data.items || []).map(
        (item: TemplateItem & { id: string }) => ({
          id: item.id,
          foodId: item.foodId,
          quantity: item.quantity,
          food: item.food,
        })
      )
      applyItems(mapped, true)
    } catch (error) {
      console.error(error)
      applyItems([], true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session) {
      fetchFoods()
    }
  }, [session, fetchFoods])

  useEffect(() => {
    if (session) {
      fetchTemplate(dayOfWeek)
    }
  }, [session, dayOfWeek, fetchTemplate])

  const totals = useMemo(() => sumItemMacros(items), [items])
  const isDirty = itemsSignature(items) !== savedSignature

  const handleDayChange = (day: number) => {
    if (day === dayOfWeek) return
    if (isDirty) {
      const ok = window.confirm('You have unsaved changes. Switch day and discard them?')
      if (!ok) return
    }
    setDayOfWeek(day)
  }

  const handleAdd = () => {
    const food = foods.find((f) => f.id === selectedFoodId)
    const qty = parseFloat(quantity)
    if (!food || isNaN(qty) || qty <= 0) return

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.foodId === food.id)
      if (existingIndex >= 0) {
        return prev.map((item, i) =>
          i === existingIndex ? { ...item, quantity: item.quantity + qty } : item
        )
      }
      return [...prev, { foodId: food.id, quantity: qty, food }]
    })
    setSelectedFoodId('')
    setSearchQuery('')
    setQuantity('1')
  }

  const handleQuantityChange = (index: number, qty: number) => {
    if (isNaN(qty) || qty < 0) return
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, quantity: qty } : item)))
  }

  const handleRemove = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDiscard = () => {
    fetchTemplate(dayOfWeek)
  }

  const handleSave = async () => {
    setSaving(true)
    setSavedFlash(false)
    setSaveError(null)
    try {
      const res = await fetch('/api/meal-plan/template', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayOfWeek,
          items: items
            .filter((item) => item.quantity > 0)
            .map(({ foodId, quantity }) => ({ foodId, quantity })),
        }),
      })
      if (!res.ok) throw new Error('Failed to save template')
      const data = await res.json()
      const mapped: TemplateItem[] = (data.items || []).map(
        (item: TemplateItem & { id: string }) => ({
          id: item.id,
          foodId: item.foodId,
          quantity: item.quantity,
          food: item.food,
        })
      )
      applyItems(mapped, true)
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 2000)
    } catch (error) {
      console.error(error)
      setSaveError(error instanceof Error ? error.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading') {
    return (
      <main className="min-h-[calc(100vh-64px)] pt-16 px-4">
        <p className="text-blue-200 text-center">Loading...</p>
      </main>
    )
  }

  if (!session) {
    return (
      <main className="min-h-[calc(100vh-64px)] pt-16 px-4">
        <p className="text-blue-200 text-center">Sign in to manage meal templates.</p>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-64px)] pt-8 px-4 pb-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-blue-300 hover:text-white mb-2"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>
          <h1 className="text-3xl font-bold text-white">Meal templates</h1>
          <p className="text-blue-300 mt-1">
            Defaults for each weekday. Home copies them once per date — use Reset on home to reload after edits.
          </p>
        </div>

        <div className="bg-blue-950/20 backdrop-blur-md rounded-2xl border border-blue-900/20 overflow-hidden">
          <div className="p-4 border-b border-blue-900/20 space-y-4">
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_LABELS.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleDayChange(i)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    dayOfWeek === i
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-900/30 text-blue-200 hover:bg-blue-800/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-xl font-semibold text-blue-100">
                {WEEKDAY_FULL[dayOfWeek]} template
              </h2>
              <div className="flex items-center gap-2">
                {isDirty && (
                  <button
                    type="button"
                    onClick={handleDiscard}
                    disabled={loading || saving}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl bg-blue-900/40 text-blue-200 hover:bg-blue-800/50 transition-colors disabled:opacity-50"
                  >
                    <RotateCcw size={14} />
                    Discard
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !isDirty}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600/80 hover:bg-emerald-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={16} />
                  {saving ? 'Saving…' : savedFlash ? 'Saved' : isDirty ? 'Save template' : 'Saved'}
                </button>
              </div>
            </div>
            {isDirty && (
              <p className="text-xs text-amber-200/90">Unsaved changes</p>
            )}
            {saveError && <p className="text-xs text-red-300">{saveError}</p>}
          </div>

          <div className="p-4 border-b border-blue-900/20 space-y-3">
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
              disabled={!selectedFoodId || !quantity || parseFloat(quantity) <= 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={18} />
              Add to template
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-blue-300">Loading…</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-blue-300">
              No foods yet. Search and add foods above to build this weekday&apos;s plan.
            </div>
          ) : (
            <ul className="divide-y divide-blue-900/20">
              {items.map((item, index) => {
                const macros = itemMacros(item.food, item.quantity)
                return (
                  <li
                    key={`${item.foodId}-${index}`}
                    className="px-4 py-3 flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{item.food.name}</p>
                      <p className="text-xs text-blue-300">
                        {item.food.caloriesPerUnit} cal/unit · {item.food.proteinPerUnit}g protein/unit
                      </p>
                    </div>
                    <QuantityInput
                      value={item.quantity}
                      onCommit={(qty) => handleQuantityChange(index, qty)}
                      aria-label="Quantity"
                    />
                    <div className="text-xs text-blue-200 w-24 text-right shrink-0">
                      <div>{macros.calories.toFixed(1)} cal</div>
                      <div className="text-emerald-300">{macros.protein.toFixed(1)}g protein</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(index)}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {items.length > 0 && (
            <div className="p-4 border-t border-blue-900/20 flex justify-between text-sm">
              <span className="text-blue-300">Planned total</span>
              <span className="text-white font-medium">
                {totals.calories.toFixed(1)} cal · {totals.protein.toFixed(1)}g protein
              </span>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
