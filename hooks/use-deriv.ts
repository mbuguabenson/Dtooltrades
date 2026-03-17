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

export function useDeriv(initialSymbol = "", initialMaxTicks = 1000) {
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "reconnecting">(
    "reconnecting",
  )
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [currentDigit, setCurrentDigit] = useState<number | null>(null)
  const [tickCount, setTickCount] = useState(0)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [signals, setSignals] = useState<Signal[]>([])
  const [aiPrediction, setAiPrediction] = useState<PredictionResult | null>(null)
  // Load persistent state from localStorage
  const getStoredValue = (key: string, defaultValue: any) => {
    if (typeof window === "undefined") return defaultValue
    const saved = localStorage.getItem(key)
    if (saved === null) return defaultValue
    try {
      return JSON.parse(saved)
    } catch {
      return saved
    }
  }

  const [symbol, setSymbol] = useState(() => getStoredValue("deriv_selected_symbol", initialSymbol))
  const [maxTicks, setMaxTicks] = useState(() => getStoredValue("deriv_max_ticks", initialMaxTicks))
  const [availableSymbols, setAvailableSymbols] = useState<DerivSymbol[]>([])
  const [connectionLogs, setConnectionLogs] = useState<ConnectionLog[]>([])
  const [proSignals, setProSignals] = useState<Signal[]>([])

  const wsRef = useRef<DerivWebSocketManager | null>(null)
  const engineRef = useRef<AnalysisEngine | null>(null)
  const predictorRef = useRef<AIPredictor | null>(null)
  const subscriptionIdRef = useRef<string | null>(null)
  const tickCallbackRef = useRef<((tick: any) => void) | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let isMounted = true
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
            // Filter ALL Derived (Synthetic) indices
            const filteredSymbols = symbols.filter(s => {
              const name = (s.display_name || "").toUpperCase();
              const sym = (s.symbol || "").toUpperCase();
              const market = (s.market || "").toUpperCase();
              const marketName = (s.market_display_name || "").toUpperCase();
              
              return market === "SYNTHETIC_INDEX" || 
                     marketName.includes("DERIVED") ||
                     marketName.includes("SYNTHETIC") ||
                     sym.includes("JUMP") || 
                     sym.includes("BOOM") || 
                     sym.includes("CRASH") ||
                     sym.includes("R_") ||
                     sym.includes("1HZ");
            }).sort((a, b) => {
              const symA = a.symbol.toUpperCase();
              const symB = b.symbol.toUpperCase();
              const nameA = a.display_name.toUpperCase();
              const nameB = b.display_name.toUpperCase();

              // 1. Volatility Indices (R_ or 1HZ)
              const isVolA = symA.startsWith("R_") || symA.includes("1HZ") || nameA.includes("VOLATILITY");
              const isVolB = symB.startsWith("R_") || symB.includes("1HZ") || nameB.includes("VOLATILITY");
              if (isVolA && !isVolB) return -1;
              if (!isVolA && isVolB) return 1;

              // 2. Jump Indices
              const isJumpA = symA.includes("JUMP") || nameA.includes("JUMP");
              const isJumpB = symB.includes("JUMP") || nameB.includes("JUMP");
              if (isJumpA && !isJumpB) return -1;
              if (!isJumpA && isJumpB) return 1;

              // 3. Others (Bull, Bear, Boom, Crash etc.)
              return nameA.localeCompare(nameB);
            });

            setAvailableSymbols(filteredSymbols)
            addLog(`Loaded ${filteredSymbols.length} derived indices`, "info")
            console.log("[v0] Sorted symbols:", filteredSymbols.length, filteredSymbols.map(s => s.symbol).join(", "))
          } else {
            console.warn("[v0] No symbols returned, using defaults")
            const defaultSymbols: any[] = [
              { symbol: "BTCH24", display_name: "Bull Market Index", market: "synthetic_index", market_display_name: "Derived" },
              { symbol: "BRCH24", display_name: "Bear Market Index", market: "synthetic_index", market_display_name: "Derived" },
              { symbol: "JUMP10", display_name: "Jump 10 Index", market: "synthetic_index", market_display_name: "Derived" },
              { symbol: "JUMP25", display_name: "Jump 25 Index", market: "synthetic_index", market_display_name: "Derived" },
              { symbol: "JUMP50", display_name: "Jump 50 Index", market: "synthetic_index", market_display_name: "Derived" },
              { symbol: "JUMP75", display_name: "Jump 75 Index", market: "synthetic_index", market_display_name: "Derived" },
              { symbol: "JUMP100", display_name: "Jump 100 Index", market: "synthetic_index", market_display_name: "Derived" },
            ]
            setAvailableSymbols(defaultSymbols)
            addLog("Using default markets", "info")
          }
        } catch (error) {
          console.error("[v0] Failed to get active symbols:", error)
          const defaultSymbols: any[] = [
            { symbol: "BTCH24", display_name: "Bull Market Index", market: "synthetic_index", market_display_name: "Derived" },
            { symbol: "BRCH24", display_name: "Bear Market Index", market: "synthetic_index", market_display_name: "Derived" },
            { symbol: "JUMP10", display_name: "Jump 10 Index", market: "synthetic_index", market_display_name: "Derived" },
          ]
          setAvailableSymbols(defaultSymbols)
          addLog("Failed to get symbols", "warning")
        }

        if (subscriptionIdRef.current) {
          try {
            await wsRef.current.unsubscribe(subscriptionIdRef.current, tickCallbackRef.current || undefined)
            console.log("[v0] Unsubscribed from previous symbol")
          } catch (error) {
            console.error("[v0] Failed to unsubscribe:", error)
          }
        }

        if (!symbol || symbol.trim() === "") {
          console.log("[v0] No symbol selected for subscription yet")
          return
        }

        console.log("[v0] Subscribing to symbol:", symbol)

        // Pre-fetch historical ticks to populate the engine immediately
        try {
          const history = await wsRef.current.getTicksHistory(symbol, 500)
          if (history && history.length > 0) {
            console.log(`[v0] Pre-loaded ${history.length} historical ticks for ${symbol} via batch`)
            engineRef.current?.addTicksBatch(history)
            
            // Initial UI state from history
            const lastTick = history[history.length - 1]
            setCurrentPrice(lastTick.quote)
            setCurrentDigit(lastTick.lastDigit)
            setTickCount(engineRef.current?.getTicks().length || 0)
            
            const initialAnalysis = engineRef.current?.getAnalysis()
            if (initialAnalysis) setAnalysis(initialAnalysis)

            const initialSignals = engineRef.current?.generateSignals()
            if (initialSignals) setSignals(initialSignals)

            const initialProSignals = engineRef.current?.generateProSignals()
            if (initialProSignals) setProSignals(initialProSignals)
          }
        } catch (e) {
          console.error("[v0] Failed to pre-load historical data:", e)
        }

        const tickHandler = (tick: any) => {
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

          const pipSize = wsRef.current?.getPipSize(symbol) || 2
          const tickData: TickData = {
            epoch: tick.epoch,
            quote: tick.quote,
            symbol: tick.symbol || symbol,
            pipSize: pipSize,
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
        }

        tickCallbackRef.current = tickHandler
        const subscriptionId = await wsRef.current.subscribeTicks(symbol, tickHandler)

        subscriptionIdRef.current = subscriptionId
        addLog(`Subscribed to ${symbol} ticks`, "info")
        console.log("[v0] Successfully subscribed with ID:", subscriptionId)
      } catch (error) {
        if (isMounted) {
          console.error("[v0] Failed to connect:", error)
          setConnectionStatus("disconnected")
          addLog(`Connection failed: ${error}`, "error")

          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMounted) {
              console.log("[v0] Attempting to reconnect...")
              setConnectionStatus("reconnecting")
              connectAndSubscribe()
            }
          }, 10000)
        }
      }
    }

    connectAndSubscribe()

    return () => {
      isMounted = false
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (subscriptionIdRef.current && wsRef.current) {
        wsRef.current.unsubscribe(subscriptionIdRef.current, tickCallbackRef.current || undefined).catch((error) => {
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
    if (typeof window !== "undefined") {
      localStorage.setItem("deriv_selected_symbol", JSON.stringify(newSymbol))
    }
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
    if (typeof window !== "undefined") {
      localStorage.setItem("deriv_max_ticks", JSON.stringify(newMaxTicks))
    }
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
