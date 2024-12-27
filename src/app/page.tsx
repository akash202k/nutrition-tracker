
// 'use client'

// import { AddFoodForm } from '@/components/AddFoodForm'
// import NutritionTracker from '@/components/NutritionTracker'

// export default function Home() {
//   return (
//     <div className="min-h-screen bg-gray-100">
//       <div className="max-w-4xl mx-auto py-8 px-4">
//         <h1 className="text-3xl font-bold mb-8">Nutrition Tracker</h1>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//           <div className="bg-white p-6 rounded-lg shadow">
//             <h2 className="text-xl font-semibold mb-4">Add New Food</h2>
//             <AddFoodForm onSuccess={function (): void {
//               console.log('Food added')
//             }} />
//           </div>

//           <div className="bg-white p-6 rounded-lg shadow">
//             <h2 className="text-xl font-semibold mb-4">Track Consumption</h2>
//             <NutritionTracker />
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }


'use client'

import { useSession } from 'next-auth/react'
import { AddFoodForm } from '@/components/AddFoodForm'
import NutritionTracker from '@/components/NutritionTracker'

export default function Home() {
  const { data: session } = useSession()

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Nutrition Tracker
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Please sign in to start tracking your nutrition.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Add New Food</h2>
            <AddFoodForm onSuccess={() => {
              console.log('Food added')
            }} />
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Track Consumption</h2>
            <NutritionTracker />
          </div>
        </div>
      </div>
    </div>
  )
}