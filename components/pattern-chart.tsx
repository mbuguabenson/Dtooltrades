"use client"

import { useEffect, useRef } from "react"

export interface CandleData {
    open: number
    high: number
    low: number
    close: number
    timestamp: number
}

export interface PricePoint {
    price: number
    timestamp: number
    digit: number
}

export interface SupportResistance {
    level: number
    type: "support" | "resistance"
    strength: number
}

export interface EntryExit {
    price: number
    type: "entry" | "exit"
    direction: "buy" | "sell" | "neutral"
    timestamp: number
}

export interface IndicatorData {
    name: string
    color: string
    values: (number | null)[]
}

interface PatternChartProps {
    priceHistory: PricePoint[]
    candleHistory?: CandleData[]
    supportResistance: SupportResistance[]
    entryExitPoints: EntryExit[]
    indicators?: IndicatorData[]
    patterns: Array<{
        type: string
        indices: number[]
        direction: "Bullish" | "Bearish"
    }>
    theme?: "light" | "dark"
    chartType?: "line" | "candle"
}

export function PatternChart({
    priceHistory,
    candleHistory = [],
    supportResistance,
    entryExitPoints,
    indicators = [],
    patterns,
    theme = "dark",
    chartType = "line",
}: PatternChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || (chartType === "line" && priceHistory.length === 0) || (chartType === "candle" && candleHistory.length === 0)) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Set canvas size
        const rect = canvas.getBoundingClientRect()
        const dpr = window.devicePixelRatio || 1
        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
        ctx.scale(dpr, dpr)

        const width = rect.width
        const height = rect.height
        const padding = { top: 30, right: 70, bottom: 40, left: 70 }

        // Clear canvas
        ctx.fillStyle = theme === "dark" ? "#0a0e27" : "#ffffff"
        ctx.fillRect(0, 0, width, height)

        const historyLength = chartType === "candle" ? candleHistory.length : priceHistory.length
        if (historyLength < 2) return

        // Calculate price range
        let minPrice: number, maxPrice: number
        if (chartType === "candle") {
            minPrice = Math.min(...candleHistory.map(c => c.low))
            maxPrice = Math.max(...candleHistory.map(c => c.high))
        } else {
            minPrice = Math.min(...priceHistory.map(p => p.price))
            maxPrice = Math.max(...priceHistory.map(p => p.price))
        }

        // Include indicators in range calculation
        indicators.forEach(ind => {
            ind.values.forEach(v => {
                if (v !== null) {
                    minPrice = Math.min(minPrice, v)
                    maxPrice = Math.max(maxPrice, v)
                }
            })
        })

        // Include SR levels in range calculation
        supportResistance.forEach(sr => {
            minPrice = Math.min(minPrice, sr.level)
            maxPrice = Math.max(maxPrice, sr.level)
        })

        const priceRange = (maxPrice - minPrice) * 1.1 || 0.00001
        const margin = (maxPrice - minPrice) * 0.1
        minPrice -= margin
        maxPrice += margin

        // Helper functions
        const xScale = (index: number) => padding.left + (index / (historyLength - 1)) * (width - padding.left - padding.right)
        const yScale = (price: number) => height - padding.bottom - ((price - minPrice) / (maxPrice - minPrice)) * (height - padding.top - padding.bottom)

        // Draw grid
        ctx.strokeStyle = theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"
        ctx.lineWidth = 1
        for (let i = 0; i <= 5; i++) {
            const y = padding.top + (i / 5) * (height - padding.top - padding.bottom)
            ctx.beginPath()
            ctx.moveTo(padding.left, y)
            ctx.lineTo(width - padding.right, y)
            ctx.stroke()
        }

        // Draw support and resistance zones
        supportResistance.forEach((sr) => {
            const y = yScale(sr.level)
            const alpha = sr.strength / 100
            ctx.fillStyle = sr.type === "support" ? `rgba(34, 197, 94, ${alpha * 0.1})` : `rgba(239, 68, 68, ${alpha * 0.1})`
            ctx.fillRect(padding.left, y - 4, width - padding.left - padding.right, 8)
            ctx.strokeStyle = sr.type === "support" ? `rgba(34, 197, 94, ${alpha * 0.8})` : `rgba(239, 68, 68, ${alpha * 0.8})`
            ctx.lineWidth = 1
            ctx.setLineDash([5, 5])
            ctx.beginPath()
            ctx.moveTo(padding.left, y)
            ctx.lineTo(width - padding.right, y)
            ctx.stroke()
            ctx.setLineDash([])

            // Label
            ctx.fillStyle = sr.type === "support" ? "#22c55e" : "#ef4444"
            ctx.font = "bold 10px sans-serif"
            ctx.textAlign = "left"
            ctx.fillText(`${sr.type === "support" ? "SUP" : "RES"} ${sr.level.toFixed(5)}`, width - padding.right + 5, y + 3)
        })

        if (chartType === "candle") {
            // Draw candles
            const candleWidth = Math.max(2, (width - padding.left - padding.right) / historyLength * 0.7)
            candleHistory.forEach((candle, i) => {
                const x = xScale(i)
                const yOpen = yScale(candle.open)
                const yClose = yScale(candle.close)
                const yHigh = yScale(candle.high)
                const yLow = yScale(candle.low)
                const isBullish = candle.close >= candle.open

                ctx.strokeStyle = isBullish ? "#22c55e" : "#ef4444"
                ctx.fillStyle = isBullish ? "#22c55e" : "#ef4444"
                ctx.lineWidth = 1

                // Wick
                ctx.beginPath()
                ctx.moveTo(x, yHigh)
                ctx.lineTo(x, yLow)
                ctx.stroke()

                // Body
                const bodyY = Math.min(yOpen, yClose)
                const bodyHeight = Math.abs(yOpen - yClose) || 1
                ctx.fillRect(x - candleWidth / 2, bodyY, candleWidth, bodyHeight)
            })
        } else {
            // Draw price line
            ctx.strokeStyle = theme === "dark" ? "#60a5fa" : "#3b82f6"
            ctx.lineWidth = 2
            ctx.beginPath()
            priceHistory.forEach((point, i) => {
                const x = xScale(i); const y = yScale(point.price)
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
            })
            ctx.stroke()

            // Area gradient
            const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom)
            gradient.addColorStop(0, theme === "dark" ? "rgba(96, 165, 250, 0.15)" : "rgba(59, 130, 246, 0.15)")
            gradient.addColorStop(1, "transparent")
            ctx.lineTo(xScale(priceHistory.length - 1), height - padding.bottom)
            ctx.lineTo(xScale(0), height - padding.bottom)
            ctx.fillStyle = gradient
            ctx.fill()
        }

        // Draw Indicators
        indicators.forEach(ind => {
            ctx.strokeStyle = ind.color
            ctx.lineWidth = 1.5
            ctx.beginPath()
            let started = false
            ind.values.forEach((v, i) => {
                if (v !== null) {
                    const x = xScale(i); const y = yScale(v)
                    if (!started) {
                        ctx.moveTo(x, y)
                        started = true
                    } else {
                        ctx.lineTo(x, y)
                    }
                }
            })
            ctx.stroke()
        })

        // Draw detected patterns
        patterns.forEach((pattern) => {
            ctx.strokeStyle = pattern.direction === "Bullish" ? "#22c55e" : "#ef4444"
            ctx.lineWidth = 2.5
            ctx.beginPath()
            pattern.indices.forEach((idx, i) => {
                if (idx >= historyLength) return
                const val = chartType === "candle" ? candleHistory[idx].close : priceHistory[idx].price
                const x = xScale(idx); const y = yScale(val)
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
            })
            ctx.stroke()

            // Label the pattern
            const lastIdx = pattern.indices[pattern.indices.length - 1]
            if (lastIdx < historyLength) {
                const val = chartType === "candle" ? candleHistory[lastIdx].close : priceHistory[lastIdx].price
                ctx.fillStyle = pattern.direction === "Bullish" ? "#22c55e" : "#ef4444"
                ctx.font = "bold 10px sans-serif"
                ctx.textAlign = "center"
                ctx.fillText(pattern.type, xScale(lastIdx), yScale(val) - 15)
            }
        })

        // Entry/Exit points
        entryExitPoints.forEach((point) => {
            const history = chartType === "candle" ? candleHistory : priceHistory
            const idx = history.findIndex((h) => h.timestamp >= point.timestamp)
            if (idx === -1) return
            const x = xScale(idx); const y = yScale(point.price)

            if (point.type === "entry") {
                ctx.fillStyle = point.direction === "buy" ? "#22c55e" : point.direction === "sell" ? "#ef4444" : "#9ca3af"
                ctx.beginPath()
                if (point.direction === "buy") {
                    ctx.moveTo(x, y + 12); ctx.lineTo(x - 6, y + 2); ctx.lineTo(x + 6, y + 2)
                } else {
                    ctx.moveTo(x, y - 12); ctx.lineTo(x - 6, y - 2); ctx.lineTo(x + 6, y - 2)
                }
                ctx.fill()
            } else {
                ctx.strokeStyle = "#ffffff"
                ctx.lineWidth = 2
                ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.stroke()
            }
        })

        // Labels and axes
        ctx.fillStyle = theme === "dark" ? "#9ca3af" : "#6b7280"
        ctx.font = "10px monospace"
        ctx.textAlign = "right"
        for (let i = 0; i <= 8; i++) {
            const p = minPrice + (maxPrice - minPrice) * (i / 8)
            ctx.fillText(p.toFixed(5), padding.left - 8, yScale(p) + 4)
        }

        // X axis time labels
        ctx.textAlign = "center"
        const timeStep = Math.floor(historyLength / 4)
        for (let i = 0; i < historyLength; i += timeStep) {
            if (i >= historyLength) break
            const x = xScale(i)
            const date = new Date((chartType === "candle" ? candleHistory[i].timestamp : priceHistory[i].timestamp) * 1000)
            ctx.fillText(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), x, height - padding.bottom + 15)
        }

    }, [priceHistory, candleHistory, supportResistance, entryExitPoints, indicators, patterns, theme, chartType])

    return (
        <div className="relative w-full h-full min-h-[400px]">
            <canvas ref={canvasRef} className="w-full h-full rounded-lg" />
        </div>
    )
}
