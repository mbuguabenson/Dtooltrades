"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { DerivWebSocketManager } from "@/lib/deriv-websocket-manager"
import { AnalysisEngine, type TickData, type AnalysisResult, type Signal } from "@/lib/analysis-engine"
import { AIPredictor, type PredictionResult } from "@/lib/ai-predictor"
import { marketDataDebugger } from "@/lib/market-data-debugger"

export interface DerivSymbol {
  symbol: string
  display_name: string
  market?: string
  market_display_name?: string
}

export interface ConnectionLog {
  timestamp: number
  message: string
  type: "info" | "error" | "warning"
}

export function useDeriv(initialSymbol = "R_100", initialMaxTicks = 100) {
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "reconnecting">(
    "reconnecting",
  )
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [currentDigit, setCurrentDigit] = useState<number | null>(null)
  const [tickCount, setTickCount] = useState(0)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [signals, setSignals] = useState<Signal[]>([])
  const [aiPrediction, setAiPrediction] = useState<PredictionResult | null>(null)
  const [symbol, setSymbol] = useState(initialSymbol)
  const [maxTicks, setMaxTicks] = useState(initialMaxTicks)
  const [availableSymbols, setAvailableSymbols] = useState<DerivSymbol[]>([])
  const [connectionLogs, setConnectionLogs] = useState<ConnectionLog[]>([])
  const [proSignals, setProSignals] = useState<Signal[]>([])

  const wsRef = useRef<DerivWebSocketManager | null>(null)
  const engineRef = useRef<AnalysisEngine | null>(null)
  const predictorRef = useRef<AIPredictor | null>(null)
  const subscriptionIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    wsRef.current = DerivWebSocketManager.getInstance()
    engineRef.current = new AnalysisEngine(maxTicks)
    predictorRef.current = new AIPredictor()

    const connectAndSubscribe = async () => {
      try {
        console.log("[v0] Starting WebSocket connection...")

        if (!wsRef.current) {
          throw new Error("WebSocket manager not initialized")
        }

        setConnectionStatus("reconnecting")
        await wsRef.current.connect()

        setConnectionStatus("connected")
        addLog("Connected to Deriv WebSocket", "info")
        console.log("[v0] WebSocket connected successfully")

        // Get available symbols with fallback
        try {
          console.log("[v0] Fetching active symbols...")
          const symbols = await wsRef.current.getActiveSymbols()
          if (symbols && symbols.length > 0) {
            setAvailableSymbols(symbols)
            addLog(`Loaded ${symbols.length} active symbols`, "info")
            console.log("[v0] Loaded symbols:", symbols.length, symbols.map(s => s.symbol).join(", "))
          } else {
            console.warn("[v0] No symbols returned, using defaults")
            const defaultSymbols = [
              { symbol: "R_50", display_name: "Volatility 50" },
              { symbol: "R_100", display_name: "Volatility 100" },
              { symbol: "EURUSD", display_name: "EUR/USD" },
              { symbol: "GBPUSD", display_name: "GBP/USD" },
              { symbol: "USDJPY", display_name: "USD/JPY" },
            ]
            setAvailableSymbols(defaultSymbols)
            addLog("Using default markets", "info")
          }
        } catch (error) {
          console.error("[v0] Failed to get active symbols:", error)
          const defaultSymbols = [
            { symbol: "R_50", display_name: "Volatility 50" },
            { symbol: "R_100", display_name: "Volatility 100" },
            { symbol: "EURUSD", display_name: "EUR/USD" },
            { symbol: "GBPUSD", display_name: "GBP/USD" },
            { symbol: "USDJPY", display_name: "USD/JPY" },
          ]
          setAvailableSymbols(defaultSymbols)
          addLog("Failed to get symbols, using defaults", "warning")
        }

        if (subscriptionIdRef.current) {
          try {
            await wsRef.current.unsubscribe(subscriptionIdRef.current)
            console.log("[v0] Unsubscribed from previous symbol")
          } catch (error) {
            console.error("[v0] Failed to unsubscribe:", error)
          }
        }

        if (!symbol || symbol.trim() === "") {
          console.error("[v0] Invalid symbol, cannot subscribe")
          addLog("Invalid symbol provided", "error")
          return
        }

        console.log("[v0] Subscribing to symbol:", symbol)
        const subscriptionId = await wsRef.current.subscribeTicks(symbol, (tick) => {
          if (!tick || typeof tick.quote !== "number") {
            console.warn("[v0] Invalid tick data received")
            marketDataDebugger.log({
              stage: 'websocket_receive',
              symbol: symbol,
              message: 'Invalid tick data',
              status: 'error'
            })
            return
          }

          // Log WebSocket receive
          marketDataDebugger.log({
            stage: 'websocket_receive',
            symbol: tick.symbol || symbol,
            digit: tick.lastDigit,
            price: tick.quote,
            message: 'Tick received from WebSocket',
            status: 'success'
          })

          const tickData: TickData = {
            epoch: tick.epoch,
            quote: tick.quote,
            symbol: tick.symbol,
            pipSize: 2,
          }

          engineRef.current?.addTick(tickData)

          // Log tick processing
          marketDataDebugger.log({
            stage: 'tick_processing',
            symbol: tick.symbol || symbol,
            digit: tick.lastDigit,
            price: tick.quote,
            message: 'Tick added to analysis engine',
            status: 'success'
          })

          setCurrentPrice(tick.quote)
          setCurrentDigit(tick.lastDigit)
          setTickCount((prev) => prev + 1)

          const newAnalysis = engineRef.current?.getAnalysis()
          const newSignals = engineRef.current?.generateSignals()
          const newProSignals = engineRef.current?.generateProSignals()

          // Log analysis update
          if (newAnalysis) {
            marketDataDebugger.log({
              stage: 'analysis_update',
              symbol: tick.symbol || symbol,
              message: `Analysis updated with ${newAnalysis.digitFrequencies?.length || 0} digit frequencies`,
              status: 'success'
            })
            setAnalysis(newAnalysis)
          }

          // Log signal generation
          if (newSignals) {
            marketDataDebugger.log({
              stage: 'signals_generation',
              symbol: tick.symbol || symbol,
              message: `Generated ${newSignals.length} signals`,
              status: 'success'
            })
            setSignals(newSignals)
          }

          if (newProSignals) {
            setProSignals(newProSignals)
          }

          if (predictorRef.current && engineRef.current) {
            const lastDigits = engineRef.current.getLastDigits()
            const digitCounts = new Map<number, number>()
            newAnalysis?.digitFrequencies.forEach((freq) => {
              digitCounts.set(freq.digit, freq.count)
            })
            const prediction = predictorRef.current.predict(lastDigits, digitCounts)
            setAiPrediction(prediction)
          }

          // Log UI render
          marketDataDebugger.log({
            stage: 'ui_render',
            symbol: tick.symbol || symbol,
            digit: tick.lastDigit,
            price: tick.quote,
            message: 'UI state updated with new market data',
            status: 'success'
          })
        })

        subscriptionIdRef.current = subscriptionId
        addLog(`Subscribed to ${symbol} ticks`, "info")
        console.log("[v0] Successfully subscribed with ID:", subscriptionId)
      } catch (error) {
        console.error("[v0] Failed to connect:", error)
        setConnectionStatus("disconnected")
        addLog(`Connection failed: ${error}`, "error")

        setTimeout(() => {
          console.log("[v0] Attempting to reconnect...")
          setConnectionStatus("reconnecting")
          connectAndSubscribe()
        }, 10000)
      }
    }

    connectAndSubscribe()

    return () => {
      if (subscriptionIdRef.current && wsRef.current) {
        wsRef.current.unsubscribe(subscriptionIdRef.current).catch((error) => {
          console.error("[v0] Cleanup unsubscribe error:", error)
        })
      }
    }
  }, [symbol, maxTicks])

  const addLog = useCallback((message: string, type: "info" | "error" | "warning") => {
    setConnectionLogs((prev) => [...prev, { timestamp: Date.now(), message, type }].slice(-100))
  }, [])

  const changeSymbol = useCallback(async (newSymbol: string) => {
    console.log("[v0] Changing symbol to:", newSymbol)

    if (subscriptionIdRef.current && wsRef.current) {
      await wsRef.current.unsubscribe(subscriptionIdRef.current)
    }

    engineRef.current?.clear()
    setSymbol(newSymbol)
    setTickCount(0)
    setCurrentPrice(null)
    setCurrentDigit(null)
    setAnalysis(null)
    setSignals([])
    setProSignals([])
    setAiPrediction(null)
  }, [])

  const changeMaxTicks = useCallback((newMaxTicks: number) => {
    engineRef.current?.setMaxTicks(newMaxTicks)
    setMaxTicks(newMaxTicks)
  }, [])

  const exportData = useCallback(
    (format: "csv" | "json") => {
      const ticks = engineRef.current?.getTicks() || []
      const analysisData = engineRef.current?.getAnalysis()

      if (format === "json") {
        return JSON.stringify({ ticks, analysis: analysisData, signals }, null, 2)
      } else {
        let csv = "Epoch,Quote,Symbol,LastDigit\n"
        const lastDigits = engineRef.current?.getLastDigits() || []
        ticks.forEach((tick, index) => {
          csv += `${tick.epoch},${tick.quote},${tick.symbol},${lastDigits[index]}\n`
        })
        return csv
      }
    },
    [signals],
  )

  const getRecentDigits = useCallback((count = 20) => {
    return engineRef.current?.getRecentDigits(count) || []
  }, [])

  return {
    connectionStatus,
    currentPrice,
    currentDigit,
    tickCount,
    analysis,
    signals: signals || [],
    proSignals: proSignals || [],
    aiPrediction,
    symbol,
    maxTicks,
    availableSymbols,
    connectionLogs,
    changeSymbol,
    changeMaxTicks,
    exportData,
    getRecentDigits,
  }
}
