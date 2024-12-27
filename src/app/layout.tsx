import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import { AuthButton } from '@/components/AuthButton'
import { NavigationBar } from '@/components/NavigationBar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Nutrition Tracker',
  description: 'Track your daily calories and protein intake',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-[#020617]`}>
        <AuthProvider>
          {/* Navigation */}
          <NavigationBar />

          {/* Main content */}
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}