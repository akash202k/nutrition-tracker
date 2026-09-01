/** Convert JS getDay() (Sun=0) to Monday-based dayOfWeek (Mon=0 ... Sun=6) */
export function toMondayBasedDayOfWeek(jsDay: number): number {
  return (jsDay + 6) % 7
}

/** Format a Date as local YYYY-MM-DD (avoids UTC shift from toISOString). */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Parse YYYY-MM-DD into local start/end of day (not UTC midnight). */
export function getDayBounds(dateParam: string): { startOfDay: Date; endOfDay: Date } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateParam)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const startOfDay = new Date(year, month, day, 0, 0, 0, 0)
  if (
    startOfDay.getFullYear() !== year ||
    startOfDay.getMonth() !== month ||
    startOfDay.getDate() !== day
  ) {
    return null
  }

  const endOfDay = new Date(year, month, day, 23, 59, 59, 999)
  return { startOfDay, endOfDay }
}

export function parseDayOfWeek(value: string | null): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  if (!Number.isInteger(n) || n < 0 || n > 6) return null
  return n
}

export const foodSelect = {
  id: true,
  name: true,
  caloriesPerUnit: true,
  proteinPerUnit: true,
} as const
