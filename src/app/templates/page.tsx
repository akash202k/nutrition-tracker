'use client'

import { Suspense } from 'react'
import TemplatesPageContent from './TemplatesPageContent'

export default function TemplatesPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[calc(100vh-64px)] pt-16 px-4">
          <p className="text-blue-200 text-center">Loading...</p>
        </main>
      }
    >
      <TemplatesPageContent />
    </Suspense>
  )
}
