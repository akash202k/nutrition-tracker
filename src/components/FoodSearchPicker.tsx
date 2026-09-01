'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import type { Food } from '@/types'

interface FoodSearchPickerProps {
  foods: Food[]
  selectedFoodId: string
  searchQuery: string
  onSearchChange: (query: string) => void
  onFoodSelect: (food: Food) => void
  onClear: () => void
  quantity: string
  onQuantityChange: (quantity: string) => void
  showQuantity?: boolean
  className?: string
}

export function FoodSearchPicker({
  foods,
  selectedFoodId,
  searchQuery,
  onSearchChange,
  onFoodSelect,
  onClear,
  quantity,
  onQuantityChange,
  showQuantity = true,
  className = '',
}: FoodSearchPickerProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredFoods = searchQuery
    ? foods.filter((food) => food.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : foods

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedFood = foods.find((f) => f.id === selectedFoodId)
  const qtyNum = parseFloat(quantity)
  const previewCalories =
    selectedFood && !isNaN(qtyNum) && qtyNum > 0
      ? selectedFood.caloriesPerUnit * qtyNum
      : null
  const previewProtein =
    selectedFood && !isNaN(qtyNum) && qtyNum > 0
      ? selectedFood.proteinPerUnit * qtyNum
      : null

  return (
    <div className={`grid grid-cols-1 ${showQuantity ? 'md:grid-cols-2' : ''} gap-4 ${className}`}>
      <div className="space-y-2 relative">
        <label className="block text-sm font-medium text-blue-200">Search Food</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-blue-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            ref={searchInputRef}
            className="w-full pl-10 pr-10 bg-blue-900/20 border border-blue-800/30 rounded-xl px-4 py-2.5 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search for a food..."
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                onClear()
                setShowDropdown(false)
                searchInputRef.current?.focus()
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X size={16} className="text-blue-400 hover:text-blue-200" />
            </button>
          )}
        </div>

        {showDropdown && filteredFoods.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-10 mt-1 w-full bg-blue-950 border border-blue-800/50 rounded-xl shadow-lg max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-800/50"
          >
            {filteredFoods.map((food) => (
              <div
                key={food.id}
                onClick={() => {
                  onFoodSelect(food)
                  setShowDropdown(false)
                }}
                className="px-4 py-2 cursor-pointer hover:bg-blue-900/50 transition-colors text-blue-100"
              >
                <div className="font-medium">{food.name}</div>
                <div className="text-xs text-blue-300">
                  {food.caloriesPerUnit} cal, {food.proteinPerUnit}g protein
                </div>
              </div>
            ))}
          </div>
        )}

        {showDropdown && searchQuery && filteredFoods.length === 0 && (
          <div className="absolute z-10 mt-1 w-full bg-blue-950 border border-blue-800/50 rounded-xl shadow-lg p-4 text-center">
            <p className="text-blue-300">No foods found</p>
          </div>
        )}
      </div>

      {showQuantity && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-blue-200">Quantity</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => onQuantityChange(e.target.value)}
            min="0"
            step="0.1"
            className="w-full bg-blue-900/20 border border-blue-800/30 rounded-xl px-4 py-2.5 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter quantity"
          />
          {previewCalories !== null && previewProtein !== null && (
            <p className="text-xs text-blue-300">
              {previewCalories.toFixed(1)} cal · {previewProtein.toFixed(1)}g protein
            </p>
          )}
        </div>
      )}
    </div>
  )
}
