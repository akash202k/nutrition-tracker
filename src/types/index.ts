export interface Food {
  id: string
  name: string
  caloriesPerUnit: number
  proteinPerUnit: number
}

export interface MealPlanItemBase {
  id: string
  foodId: string
  quantity: number
  sortOrder: number
  food: Food
}

export interface WeeklyMealPlanItem extends MealPlanItemBase {}

export interface WeeklyMealPlanTemplate {
  id: string
  dayOfWeek: number
  items: WeeklyMealPlanItem[]
}

export interface DailyMealPlanItem extends MealPlanItemBase {
  completed: boolean
  consumptionId: string | null
}

export interface DailyMealPlan {
  id: string
  date: string
  sourceDayOfWeek: number | null
  items: DailyMealPlanItem[]
  fromTemplate: boolean
  hasTemplate: boolean
}

export interface NutritionTotals {
  calories: number
  protein: number
}

export interface DailyNutritionStats {
  consumedCalories: number
  consumedProtein: number
  plannedCalories: number
  plannedProtein: number
  remainingCalories: number
  remainingProtein: number
  calorieGoal: number
  proteinGoal: number
}

/** Monday = 0 ... Sunday = 6 */
export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
export const WEEKDAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const
export const WEEKDAY_SLUGS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
