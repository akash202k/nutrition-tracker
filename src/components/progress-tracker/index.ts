// components/progress-tracker/index.ts
// Main file to export all tracker components
export { default as WeeklyProgressTracker } from './WeeklyProgressTracker';
export { default as DayCircle } from './DayCircle';
export { default as StatsCard } from './StatsCard';
export { default as TrackerHeader } from './TrackerHeader';
export { default as DayDetail } from './DayDetail';
export { default as CollapsedSummary } from './CollapsedSummary';
export { default as CustomDateRange } from './CustomDateRange';

// types.ts - Shared types used across tracker components
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