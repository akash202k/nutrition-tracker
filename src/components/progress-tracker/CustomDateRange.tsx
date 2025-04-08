'use client'

interface CustomDateRangeProps {
    startDate: string | null
    endDate: string | null
    setStartDate: (date: string) => void
    setEndDate: (date: string) => void
    onApply: () => void
}

const CustomDateRange: React.FC<CustomDateRangeProps> = ({
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    onApply
}) => {
    return (
        <div className="mb-6 p-4 bg-blue-900/20 rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-blue-200 mb-1">
                        Start Date
                    </label>
                    <input
                        id="startDate"
                        type="date"
                        value={startDate || ''}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-blue-900/20 border border-blue-800/30 rounded-xl px-4 py-2 text-white"
                    />
                </div>
                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-blue-200 mb-1">
                        End Date
                    </label>
                    <input
                        id="endDate"
                        type="date"
                        value={endDate || ''}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-blue-900/20 border border-blue-800/30 rounded-xl px-4 py-2 text-white"
                    />
                </div>
            </div>
            <button
                onClick={onApply}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                type="button"
            >
                Apply Range
            </button>
        </div>
    )
}

export default CustomDateRange