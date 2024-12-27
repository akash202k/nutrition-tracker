// import type { Metadata } from 'next'
// import { Inter } from 'next/font/google'
// import './globals.css'

// const inter = Inter({ subsets: ['latin'] })

// export const metadata: Metadata = {
//   title: 'Nutrition Tracker',
//   description: 'Track your daily calories and protein intake',
// }

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   return (
//     <html lang="en">
//       <body className={inter.className}>{children}</body>
//     </html>
//   )
// }


import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import { AuthButton } from '@/components/AuthButton'

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
      <body className={inter.className}>
        <AuthProvider>
          {/* Navigation */}
          <nav className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-bold text-gray-800">
                    Nutrition Tracker
                  </h1>
                </div>
                <div className="flex items-center">
                  <AuthButton />
                </div>
              </div>
            </div>
          </nav>

          {/* Main content */}
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
