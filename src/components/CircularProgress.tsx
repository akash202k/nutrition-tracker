'use client'

export function CircularProgress({
    value,
    label,
    details,
}: {
    value: number
    label: string
    details: string
}) {
    const circumference = 2 * Math.PI * 45 // radius = 45
    const strokeDashoffset = circumference - (value / 100) * circumference

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg className="w-32 h-32 transform -rotate-90">
                <circle
                    className="text-gray-200"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="45"
                    cx="64"
                    cy="64"
                />
                <circle
                    className="text-blue-600 transition-all duration-300 ease-in-out"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="45"
                    cx="64"
                    cy="64"
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-xl font-semibold">{Math.round(value)}%</span>
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-xs text-gray-400">{details}</span>
            </div>
        </div>
    )
}
