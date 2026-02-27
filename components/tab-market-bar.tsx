"use client"

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
}

export function TabMarketBar({
    symbol,
    availableSymbols = [],
    onSymbolChange,
    currentPrice,
    currentDigit,
    tickCount,
    theme = "dark",
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
        </div>
    )
}
