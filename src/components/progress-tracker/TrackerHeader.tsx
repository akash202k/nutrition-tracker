'use client'

import { ChevronDown, ChevronUp, PieChart } from 'lucide-react'
import { DateRangeType } from './types'

interface TrackerHeaderProps {
    expanded: boolean
    setExpanded: (expanded: boolean) => void
    showTotalMetrics: boolean
    setShowTotalMetrics: (show: boolean) => void
    dateRange: DateRangeType
    showDropdown: boolean
    setShowDropdown: (show: boolean) => void
    handleRangeChange: (range: DateRangeType) => void
}

const TrackerHeader: React.FC<TrackerHeaderProps> = ({
    expanded,
    setExpanded,
    showTotalMetrics,
    setShowTotalMetrics,
    dateRange,
    showDropdown,
    setShowDropdown,
    handleRangeChange
}) => {
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center justify-center p-1.5 text-blue-300 hover:text-blue-100 bg-blue-900/30 hover:bg-blue-800/40 rounded-lg transition-colors"
                    type="button"
                    aria-label={expanded ? "Collapse tracker" : "Expand tracker"}
                >
                    {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                <h2 className="text-xl font-semibold text-blue-100">Progress Tracker</h2>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setShowTotalMetrics(!showTotalMetrics)}
                    className="p-2 text-blue-200 hover:text-blue-100 bg-blue-900/30 hover:bg-blue-800/40 rounded-lg transition-colors"
                    title={showTotalMetrics ? "Show averages" : "Show totals"}
                    type="button"
                    aria-label={showTotalMetrics ? "Show averages" : "Show totals"}
                >
                    <PieChart size={18} />
                </button>
                <div className="relative">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-200 bg-blue-900/30 hover:bg-blue-800/40 rounded-lg transition-colors"
                        type="button"
                        aria-expanded={showDropdown}
                        aria-haspopup="true"
                    >
                        {dateRange === 'currentWeek' ? 'Current Week' :
                            dateRange === 'week' ? 'Last 7 days' :
                                dateRange === 'month' ? 'Last 30 days' : 'Custom range'}
                        <ChevronDown size={16} />
                    </button>

                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-48 bg-blue-950 border border-blue-800/50 rounded-xl shadow-lg z-10">
                            <div className="py-1">
                                <button
                                    onClick={() => handleRangeChange('currentWeek')}
                                    className="w-full text-left px-4 py-2 text-sm text-blue-200 hover:bg-blue-900/50 hover:text-white"
                                    type="button"
                                >
                                    Current Week
                                </button>
                                <button
                                    onClick={() => handleRangeChange('week')}
                                    className="w-full text-left px-4 py-2 text-sm text-blue-200 hover:bg-blue-900/50 hover:text-white"
                                    type="button"
                                >
                                    Last 7 days
                                </button>
                                <button
                                    onClick={() => handleRangeChange('month')}
                                    className="w-full text-left px-4 py-2 text-sm text-blue-200 hover:bg-blue-900/50 hover:text-white"
                                    type="button"
                                >
                                    Last 30 days
                                </button>
                                <button
                                    onClick={() => handleRangeChange('custom')}
                                    className="w-full text-left px-4 py-2 text-sm text-blue-200 hover:bg-blue-900/50 hover:text-white"
                                    type="button"
                                >
                                    Custom range
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default TrackerHeader