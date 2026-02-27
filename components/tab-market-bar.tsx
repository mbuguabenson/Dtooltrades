"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MarketSelector } from "@/components/market-selector"
import type { DerivSymbol } from "@/hooks/use-deriv"

interface TabMarketBarProps {
    symbol?: string
    availableSymbols?: DerivSymbol[]
    onSymbolChange?: (symbol: string) => void
    currentPrice?: number | null
    currentDigit?: number | null
    tickCount?: number
    theme?: "light" | "dark"
    maxTicks?: number
    onMaxTicksChange?: (ticks: number) => void
}

export function TabMarketBar({
    symbol,
    availableSymbols = [],
    onSymbolChange,
    currentPrice,
    currentDigit,
    tickCount,
    theme = "dark",
    maxTicks,
    onMaxTicksChange
}: TabMarketBarProps) {
    if (!symbol && availableSymbols.length === 0) return null

    const isDark = theme === "dark"

    return (
        <div
            className={`flex flex-wrap items-center gap-2 sm:gap-3 px-3 py-2 rounded-xl border ${isDark
                ? "bg-[#0a0e27]/80 border-white/5 backdrop-blur-md"
                : "bg-white border-gray-200 shadow-sm"
                }`}
        >
            {/* Market Selector */}
            {availableSymbols.length > 0 && onSymbolChange && symbol && (
                <div className="flex items-center gap-2">
                    <span
                        className={`text-[10px] font-black uppercase tracking-widest ${isDark ? "text-gray-500" : "text-gray-400"
                            }`}
                    >
                        Market
                    </span>
                    <MarketSelector
                        symbols={availableSymbols}
                        currentSymbol={symbol}
                        onSymbolChange={onSymbolChange}
                        theme={theme}
                    />
                </div>
            )}

            {/* Divider */}
            {availableSymbols.length > 0 && (currentPrice !== undefined || currentDigit !== undefined) && (
                <div className={`h-6 w-px ${isDark ? "bg-white/10" : "bg-gray-200"}`} />
            )}

            {/* Last Digit */}
            {currentDigit !== undefined && currentDigit !== null && (
                <div className="flex items-center gap-1.5">
                    <span
                        className={`text-[10px] font-black uppercase tracking-widest ${isDark ? "text-gray-500" : "text-gray-400"
                            }`}
                    >
                        Digit
                    </span>
                    <span
                        className={`text-lg sm:text-xl font-black tabular-nums ${isDark
                            ? "bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent"
                            : "text-orange-600"
                            }`}
                    >
                        {currentDigit}
                    </span>
                </div>
            )}

            {/* Price */}
            {currentPrice !== undefined && currentPrice !== null && (
                <div className="flex items-center gap-1.5">
                    <span
                        className={`text-[10px] font-black uppercase tracking-widest ${isDark ? "text-gray-500" : "text-gray-400"
                            }`}
                    >
                        Price
                    </span>
                    <span
                        className={`text-xs sm:text-sm font-mono font-bold tabular-nums ${isDark ? "text-white" : "text-gray-900"
                            }`}
                    >
                        {currentPrice.toFixed(5)}
                    </span>
                </div>
            )}

            {/* Tick Count */}
            {tickCount !== undefined && tickCount > 0 && (
                <div className="flex items-center gap-1.5">
                    <span
                        className={`text-[10px] font-black uppercase tracking-widest ${isDark ? "text-gray-500" : "text-gray-400"
                            }`}
                    >
                        Ticks
                    </span>
                    <span
                        className={`text-xs sm:text-sm font-mono font-bold tabular-nums ${isDark ? "text-emerald-400" : "text-emerald-600"
                            }`}
                    >
                        {tickCount.toLocaleString()}
                    </span>
                </div>
            )}
            {/* Ticks Array (Historical Depth) */}
            {maxTicks !== undefined && onMaxTicksChange !== undefined && (
                <div className="flex items-center gap-1.5 ml-2">
                    <span
                        className={`text-[10px] font-black uppercase tracking-widest ${isDark ? "text-gray-500" : "text-gray-400"
                            }`}
                    >
                        Depth
                    </span>
                    <Select value={maxTicks.toString()} onValueChange={(value) => onMaxTicksChange(parseInt(value))}>
                        <SelectTrigger className={`w-[50px] sm:w-[50px] h-6 sm:h-7 text-[10px] sm:text-xs font-bold ring-0 focus:ring-0 shadow-none border ${isDark ? "bg-[#1a1f3a]/50 text-white border-white/10" : "bg-gray-100 text-gray-900 border-gray-200"}`}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className={isDark ? "bg-[#1a1f3a] border-white/5" : "bg-white"}>
                            {[10, 25, 60, 120, 250, 500, 1000, 5000].map((tv) => (
                                <SelectItem key={tv} value={tv.toString()} className="text-[10px] font-bold">{tv}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>
    )
}
