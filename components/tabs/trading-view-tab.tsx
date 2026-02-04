"use client"

import { useState, useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, AlertTriangle, Activity, Target, Layers } from "lucide-react"
import { derivWebSocket } from "@/lib/deriv-websocket-manager"
import { useDeriv } from "@/hooks/use-deriv"
import { PatternChart } from "@/components/pattern-chart"
import { DigitDistribution } from "@/components/digit-distribution"

interface ReversalPattern {
  type: "Double Top" | "Double Bottom" | "Head & Shoulders" | "Inverse H&S" | "Triple Top" | "Triple Bottom" | "Rising Wedge" | "Falling Wedge"
  direction: "Bullish" | "Bearish"
  confidence: number
  priceLevel: number
  timestamp: number
  description: string
  indices: number[]
}

interface PricePoint {
  price: number
  timestamp: number
  digit: number
}

interface SupportResistance {
  level: number
  type: "support" | "resistance"
  strength: number
}

interface EntryExit {
  price: number
  type: "entry" | "exit"
  direction: "buy" | "sell"
  timestamp: number
}

interface TradingViewTabProps {
  theme?: "light" | "dark"
}

export function TradingViewTab({ theme = "dark" }: TradingViewTabProps) {
  const { symbol, currentPrice, currentDigit, analysis } = useDeriv()
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([])
  const [detectedPatterns, setDetectedPatterns] = useState<ReversalPattern[]>([])
  const [supportResistance, setSupportResistance] = useState<SupportResistance[]>([])
  const [entryExitPoints, setEntryExitPoints] = useState<EntryExit[]>([])
  const [isMonitoring, setIsMonitoring] = useState(true)
  const subscriptionRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isMonitoring) return

    const callback = (tick: any) => {
      const newPoint: PricePoint = {
        price: tick.quote,
        timestamp: tick.epoch,
        digit: tick.lastDigit,
      }

      setPriceHistory((prev) => {
        const updated = [...prev, newPoint].slice(-100)
        detectPatternsAndLevels(updated)
        return updated
      })
    }

    derivWebSocket.subscribeTicks(symbol, callback).then((id) => {
      subscriptionRef.current = id
    })

    return () => {
      if (subscriptionRef.current) {
        derivWebSocket.unsubscribe(subscriptionRef.current, callback)
      }
    }
  }, [symbol, isMonitoring])

  const detectPatternsAndLevels = (prices: PricePoint[]) => {
    if (prices.length < 20) return

    const patterns: ReversalPattern[] = []
    const srLevels: SupportResistance[] = []

    // Helper to find local peaks and troughs
    const findPeaksAndTroughs = (data: PricePoint[]) => {
      const peaks: number[] = []
      const troughs: number[] = []

      for (let i = 2; i < data.length - 2; i++) {
        const isPeak =
          data[i].price > data[i - 1].price &&
          data[i].price > data[i - 2].price &&
          data[i].price > data[i + 1].price &&
          data[i].price > data[i + 2].price

        const isTrough =
          data[i].price < data[i - 1].price &&
          data[i].price < data[i - 2].price &&
          data[i].price < data[i + 1].price &&
          data[i].price < data[i + 2].price

        if (isPeak) peaks.push(i)
        if (isTrough) troughs.push(i)
      }

      return { peaks, troughs }
    }

    const { peaks, troughs } = findPeaksAndTroughs(prices)

    // Calculate support and resistance levels from peaks/troughs
    peaks.forEach((idx) => {
      const level = prices[idx].price
      const nearbyPeaks = peaks.filter((p) => Math.abs(prices[p].price - level) / level < 0.001)
      srLevels.push({
        level,
        type: "resistance",
        strength: Math.min(nearbyPeaks.length * 25, 100),
      })
    })

    troughs.forEach((idx) => {
      const level = prices[idx].price
      const nearbyTroughs = troughs.filter((t) => Math.abs(prices[t].price - level) / level < 0.001)
      srLevels.push({
        level,
        type: "support",
        strength: Math.min(nearbyTroughs.length * 25, 100),
      })
    })

    // Deduplicate support/resistance levels
    const uniqueSR: SupportResistance[] = []
    srLevels.forEach((sr) => {
      const exists = uniqueSR.find((u) => u.type === sr.type && Math.abs(u.level - sr.level) / sr.level < 0.0005)
      if (!exists) {
        uniqueSR.push(sr)
      } else if (sr.strength > exists.strength) {
        exists.strength = sr.strength
      }
    })
    setSupportResistance(uniqueSR.slice(0, 6))

    // Double Top Pattern
    if (peaks.length >= 2) {
      const lastTwoPeaks = peaks.slice(-2)
      const [peak1Idx, peak2Idx] = lastTwoPeaks
      const [peak1, peak2] = lastTwoPeaks.map((i) => prices[i].price)

      if (Math.abs(peak1 - peak2) / peak1 < 0.001) {
        patterns.push({
          type: "Double Top",
          direction: "Bearish",
          confidence: 75,
          priceLevel: peak2,
          timestamp: Date.now(),
          description: "Two similar peaks detected - potential reversal to downside",
          indices: [peak1Idx, peak2Idx],
        })

        // Generate sell entry
        const neckline = Math.min(...prices.slice(peak1Idx, peak2Idx).map((p) => p.price))
        setEntryExitPoints((prev) => {
          const exists = prev.some(p => p.type === 'entry' && p.direction === 'sell' && Math.abs(p.price - neckline) < 0.0001)
          if (exists) return prev
          return [...prev, {
            price: neckline,
            type: "entry",
            direction: "sell",
            timestamp: prices[peak2Idx].timestamp,
          }]
        })
      }
    }

    // Double Bottom Pattern
    if (troughs.length >= 2) {
      const lastTwoTroughs = troughs.slice(-2)
      const [trough1Idx, trough2Idx] = lastTwoTroughs
      const [trough1, trough2] = lastTwoTroughs.map((i) => prices[i].price)

      if (Math.abs(trough1 - trough2) / trough1 < 0.001) {
        patterns.push({
          type: "Double Bottom",
          direction: "Bullish",
          confidence: 75,
          priceLevel: trough2,
          timestamp: Date.now(),
          description: "Two similar bottoms detected - potential reversal to upside",
          indices: [trough1Idx, trough2Idx],
        })

        // Generate buy entry
        const neckline = Math.max(...prices.slice(trough1Idx, trough2Idx).map((p) => p.price))
        setEntryExitPoints((prev) => {
          const exists = prev.some(p => p.type === 'entry' && p.direction === 'buy' && Math.abs(p.price - neckline) < 0.0001)
          if (exists) return prev
          return [...prev, {
            price: neckline,
            type: "entry",
            direction: "buy",
            timestamp: prices[trough2Idx].timestamp,
          }]
        })
      }
    }

    // Head and Shoulders
    if (peaks.length >= 3 && troughs.length >= 2) {
      const lastThreePeaks = peaks.slice(-3)
      const [leftIdx, headIdx, rightIdx] = lastThreePeaks
      const [left, head, right] = lastThreePeaks.map((i) => prices[i].price)

      if (head > left && head > right && Math.abs(left - right) / left < 0.001) {
        patterns.push({
          type: "Head & Shoulders",
          direction: "Bearish",
          confidence: 85,
          priceLevel: head,
          timestamp: Date.now(),
          description: "Classic head and shoulders pattern - strong reversal signal",
          indices: [leftIdx, headIdx, rightIdx],
        })
      }
    }

    // Inverse Head and Shoulders
    if (troughs.length >= 3 && peaks.length >= 2) {
      const lastThreeTroughs = troughs.slice(-3)
      const [leftIdx, headIdx, rightIdx] = lastThreeTroughs
      const [left, head, right] = lastThreeTroughs.map((i) => prices[i].price)

      if (head < left && head < right && Math.abs(left - right) / left < 0.001) {
        patterns.push({
          type: "Inverse H&S",
          direction: "Bullish",
          confidence: 85,
          priceLevel: head,
          timestamp: Date.now(),
          description: "Inverse head and shoulders - strong bullish reversal",
          indices: [leftIdx, headIdx, rightIdx],
        })
      }
    }

    // Update detected patterns
    if (patterns.length > 0) {
      setDetectedPatterns((prev) => {
        const combined = [...patterns, ...prev]
        const unique = combined.filter(
          (pattern, index, self) => index === self.findIndex((p) => p.type === pattern.type && p.direction === pattern.direction)
        )
        return unique.slice(0, 5)
      })
    }
  }

  const clearPatterns = () => {
    setDetectedPatterns([])
    setEntryExitPoints([])
  }

  const calculateTrend = () => {
    if (priceHistory.length < 10) return "Neutral"
    const recent = priceHistory.slice(-10)
    const firstPrice = recent[0].price
    const lastPrice = recent[recent.length - 1].price
    const change = ((lastPrice - firstPrice) / firstPrice) * 100

    if (change > 0.05) return "Bullish"
    if (change < -0.05) return "Bearish"
    return "Neutral"
  }

  const trend = calculateTrend()
  const trendColor = trend === "Bullish" ? "text-green-400" : trend === "Bearish" ? "text-red-400" : "text-gray-400"
  const trendBg = trend === "Bullish" ? "bg-green-500/10" : trend === "Bearish" ? "bg-red-500/10" : "bg-gray-500/10"

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Header and Stats */}
        <div
          className={`lg:col-span-2 rounded-xl p-4 sm:p-6 border ${theme === "dark"
              ? "bg-gradient-to-br from-[#0f1629]/80 to-[#1a2235]/80 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]"
              : "bg-white border-gray-200 shadow-lg"
            }`}
        >
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <h2 className={`text-xl sm:text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              📊 Trading Terminal
            </h2>
            <div className="flex items-center gap-3">
              <Badge className={`${trendBg} ${trendColor} border-0 flex items-center gap-2 px-3 py-1`}>
                {trend === "Bullish" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {trend}
              </Badge>
              <Button
                onClick={() => setIsMonitoring(!isMonitoring)}
                variant={isMonitoring ? "destructive" : "default"}
                size="sm"
                className="h-8 flex items-center gap-2"
              >
                <Activity className={`h-4 w-4 ${isMonitoring ? "animate-pulse" : ""}`} />
                {isMonitoring ? "Live" : "Start"}
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`rounded-lg p-3 border ${theme === "dark" ? "bg-blue-500/10 border-blue-500/30 text-cyan-400" : "bg-blue-50 border-blue-200 text-blue-600"}`}>
              <div className="text-[10px] uppercase font-bold opacity-60 mb-1">Price</div>
              <div className="text-lg font-bold tabular-nums">{currentPrice?.toFixed(5) || "---"}</div>
            </div>
            <div className={`rounded-lg p-3 border ${theme === "dark" ? "bg-orange-500/10 border-orange-500/30 text-orange-400" : "bg-orange-50 border-orange-200 text-orange-600"}`}>
              <div className="text-[10px] uppercase font-bold opacity-60 mb-1">Digit</div>
              <div className="text-lg font-bold">{currentDigit !== null ? currentDigit : "---"}</div>
            </div>
            <div className={`rounded-lg p-3 border ${theme === "dark" ? "bg-purple-500/10 border-purple-500/30 text-purple-400" : "bg-purple-50 border-purple-200 text-purple-600"}`}>
              <div className="text-[10px] uppercase font-bold opacity-60 mb-1">Patterns</div>
              <div className="text-lg font-bold">{detectedPatterns.length}</div>
            </div>
            <div className={`rounded-lg p-3 border ${theme === "dark" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-600"}`}>
              <div className="text-[10px] uppercase font-bold opacity-60 mb-1">S/R Zones</div>
              <div className="text-lg font-bold">{supportResistance.length}</div>
            </div>
          </div>
        </div>

        {/* Digit Distribution Component Integrated */}
        <div
          className={`rounded-xl p-4 sm:p-6 border flex flex-col justify-center ${theme === "dark"
              ? "bg-gradient-to-br from-[#0f1629]/80 to-[#1a2235]/80 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]"
              : "bg-white border-gray-200 shadow-lg"
            }`}
        >
          <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            🔢 Digit Distribution
          </h3>
          {analysis?.digitFrequencies && (
            <DigitDistribution
              frequencies={analysis.digitFrequencies}
              currentDigit={currentDigit}
              theme={theme}
            />
          )}
        </div>
      </div>

      {/* Visual Chart Section */}
      <div
        className={`rounded-xl p-4 sm:p-6 border ${theme === "dark"
            ? "bg-gradient-to-br from-[#0f1629]/80 to-[#1a2235]/80 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]"
            : "bg-white border-gray-200 shadow-lg"
          }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h3 className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
            🎯 Pattern & Reversal Analysis
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase font-bold">
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-green-500/10 text-green-500 border border-green-500/20">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              Support
            </div>
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-red-500/10 text-red-500 border border-red-500/20">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              Resistance
            </div>
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              Entry Signal
            </div>
          </div>
        </div>

        <div className="min-h-[500px] relative">
          {priceHistory.length > 0 ? (
            <PatternChart
              priceHistory={priceHistory}
              supportResistance={supportResistance}
              entryExitPoints={entryExitPoints}
              patterns={detectedPatterns.map((p) => ({
                type: p.type,
                indices: p.indices,
                direction: p.direction,
              }))}
              theme={theme}
            />
          ) : (
            <div className={`flex items-center justify-center h-[500px] ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              <div className="text-center">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50 animate-spin" />
                <p className="font-medium">Synthesizing Market Data...</p>
                <p className="text-xs opacity-60">Scanning for reversal patterns</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pattern Details Summary */}
      {detectedPatterns.length > 0 && (
        <div
          className={`rounded-xl p-4 sm:p-6 border ${theme === "dark"
              ? "bg-gradient-to-br from-emerald-900/20 to-green-900/20 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              : "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200"
            }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-bold flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Pattern Intelligence
            </h3>
            <Button onClick={clearPatterns} variant="outline" size="sm" className="h-8">
              Reset Scanner
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {detectedPatterns.map((pattern, idx) => (
              <Card
                key={idx}
                className={`p-4 border-2 transition-all duration-300 ${pattern.direction === "Bullish"
                    ? theme === "dark"
                      ? "bg-green-500/5 border-green-500/30 hover:bg-green-500/10"
                      : "bg-green-50/50 border-green-200 hover:bg-green-50"
                    : theme === "dark"
                      ? "bg-red-500/5 border-red-500/30 hover:bg-red-500/10"
                      : "bg-red-50/50 border-red-200 hover:bg-red-50"
                  }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div
                      className={`text-sm font-bold mb-1 ${pattern.direction === "Bullish"
                          ? theme === "dark"
                            ? "text-green-400"
                            : "text-green-600"
                          : theme === "dark"
                            ? "text-red-400"
                            : "text-red-600"
                        }`}
                    >
                      {pattern.type}
                    </div>
                    <Badge
                      className={`text-[10px] px-2 py-0 h-4 ${pattern.direction === "Bullish" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                        }`}
                    >
                      {pattern.direction}
                    </Badge>
                  </div>
                  {pattern.direction === "Bullish" ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>

                <div className={`text-[11px] mb-3 leading-relaxed ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  {pattern.description}
                </div>

                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className={theme === "dark" ? "text-gray-400" : "text-gray-500"}>Signal Level:</span>
                    <span className={`font-mono font-bold ${theme === "dark" ? "text-cyan-400" : "text-blue-600"}`}>
                      {pattern.priceLevel.toFixed(5)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className={theme === "dark" ? "text-gray-400" : "text-gray-500"}>Probability:</span>
                    <span
                      className={`font-bold ${pattern.confidence >= 80
                          ? "text-green-400"
                          : "text-yellow-400"
                        }`}
                    >
                      {pattern.confidence}%
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Legacy/Deeper Chart Embed */}
      <div
        className={`rounded-xl p-4 sm:p-6 border ${theme === "dark"
            ? "bg-[#0f1629]/50 border-white/5"
            : "bg-gray-50 border-gray-200"
          }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-sm font-bold opacity-60 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
            Alternative TradingView Source (External)
          </h3>
        </div>
        <div className="w-full h-[600px] rounded-lg overflow-hidden bg-black/20">
          <iframe
            src="https://charts.deriv.com/"
            className="w-full h-full border-0 grayscale-[0.2] contrast-[1.1] brightness-[0.9]"
            title="Deriv Trading View"
            allow="fullscreen"
          />
        </div>
      </div>
    </div>
  )
}
