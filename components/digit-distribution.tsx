"use client"

interface DigitDistributionProps {
  frequencies: Record<number, { count: number; percentage: number }>
  currentDigit: number | null
  theme: "light" | "dark"
}

export function DigitDistribution({ frequencies, currentDigit, theme }: DigitDistributionProps) {
  // Split digits into two rows: 0-4 and 5-9
  const row1Digits = [0, 1, 2, 3, 4]
  const row2Digits = [5, 6, 7, 8, 9]

  const renderDigitCircle = (digit: number) => {
    const freq = frequencies[digit] || { count: 0, percentage: 0 }
    const isCurrentDigit = currentDigit === digit

    // SVG Parameters for the circular progress
    const size = 64
    const strokeWidth = 6
    const center = size / 2
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (freq.percentage / 100) * circumference

    return (
      <div key={digit} className="relative flex flex-col items-center gap-2 group">
        <div
          className={`relative flex items-center justify-center transition-all duration-500 ${isCurrentDigit ? "scale-110" : "scale-100"
            }`}
        >
          {/* Circular Progress Ring */}
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background Track */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
              strokeWidth={strokeWidth}
            />
            {/* Progress Stroke */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={isCurrentDigit ? "#f97316" : "#3b82f6"}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{
                filter: isCurrentDigit ? "drop-shadow(0 0 6px rgba(249,115,22,0.6))" : "none",
              }}
            />
          </svg>

          {/* Centered Digit */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={`text-xl font-black transition-all duration-300 ${isCurrentDigit
                  ? theme === "dark"
                    ? "text-orange-400 scale-110"
                    : "text-orange-600 scale-110"
                  : theme === "dark"
                    ? "text-slate-300"
                    : "text-slate-700"
                }`}
            >
              {digit}
            </span>
          </div>

          {/* Live Animation Pulsed Ring */}
          {isCurrentDigit && (
            <div className="absolute inset-0 border-2 border-orange-500 rounded-full animate-ping opacity-20" />
          )}
        </div>

        {/* Probability Labels */}
        <div className="text-center">
          <div
            className={`text-[10px] font-bold tracking-tight transition-colors ${isCurrentDigit
                ? theme === "dark"
                  ? "text-orange-400"
                  : "text-orange-600"
                : theme === "dark"
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
          >
            {freq.percentage.toFixed(1)}%
          </div>
          <div
            className={`text-[8px] font-mono opacity-40 ${isCurrentDigit ? "text-orange-400" : theme === "dark" ? "text-slate-500" : "text-slate-400"
              }`}
          >
            n={freq.count}
          </div>
        </div>

        {/* Floating Indicator */}
        {isCurrentDigit && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none">
            <span className="text-[7px] font-black bg-orange-500 text-black px-1 rounded-sm uppercase tracking-tighter animate-bounce block">
              Now
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-8 py-4">
      {/* 0-4 Row */}
      <div className="grid grid-cols-5 gap-1 sm:gap-2 justify-items-center">{row1Digits.map(renderDigitCircle)}</div>
      {/* 5-9 Row */}
      <div className="grid grid-cols-5 gap-1 sm:gap-2 justify-items-center">{row2Digits.map(renderDigitCircle)}</div>
    </div>
  )
}
