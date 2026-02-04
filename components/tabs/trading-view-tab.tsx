"use client"

import { useState, useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, AlertTriangle, Activity } from "lucide-react"
import { derivWebSocket } from "@/lib/deriv-websocket-manager"
import { useDeriv } from "@/hooks/use-deriv"

interface ReversalPattern {
  type: "Double Top" | "Double Bottom" | "Head & Shoulders" | "Inverse H&S" | "Triple Top" | "Triple Bottom" | "Rising Wedge" | "Falling Wedge"
  direction: "Bullish" | "Bearish"
  confidence: number
  priceLevel: number
  timestamp: number
  description: string
}

interface PricePoint {
  price: number
  timestamp: number
  digit: number
}

interface TradingViewTabProps {
  theme?: "light" | "dark"
}

export function TradingViewTab({ theme = "dark" }: TradingViewTabProps) {
  const { symbol, currentPrice, currentDigit, getRecentDigits } = useDeriv()
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([])
  const [detectedPatterns, setDetectedPatterns] = useState<ReversalPattern[]>([])
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
        const updated = [...prev, newPoint].slice(-100) // Keep last 100 points
        detectReversalPatterns(updated)
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

  const detectReversalPatterns = (prices: PricePoint[]) => {
    if (prices.length < 20) return

    const patterns: ReversalPattern[] = []

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

    // Double Top Pattern
    if (peaks.length >= 2) {
      const lastTwoPeaks = peaks.slice(-2)
      const [peak1, peak2] = lastTwoPeaks.map((i) => prices[i].price)

      if (Math.abs(peak1 - peak2) / peak1 < 0.001) {
        // Peaks are within 0.1%
        patterns.push({
          type: "Double Top",
          direction: "Bearish",
          confidence: 75,
          priceLevel: peak2,
          timestamp: Date.now(),
          description: "Two similar peaks detected - potential reversal to downside",
        })
      }
    }

    // Double Bottom Pattern
    if (troughs.length >= 2) {
      const lastTwoTroughs = troughs.slice(-2)
      const [trough1, trough2] = lastTwoTroughs.map((i) => prices[i].price)

      if (Math.abs(trough1 - trough2) / trough1 < 0.001) {
        patterns.push({
          type: "Double Bottom",
          direction: "Bullish",
          confidence: 75,
          priceLevel: trough2,
          timestamp: Date.now(),
          description: "Two similar bottoms detected - potential reversal to upside",
        })
      }
    }

    // Head and Shoulders
    if (peaks.length >= 3 && troughs.length >= 2) {
      const lastThreePeaks = peaks.slice(-3)
      const [left, head, right] = lastThreePeaks.map((i) => prices[i].price)

      if (head > left && head > right && Math.abs(left - right) / left < 0.001) {
        patterns.push({
          type: "Head & Shoulders",
          direction: "Bearish",
          confidence: 85,
          priceLevel: head,
          timestamp: Date.now(),
          description: "Classic head and shoulders pattern - strong reversal signal",
        })
      }
    }

    // Inverse Head and Shoulders
    if (troughs.length >= 3 && peaks.length >= 2) {
      const lastThreeTroughs = troughs.slice(-3)
      const [left, head, right] = lastThreeTroughs.map((i) => prices[i].price)

      if (head < left && head < right && Math.abs(left - right) / left < 0.001) {
        patterns.push({
          type: "Inverse H&S",
          direction: "Bullish",
          confidence: 85,
          priceLevel: head,
          timestamp: Date.now(),
          description: "Inverse head and shoulders - strong bullish reversal",
        })
      }
    }

    // Triple Top
    if (peaks.length >= 3) {
      const lastThreePeaks = peaks.slice(-3)
      const peakPrices = lastThreePeaks.map((i) => prices[i].price)
      const avgPeak = peakPrices.reduce((a, b) => a + b, 0) / 3

      if (peakPrices.every((p) => Math.abs(p - avgPeak) / avgPeak < 0.001)) {
        patterns.push({
          type: "Triple Top",
          direction: "Bearish",
          confidence: 80,
          priceLevel: avgPeak,
          timestamp: Date.now(),
          description: "Three similar peaks - strong resistance level",
        })
      }
    }

    // Triple Bottom
    if (troughs.length >= 3) {
      const lastThreeTroughs = troughs.slice(-3)
      const troughPrices = lastThreeTroughs.map((i) => prices[i].price)
      const avgTrough = troughPrices.reduce((a, b) => a + b, 0) / 3

      if (troughPrices.every((p) => Math.abs(p - avgTrough) / avgTrough < 0.001)) {
        patterns.push({
          type: "Triple Bottom",
          direction: "Bullish",
          confidence: 80,
          priceLevel: avgTrough,
          timestamp: Date.now(),
          description: "Three similar bottoms - strong support level",
        })
      }
    }

    // Rising Wedge (Bearish)
    if (peaks.length >= 3 && troughs.length >= 3) {
      const recentPeaks = peaks.slice(-3).map((i) => prices[i].price)
      const recentTroughs = troughs.slice(-3).map((i) => prices[i].price)

      const peakTrend = recentPeaks[2] - recentPeaks[0]
      const troughTrend = recentTroughs[2] - recentTroughs[0]

      if (peakTrend > 0 && troughTrend > 0 && troughTrend > peakTrend) {
        patterns.push({
          type: "Rising Wedge",
          direction: "Bearish",
          confidence: 70,
          priceLevel: prices[prices.length - 1].price,
          timestamp: Date.now(),
          description: "Rising wedge pattern - bearish reversal expected",
        })
      }
    }

    // Falling Wedge (Bullish)
    if (peaks.length >= 3 && troughs.length >= 3) {
      const recentPeaks = peaks.slice(-3).map((i) => prices[i].price)
      const recentTroughs = troughs.slice(-3).map((i) => prices[i].price)

      const peakTrend = recentPeaks[2] - recentPeaks[0]
      const troughTrend = recentTroughs[2] - recentTroughs[0]

      if (peakTrend < 0 && troughTrend < 0 && Math.abs(troughTrend) > Math.abs(peakTrend)) {
        patterns.push({
          type: "Falling Wedge",
          direction: "Bullish",
          confidence: 70,
          priceLevel: prices[prices.length - 1].price,
          timestamp: Date.now(),
          description: "Falling wedge pattern - bullish reversal expected",
        })
      }
    }

    // Update detected patterns (keep only last 5 unique patterns)
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
  }

  // Calculate trend
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
      {/* Header Card */}
      <div
        className={`rounded-xl p-4 sm:p-6 border ${theme === "dark"
            ? "bg-gradient-to-br from-[#0f1629]/80 to-[#1a2235]/80 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]"
            : "bg-white border-gray-200 shadow-lg"
          }`}
      >
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
            📊 Reversal Pattern Detection
          </h2>
          <div className="flex items-center gap-3">
            <Badge className={`${trendBg} ${trendColor} border-0 flex items-center gap-2`}>
              {trend === "Bullish" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              Trend: {trend}
            </Badge>
            <Button
              onClick={() => setIsMonitoring(!isMonitoring)}
              variant={isMonitoring ? "destructive" : "default"}
              size="sm"
              className="flex items-center gap-2"
            >
              <Activity className={`h-4 w-4 ${isMonitoring ? "animate-pulse" : ""}`} />
              {isMonitoring ? "Stop" : "Start"}
            </Button>
          </div>
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div
            className={`rounded-lg p-3 border ${theme === "dark" ? "bg-blue-500/10 border-blue-500/30" : "bg-blue-50 border-blue-200"}`}
          >
            <div className={`text-xs mb-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Current Price</div>
            <div className={`text-lg font-bold ${theme === "dark" ? "text-cyan-400" : "text-cyan-600"}`}>
              {currentPrice?.toFixed(5) || "---"}
            </div>
          </div>
          <div
            className={`rounded-lg p-3 border ${theme === "dark" ? "bg-orange-500/10 border-orange-500/30" : "bg-orange-50 border-orange-200"
              }`}
          >
            <div className={`text-xs mb-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Last Digit</div>
            <div className={`text-lg font-bold ${theme === "dark" ? "text-orange-400" : "text-orange-600"}`}>
              {currentDigit !== null ? currentDigit : "---"}
            </div>
          </div>
          <div
            className={`rounded-lg p-3 border ${theme === "dark" ? "bg-purple-500/10 border-purple-500/30" : "bg-purple-50 border-purple-200"
              }`}
          >
            <div className={`text-xs mb-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Data Points</div>
            <div className={`text-lg font-bold ${theme === "dark" ? "text-purple-400" : "text-purple-600"}`}>
              {priceHistory.length}/100
            </div>
          </div>
          <div
            className={`rounded-lg p-3 border ${theme === "dark" ? "bg-emerald-500/10 border-emerald-500/30" : "bg-emerald-50 border-emerald-200"
              }`}
          >
            <div className={`text-xs mb-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Patterns Found</div>
            <div className={`text-lg font-bold ${theme === "dark" ? "text-emerald-400" : "text-emerald-600"}`}>
              {detectedPatterns.length}
            </div>
          </div>
        </div>
      </div>

      {/* Detected Patterns */}
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
              Active Reversal Patterns
            </h3>
            <Button onClick={clearPatterns} variant="outline" size="sm">
              Clear All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {detectedPatterns.map((pattern, idx) => (
              <Card
                key={idx}
                className={`p-4 border-2 ${pattern.direction === "Bullish"
                    ? theme === "dark"
                      ? "bg-green-500/10 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                      : "bg-green-50 border-green-400"
                    : theme === "dark"
                      ? "bg-red-500/10 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                      : "bg-red-50 border-red-400"
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
                      className={`text-xs ${pattern.direction === "Bullish" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                        }`}
                    >
                      {pattern.direction}
                    </Badge>
                  </div>
                  {pattern.direction === "Bullish" ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                </div>

                <div className={`text-xs mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  {pattern.description}
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>Price Level:</span>
                    <span className={`font-bold ${theme === "dark" ? "text-cyan-400" : "text-cyan-600"}`}>
                      {pattern.priceLevel.toFixed(5)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>Confidence:</span>
                    <span
                      className={`font-bold ${pattern.confidence >= 80
                          ? "text-green-400"
                          : pattern.confidence >= 70
                            ? "text-yellow-400"
                            : "text-orange-400"
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

      {/* Deriv Chart Embed */}
      <div
        className={`rounded-xl p-4 sm:p-6 md:p-8 border ${theme === "dark"
            ? "bg-gradient-to-br from-[#0f1629]/80 to-[#1a2235]/80 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]"
            : "bg-white border-gray-200 shadow-lg"
          }`}
      >
        <h3 className={`text-lg font-bold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Live Chart</h3>

        <div className="w-full h-[400px] sm:h-[500px] md:h-[700px] rounded-lg overflow-hidden bg-gray-900">
          <iframe
            src="https://charts.deriv.com/"
            className="w-full h-full border-0"
            title="Deriv Trading View"
            allow="fullscreen"
          />
        </div>

        <div className={`text-xs sm:text-sm mt-4 text-center ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
          Live Deriv Trading Chart
        </div>
      </div>
    </div>
  )
}
