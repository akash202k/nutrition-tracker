import type { DailyNutritionStats, Food, NutritionTotals } from '@/types'

export function itemMacros(food: Pick<Food, 'caloriesPerUnit' | 'proteinPerUnit'>, quantity: number): NutritionTotals {
  return {
    calories: food.caloriesPerUnit * quantity,
    protein: food.proteinPerUnit * quantity,
  }
}

export function sumItemMacros(
  items: Array<{ quantity: number; food: Pick<Food, 'caloriesPerUnit' | 'proteinPerUnit'> }>
): NutritionTotals {
  return items.reduce(
    (acc, item) => {
      const macros = itemMacros(item.food, item.quantity)
      return {
        calories: acc.calories + macros.calories,
        protein: acc.protein + macros.protein,
      }
    },
    { calories: 0, protein: 0 }
  )
}

export function computeDailyStats(params: {
  calorieGoal: number
  proteinGoal: number
  consumed: NutritionTotals
  planned: NutritionTotals
}): DailyNutritionStats {
  const { calorieGoal, proteinGoal, consumed, planned } = params
  return {
    consumedCalories: consumed.calories,
    consumedProtein: consumed.protein,
    plannedCalories: planned.calories,
    plannedProtein: planned.protein,
    remainingCalories: calorieGoal - consumed.calories,
    remainingProtein: proteinGoal - consumed.protein,
    calorieGoal,
    proteinGoal,
  }
}
