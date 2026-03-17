"use client"

import React from 'react'
import { DerivSmartChart } from '@/components/deriv-smart-chart'
import { TabMarketBar } from '@/components/tab-market-bar'
import type { DerivSymbol } from "@/hooks/use-deriv"

interface ChartsTabProps {
  symbol?: string
  theme?: "light" | "dark"
  availableSymbols?: DerivSymbol[]
  onSymbolChange?: (symbol: string) => void
  currentPrice: number | null
  currentDigit: number | null
  tickCount: number
}

export function ChartsTab({ 
  symbol = "R_100", 
  theme = "dark",
  availableSymbols = [],
  onSymbolChange,
  currentPrice,
  currentDigit,
  tickCount
}: ChartsTabProps) {
  return (
    <div className="space-y-4">
      <TabMarketBar
        symbol={symbol}
        availableSymbols={availableSymbols}
        onSymbolChange={onSymbolChange}
        currentPrice={currentPrice}
        currentDigit={currentDigit}
        tickCount={tickCount}
        theme={theme}
      />
      <div className={`w-full h-[600px] rounded-xl overflow-hidden border ${theme === 'dark' ? 'border-white/10 bg-[#0f1629]/80' : 'border-gray-200 bg-white'}`}>
        <DerivSmartChart symbol={symbol} theme={theme} />
      </div>
    </div>
  )
}
