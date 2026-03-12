"use client"

import { useEffect, useState, useRef } from "react"
import { useDeriv } from "@/hooks/use-deriv"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, Zap, TrendingUp, TrendingDown, Minus, Radio, X, Plus } from "lucide-react"
import type { DerivSymbol } from "@/hooks/use-deriv"

// Predefined popular markets for multi-select
const POPULAR_MARKETS = [
  { symbol: "R_100", label: "Vol 100" },
  { symbol: "R_75", label: "Vol 75" },
  { symbol: "R_50", label: "Vol 50" },
  { symbol: "R_25", label: "Vol 25" },
  { symbol: "R_10", label: "Vol 10" },
  { symbol: "1HZ100V", label: "Vol 100 (1s)" },
  { symbol: "1HZ75V", label: "Vol 75 (1s)" },
  { symbol: "1HZ50V", label: "Vol 50 (1s)" },
  { symbol: "1HZ25V", label: "Vol 25 (1s)" },
  { symbol: "1HZ10V", label: "Vol 10 (1s)" },
]

interface MarketSignalState {
  symbol: string
  label: string
  lastDigit: number | null
  lastPrice: number | null
  signal: "BUY" | "SELL" | "WAIT" | null
  confidence: number
  trend: "bullish" | "bearish" | "neutral"
  history: number[]
}

function SingleMarketSignal({ market, theme }: { market: { symbol: string; label: string }; theme: "light" | "dark" }) {
  const { currentDigit, currentPrice, analysis } = useDeriv(market.symbol)
  const [history, setHistory] = useState<number[]>([])
  const [signal, setSignal] = useState<"BUY" | "SELL" | "WAIT">("WAIT")
  const [confidence, setConfidence] = useState(0)
  const [trend, setTrend] = useState<"bullish" | "bearish" | "neutral">("neutral")

  useEffect(() => {
    if (currentDigit !== null && currentDigit !== undefined) {
      setHistory(prev => {
        const next = [...prev, currentDigit].slice(-20)
        // Simple signal logic: check last 5 digits
        if (next.length >= 5) {
          const last5 = next.slice(-5)
          const highCount = last5.filter(d => d >= 5).length
          const lowCount = last5.filter(d => d < 5).length
          if (highCount >= 4) {
            setSignal("SELL")
            setTrend("bearish")
            setConfidence(70 + highCount * 5)
          } else if (lowCount >= 4) {
            setSignal("BUY")
            setTrend("bullish")
            setConfidence(70 + lowCount * 5)
          } else {
            setSignal("WAIT")
            setTrend("neutral")
            setConfidence(50)
          }
        }
        return next
      })
    }
  }, [currentDigit])

  const isDark = theme === "dark"

  const signalColor = signal === "BUY"
    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
    : signal === "SELL"
      ? "text-rose-400 bg-rose-500/10 border-rose-500/30"
      : isDark ? "text-slate-400 bg-slate-500/10 border-slate-500/30" : "text-slate-500 bg-slate-100 border-slate-200"

  const SignalIcon = signal === "BUY" ? TrendingUp : signal === "SELL" ? TrendingDown : Minus

  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-3 transition-all ${isDark ? "bg-[#0a0e1f]/80 border-white/5" : "bg-white border-gray-100 shadow-sm"
      }`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            {market.symbol}
          </p>
          <p className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{market.label}</p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${signal === "BUY" ? "text-emerald-400 bg-emerald-500/10" :
            signal === "SELL" ? "text-rose-400 bg-rose-500/10" :
              isDark ? "text-slate-400 bg-slate-500/10" : "text-slate-500 bg-slate-100"
          }`}>
          <Radio className="w-2.5 h-2.5 animate-pulse" />
          Live
        </div>
      </div>

      {/* Price + Digit */}
      <div className="flex items-center gap-3">
        <div className={`flex-1 rounded-xl p-2 text-center ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
          <p className={`text-[9px] uppercase font-bold ${isDark ? "text-slate-500" : "text-gray-400"}`}>Price</p>
          <p className={`text-sm font-black tabular-nums ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
            {currentPrice !== null && currentPrice !== undefined ? currentPrice.toFixed(2) : "—"}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black ${isDark ? "bg-blue-500/10 text-blue-300 border border-blue-500/20" : "bg-blue-50 text-blue-700 border border-blue-200"
          }`}>
          {currentDigit !== null && currentDigit !== undefined ? currentDigit : "—"}
        </div>
      </div>

      {/* Signal Badge */}
      <div className={`flex items-center justify-between rounded-xl px-3 py-2 border ${signalColor}`}>
        <div className="flex items-center gap-2">
          <SignalIcon className="w-4 h-4" />
          <span className="text-sm font-black">{signal || "WAIT"}</span>
        </div>
        <span className="text-xs font-bold opacity-70">{confidence}% conf</span>
      </div>

      {/* Last 10 digits mini history */}
      <div className="flex gap-1 flex-wrap">
        {history.slice(-10).map((d, i) => (
          <span key={i} className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black ${d >= 5
              ? isDark ? "bg-rose-500/15 text-rose-400" : "bg-rose-50 text-rose-600"
              : isDark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-600"
            }`}>{d}</span>
        ))}
        {history.length === 0 && (
          <span className={`text-[10px] ${isDark ? "text-slate-500" : "text-gray-400"}`}>Waiting for data...</span>
        )}
      </div>
    </div>
  )
}

interface SuperSignalsTabProps {
  theme?: "light" | "dark"
  symbol?: string
  availableSymbols?: DerivSymbol[]
}

export function SuperSignalsTab({ theme = "dark", symbol = "R_100", availableSymbols = [] }: SuperSignalsTabProps) {
  const [selectedMarkets, setSelectedMarkets] = useState<typeof POPULAR_MARKETS>([
    POPULAR_MARKETS[0],
    POPULAR_MARKETS[1],
    POPULAR_MARKETS[2],
  ])
  const [showPicker, setShowPicker] = useState(false)
  const isDark = theme === "dark"

  const toggleMarket = (market: typeof POPULAR_MARKETS[0]) => {
    setSelectedMarkets(prev => {
      const exists = prev.find(m => m.symbol === market.symbol)
      if (exists) {
        if (prev.length <= 1) return prev // keep at least 1
        return prev.filter(m => m.symbol !== market.symbol)
      }
      if (prev.length >= 6) return prev // max 6
      return [...prev, market]
    })
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className={`flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border ${isDark ? "bg-[#0a0e1f]/80 border-white/5" : "bg-white border-gray-100 shadow-sm"
        }`}>
        <div>
          <h2 className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"
            }`}>
            <Zap className="w-4 h-4 text-yellow-400" />
            Super Signals
          </h2>
          <p className={`text-[10px] mt-0.5 ${isDark ? "text-slate-500" : "text-gray-400"}`}>
            {selectedMarkets.length} market{selectedMarkets.length !== 1 ? "s" : ""} monitored simultaneously
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowPicker(v => !v)}
          className={`rounded-xl text-xs font-bold h-9 px-4 gap-2 ${isDark
              ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30"
              : "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
            }`}
        >
          <Plus className="w-3.5 h-3.5" />
          Manage Markets
        </Button>
      </div>

      {/* Market Picker */}
      {showPicker && (
        <div className={`p-4 rounded-2xl border ${isDark ? "bg-[#0a0e1f]/80 border-white/5" : "bg-white border-gray-100 shadow-sm"
          }`}>
          <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${isDark ? "text-slate-500" : "text-gray-400"
            }`}>Select Markets (max 6)</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_MARKETS.map(m => {
              const active = selectedMarkets.find(s => s.symbol === m.symbol)
              return (
                <button
                  key={m.symbol}
                  onClick={() => toggleMarket(m)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${active
                      ? isDark ? "bg-blue-600/20 border-blue-500/40 text-blue-300" : "bg-blue-100 border-blue-300 text-blue-700"
                      : isDark ? "bg-white/5 border-white/10 text-slate-400 hover:border-blue-500/30" : "bg-gray-50 border-gray-200 text-gray-500 hover:border-blue-300"
                    }`}
                >
                  {active && <Check className="w-3 h-3" />}
                  {m.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Signal Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {selectedMarkets.map(market => (
          <div key={market.symbol} className="relative group">
            <SingleMarketSignal market={market} theme={theme} />
            {/* Remove button */}
            {selectedMarkets.length > 1 && (
              <button
                onClick={() => toggleMarket(market)}
                className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30" : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                  }`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
