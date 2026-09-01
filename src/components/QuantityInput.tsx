'use client'

import { useEffect, useState } from 'react'

interface QuantityInputProps {
  value: number
  onCommit: (quantity: number) => void
  disabled?: boolean
  className?: string
  title?: string
  'aria-label'?: string
}

const DRAFT_PATTERN = /^\d*\.?\d{0,2}$/

function formatFromNumber(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '0'
  // Avoid trailing zeros noise for whole numbers; keep up to 2dp
  const rounded = Math.round(n * 100) / 100
  return String(rounded)
}

function normalizeLeadingZero(prev: string, next: string): string {
  if (prev === '0' && /^0\d+$/.test(next)) {
    return next.slice(1)
  }
  return next
}

export function QuantityInput({
  value,
  onCommit,
  disabled = false,
  className = '',
  title,
  'aria-label': ariaLabel,
}: QuantityInputProps) {
  const [draft, setDraft] = useState(() => formatFromNumber(value))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) {
      setDraft(formatFromNumber(value))
    }
  }, [value, focused])

  const commit = (raw: string) => {
    const trimmed = raw.trim()
    if (trimmed === '' || trimmed === '.') {
      setDraft('0')
      onCommit(0)
      return
    }
    const qty = parseFloat(trimmed)
    if (isNaN(qty) || qty < 0) {
      setDraft('0')
      onCommit(0)
      return
    }
    const normalized = Math.round(qty * 100) / 100
    setDraft(formatFromNumber(normalized))
    onCommit(normalized)
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      disabled={disabled}
      value={draft}
      title={title}
      aria-label={ariaLabel ?? 'Quantity'}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false)
        commit(draft)
      }}
      onChange={(e) => {
        let next = e.target.value.replace(/[^\d.]/g, '')
        // Keep only first decimal point
        const firstDot = next.indexOf('.')
        if (firstDot !== -1) {
          next =
            next.slice(0, firstDot + 1) + next.slice(firstDot + 1).replace(/\./g, '')
        }
        next = normalizeLeadingZero(draft, next)
        if (next !== '' && !DRAFT_PATTERN.test(next)) return
        setDraft(next)
      }}
      className={
        className ||
        'w-16 bg-blue-900/20 border border-blue-800/30 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50'
      }
    />
  )
}
