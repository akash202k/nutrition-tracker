// types.ts
export interface DayData {
    date: string;
    caloriesConsumed: number;
    proteinConsumed: number;
    calorieGoal: number;
    proteinGoal: number;
}

export interface StatsData {
    calories: number;
    protein: number;
    caloriePercent: number;
    proteinPercent: number;
    totalCalories: number;
    totalProtein: number;
    avgCalorieGoal: number;
    avgProteinGoal: number;
    totalCalorieGoal: number;
    totalProteinGoal: number;
    daysCount: number;
}

export type DateRangeType = 'currentWeek' | 'week' | 'month' | 'custom';