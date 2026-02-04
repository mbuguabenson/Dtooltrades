"use client"

import { useEffect, useRef } from "react"

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

interface PatternChartProps {
    priceHistory: PricePoint[]
    supportResistance: SupportResistance[]
    entryExitPoints: EntryExit[]
    patterns: Array<{
        type: string
        indices: number[]
        direction: "Bullish" | "Bearish"
    }>
    theme?: "light" | "dark"
}

export function PatternChart({
    priceHistory,
    supportResistance,
    entryExitPoints,
    patterns,
    theme = "dark",
}: PatternChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || priceHistory.length === 0) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Set canvas size
        const rect = canvas.getBoundingClientRect()
        canvas.width = rect.width * window.devicePixelRatio
        canvas.height = rect.height * window.devicePixelRatio
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

        const width = rect.width
        const height = rect.height
        const padding = { top: 20, right: 60, bottom: 40, left: 60 }

        // Clear canvas
        ctx.fillStyle = theme === "dark" ? "#0a0e27" : "#ffffff"
        ctx.fillRect(0, 0, width, height)

        if (priceHistory.length < 2) return

        // Calculate price range
        const prices = priceHistory.map((p) => p.price)
        const minPrice = Math.min(...prices)
        const maxPrice = Math.max(...prices)
        const priceRange = maxPrice - minPrice || 0.00001

        // Helper functions
        const xScale = (index: number) => padding.left + (index / (priceHistory.length - 1)) * (width - padding.left - padding.right)
        const yScale = (price: number) => height - padding.bottom - ((price - minPrice) / priceRange) * (height - padding.top - padding.bottom)

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

            // Draw zone
            ctx.fillStyle = sr.type === "support"
                ? `rgba(34, 197, 94, ${alpha * 0.1})`
                : `rgba(239, 68, 68, ${alpha * 0.1})`
            ctx.fillRect(padding.left, y - 3, width - padding.left - padding.right, 6)

            // Draw line
            ctx.strokeStyle = sr.type === "support"
                ? `rgba(34, 197, 94, ${alpha * 0.8})`
                : `rgba(239, 68, 68, ${alpha * 0.8})`
            ctx.lineWidth = 2
            ctx.setLineDash([5, 5])
            ctx.beginPath()
            ctx.moveTo(padding.left, y)
            ctx.lineTo(width - padding.right, y)
            ctx.stroke()
            ctx.setLineDash([])

            // Label
            ctx.fillStyle = sr.type === "support" ? "#22c55e" : "#ef4444"
            ctx.font = "bold 10px sans-serif"
            ctx.textAlign = "right"
            ctx.fillText(sr.level.toFixed(5), width - padding.right + 55, y + 4)
            ctx.fillText(sr.type === "support" ? "S" : "R", width - padding.right + 15, y + 4)
        })

        // Draw price line
        ctx.strokeStyle = theme === "dark" ? "#60a5fa" : "#3b82f6"
        ctx.lineWidth = 2
        ctx.beginPath()
        priceHistory.forEach((point, i) => {
            const x = xScale(i)
            const y = yScale(point.price)
            if (i === 0) {
                ctx.moveTo(x, y)
            } else {
                ctx.lineTo(x, y)
            }
        })
        ctx.stroke()

        // Draw area under line
        ctx.lineTo(xScale(priceHistory.length - 1), height - padding.bottom)
        ctx.lineTo(xScale(0), height - padding.bottom)
        ctx.closePath()
        const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom)
        gradient.addColorStop(0, theme === "dark" ? "rgba(96, 165, 250, 0.3)" : "rgba(59, 130, 246, 0.3)")
        gradient.addColorStop(1, theme === "dark" ? "rgba(96, 165, 250, 0)" : "rgba(59, 130, 246, 0)")
        ctx.fillStyle = gradient
        ctx.fill()

        // Draw data points
        priceHistory.forEach((point, i) => {
            const x = xScale(i)
            const y = yScale(point.price)

            ctx.fillStyle = theme === "dark" ? "#60a5fa" : "#3b82f6"
            ctx.beginPath()
            ctx.arc(x, y, 3, 0, Math.PI * 2)
            ctx.fill()
        })

        // Draw patterns
        patterns.forEach((pattern) => {
            if (pattern.indices.length < 2) return

            ctx.strokeStyle = pattern.direction === "Bullish" ? "#22c55e" : "#ef4444"
            ctx.lineWidth = 3
            ctx.setLineDash([])

            ctx.beginPath()
            pattern.indices.forEach((idx, i) => {
                if (idx >= priceHistory.length) return
                const x = xScale(idx)
                const y = yScale(priceHistory[idx].price)
                if (i === 0) {
                    ctx.moveTo(x, y)
                } else {
                    ctx.lineTo(x, y)
                }
            })
            ctx.stroke()

            // Draw pattern markers
            pattern.indices.forEach((idx) => {
                if (idx >= priceHistory.length) return
                const x = xScale(idx)
                const y = yScale(priceHistory[idx].price)

                ctx.fillStyle = pattern.direction === "Bullish" ? "#22c55e" : "#ef4444"
                ctx.beginPath()
                ctx.arc(x, y, 6, 0, Math.PI * 2)
                ctx.fill()

                ctx.strokeStyle = theme === "dark" ? "#0a0e27" : "#ffffff"
                ctx.lineWidth = 2
                ctx.stroke()
            })

            // Draw pattern label
            const midIdx = pattern.indices[Math.floor(pattern.indices.length / 2)]
            if (midIdx < priceHistory.length) {
                const x = xScale(midIdx)
                const y = yScale(priceHistory[midIdx].price) - 20

                ctx.fillStyle = pattern.direction === "Bullish" ? "#22c55e" : "#ef4444"
                ctx.font = "bold 11px sans-serif"
                ctx.textAlign = "center"
                ctx.fillText(pattern.type, x, y)
            }
        })

        // Draw entry/exit points
        entryExitPoints.forEach((point) => {
            const idx = priceHistory.findIndex((p) => p.timestamp >= point.timestamp)
            if (idx === -1) return

            const x = xScale(idx)
            const y = yScale(point.price)

            // Draw marker
            if (point.type === "entry") {
                // Triangle pointing up for buy, down for sell
                ctx.fillStyle = point.direction === "buy" ? "#22c55e" : "#ef4444"
                ctx.beginPath()
                if (point.direction === "buy") {
                    ctx.moveTo(x, y + 15)
                    ctx.lineTo(x - 8, y + 3)
                    ctx.lineTo(x + 8, y + 3)
                } else {
                    ctx.moveTo(x, y - 15)
                    ctx.lineTo(x - 8, y - 3)
                    ctx.lineTo(x + 8, y - 3)
                }
                ctx.closePath()
                ctx.fill()

                // Label
                ctx.font = "bold 10px sans-serif"
                ctx.fillStyle = "#ffffff"
                ctx.textAlign = "center"
                ctx.fillText("E", x, y + (point.direction === "buy" ? 12 : -8))
            } else {
                // Exit marker (circle)
                ctx.fillStyle = point.direction === "buy" ? "#22c55e" : "#ef4444"
                ctx.beginPath()
                ctx.arc(x, y, 8, 0, Math.PI * 2)
                ctx.fill()

                ctx.strokeStyle = "#ffffff"
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(x - 4, y - 4)
                ctx.lineTo(x + 4, y + 4)
                ctx.moveTo(x + 4, y - 4)
                ctx.lineTo(x - 4, y + 4)
                ctx.stroke()
            }
        })

        // Draw axes
        ctx.strokeStyle = theme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(padding.left, padding.top)
        ctx.lineTo(padding.left, height - padding.bottom)
        ctx.lineTo(width - padding.right, height - padding.bottom)
        ctx.stroke()

        // Y-axis labels (prices)
        ctx.fillStyle = theme === "dark" ? "#9ca3af" : "#6b7280"
        ctx.font = "11px sans-serif"
        ctx.textAlign = "right"
        for (let i = 0; i <= 5; i++) {
            const price = minPrice + (priceRange * i) / 5
            const y = height - padding.bottom - (i / 5) * (height - padding.top - padding.bottom)
            ctx.fillText(price.toFixed(5), padding.left - 10, y + 4)
        }

        // X-axis labels (time)
        ctx.textAlign = "center"
        const step = Math.max(1, Math.floor(priceHistory.length / 5))
        for (let i = 0; i < priceHistory.length; i += step) {
            const x = xScale(i)
            const time = new Date(priceHistory[i].timestamp * 1000)
            ctx.fillText(time.toLocaleTimeString(), x, height - padding.bottom + 20)
        }

    }, [priceHistory, supportResistance, entryExitPoints, patterns, theme])

    return (
        <div className="relative w-full h-full">
            <canvas
                ref={canvasRef}
                className="w-full h-full rounded-lg"
                style={{ minHeight: "400px" }}
            />
        </div>
    )
}
