// 'use client'

// import { useState, useEffect } from 'react'
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
// import { Dialog } from './Dialog'
// import { AddFoodForm } from './AddFoodForm'
// import { SetDailyGoalForm } from './SetDailyGoalForm'
// import { CircularProgress } from './CircularProgress'
// import { ConsumptionForm } from './ConsumptionForm'

// interface Food {
//     id: string
//     name: string
//     caloriesPerUnit: number
//     proteinPerUnit: number
// }

// interface DailyProgress {
//     caloriesConsumed: number
//     proteinConsumed: number
//     calorieGoal: number
//     proteinGoal: number
// }

// interface Consumption {
//     id: string
//     foodId: string
//     quantity: number
//     food: Food
// }

// export function NutritionDashboard() {
//     const [showAddFood, setShowAddFood] = useState(false)
//     const [showSetGoal, setShowSetGoal] = useState(false)
//     const [foods, setFoods] = useState<Food[]>([])
//     const [progress, setProgress] = useState<DailyProgress>({
//         caloriesConsumed: 0,
//         proteinConsumed: 0,
//         calorieGoal: 1500,
//         proteinGoal: 160,
//     })
//     const [consumptionHistory, setConsumptionHistory] = useState([])

//     const fetchFoods = async () => {
//         try {
//             const res = await fetch('/api/food')
//             if (res.ok) {
//                 const data = await res.json()
//                 setFoods(Array.isArray(data) ? data : [])
//             }
//         } catch (error) {
//             console.error('Error fetching foods:', error)
//             setFoods([])
//         }
//     }

//     const fetchDailyGoal = async () => {
//         try {
//             const res = await fetch('/api/daily-goal')
//             if (res.ok) {
//                 const data = await res.json()
//                 if (data) {
//                     setProgress(prev => ({
//                         ...prev,
//                         calorieGoal: data.calorieGoal,
//                         proteinGoal: data.proteinGoal
//                     }))
//                 }
//             }
//         } catch (error) {
//             console.error('Error fetching daily goal:', error)
//         }
//     }

//     const fetchTodaysConsumptions = async () => {
//         try {
//             const res = await fetch('/api/consumption')
//             if (res.ok) {
//                 const consumptions: Consumption[] = await res.json()

//                 // Calculate totals from today's consumptions
//                 const totals = consumptions.reduce((acc, consumption) => {
//                     const calories = consumption.food.caloriesPerUnit * consumption.quantity
//                     const protein = consumption.food.proteinPerUnit * consumption.quantity
//                     return {
//                         calories: acc.calories + calories,
//                         protein: acc.protein + protein
//                     }
//                 }, { calories: 0, protein: 0 })

//                 setProgress(prev => ({
//                     ...prev,
//                     caloriesConsumed: totals.calories,
//                     proteinConsumed: totals.protein
//                 }))
//             }
//         } catch (error) {
//             console.error('Error fetching today\'s consumptions:', error)
//         }
//     }

//     const fetchConsumptionHistory = async () => {
//         try {
//             const res = await fetch('/api/consumption/history')
//             if (res.ok) {
//                 const data = await res.json()
//                 setConsumptionHistory(data)
//             }
//         } catch (error) {
//             console.error('Error fetching consumption history:', error)
//         }
//     }

//     const handleConsumption = async (foodId: string, quantity: number) => {
//         try {
//             const res = await fetch('/api/consumption', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({ foodId, quantity }),
//             })

//             if (res.ok) {
//                 // After successful consumption, fetch updated data
//                 await Promise.all([
//                     fetchTodaysConsumptions(),
//                     fetchConsumptionHistory()
//                 ])
//             }
//         } catch (error) {
//             console.error('Error recording consumption:', error)
//         }
//     }

//     useEffect(() => {
//         const initializeData = async () => {
//             try {
//                 await Promise.all([
//                     fetchFoods(),
//                     fetchDailyGoal()
//                 ])
//                 await fetchTodaysConsumptions() // Fetch this after we have the goal
//                 await fetchConsumptionHistory()
//             } catch (error) {
//                 console.error('Error initializing data:', error)
//             }
//         }

//         initializeData()
//     }, [])

//     return (
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//             {/* Main consumption tracking panel */}
//             <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
//                 <div className="flex justify-between items-center mb-6">
//                     <h2 className="text-2xl font-semibold text-gray-800">Track Consumption</h2>
//                     <div className="space-x-4">
//                         <button
//                             onClick={() => setShowAddFood(true)}
//                             className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//                         >
//                             Add New Food
//                         </button>
//                         <button
//                             onClick={() => setShowSetGoal(true)}
//                             className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
//                         >
//                             Set Daily Goal
//                         </button>
//                     </div>
//                 </div>

//                 {/* Quick add consumption form */}
//                 <ConsumptionForm foods={foods} onConsume={handleConsumption} />

//                 {/* Today's progress */}
//                 <div className="grid grid-cols-2 gap-6 mt-8">
//                     <CircularProgress
//                         value={(progress.caloriesConsumed / progress.calorieGoal) * 100}
//                         label="Calories"
//                         details={`${progress.caloriesConsumed.toFixed(1)} / ${progress.calorieGoal.toFixed(1)}`}
//                     />
//                     <CircularProgress
//                         value={(progress.proteinConsumed / progress.proteinGoal) * 100}
//                         label="Protein"
//                         details={`${progress.proteinConsumed.toFixed(1)}g / ${progress.proteinGoal.toFixed(1)}g`}
//                     />
//                 </div>
//             </div>

//             {/* Progress chart panel */}
//             <div className="bg-white rounded-xl shadow-sm p-6">
//                 <h2 className="text-2xl font-semibold text-gray-800 mb-6">Weekly Progress</h2>
//                 <div className="h-[400px]">
//                     <ResponsiveContainer width="100%" height="100%">
//                         <LineChart data={consumptionHistory}>
//                             <CartesianGrid strokeDasharray="3 3" />
//                             <XAxis dataKey="date" />
//                             <YAxis />
//                             <Tooltip />
//                             <Line type="monotone" dataKey="calories" stroke="#3B82F6" />
//                             <Line type="monotone" dataKey="protein" stroke="#10B981" />
//                         </LineChart>
//                     </ResponsiveContainer>
//                 </div>
//             </div>

//             {/* Modals */}
//             <Dialog
//                 isOpen={showAddFood}
//                 onClose={() => setShowAddFood(false)}
//                 title="Add New Food"
//             >
//                 <AddFoodForm onSuccess={() => {
//                     setShowAddFood(false)
//                     fetchFoods()
//                 }} />
//             </Dialog>

//             <Dialog
//                 isOpen={showSetGoal}
//                 onClose={() => setShowSetGoal(false)}
//                 title="Set Daily Goal"
//             >
//                 <SetDailyGoalForm onSuccess={() => {
//                     setShowSetGoal(false)
//                     fetchDailyGoal()
//                 }} />
//             </Dialog>
//         </div>
//     )
// }