"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useDerivAPI } from "@/lib/deriv-api-context"
import { SmartIntelligenceEngine, type MarketScore } from "@/lib/trading/smart-intelligence-engine"
import { SmartPatternEngine, type PatternMatch } from "@/lib/trading/smart-pattern-engine"
import { AdaptiveStrategyManager, type StrategySignal } from "@/lib/trading/adaptive-strategy-manager"
import { TradingManager } from "@/lib/trading/trading-manager"
import { DerivWebSocketManager } from "@/lib/deriv-websocket-manager"

export function useSmartAdaptiveTrading() {
    const { apiClient, isConnected, isAuthorized, balance } = useDerivAPI()

    const [marketScores, setMarketScores] = useState<MarketScore[]>([])
    const [selectedMarket, setSelectedMarket] = useState("R_100")
    const [selectedStrategy, setSelectedStrategy] = useState<string>("All")
    const [patterns, setPatterns] = useState<PatternMatch[]>([])
    const [signals, setSignals] = useState<StrategySignal[]>([])
    const [stats, setStats] = useState<any>(null)
    const [tradingStatus, setTradingStatus] = useState<any>(null)
    const [tickDuration, setTickDuration] = useState(3)
    const [logs, setLogs] = useState<{ message: string, type: string, timestamp: number }[]>([])

    const intelligenceRef = useRef<SmartIntelligenceEngine | null>(null)
    const patternRef = useRef<SmartPatternEngine>(new SmartPatternEngine())
    const strategyRef = useRef<AdaptiveStrategyManager>(new AdaptiveStrategyManager())
    const tradingRef = useRef<TradingManager | null>(null)
    const isScanningRef = useRef(false)

    useEffect(() => {
        if (!apiClient || !isConnected || !isAuthorized) {
            isScanningRef.current = false
            return
        }

        if (!intelligenceRef.current) {
            intelligenceRef.current = SmartIntelligenceEngine.getInstance()
        }

        // Always sync the trading manager with the current apiClient
        tradingRef.current = new TradingManager(apiClient)

        addLog("System synchronized. Multi-market intelligence active.", "system")

        if (!isScanningRef.current) {
            intelligenceRef.current.startScanning()
            isScanningRef.current = true
        }

        const unsub = intelligenceRef.current.onUpdate((scores) => {
            setMarketScores(scores)
        })

        addLog("Neural connection established. Pulse sync active.", "system")

        return () => {
            if (unsub) unsub()
            if (intelligenceRef.current) {
                intelligenceRef.current.stopScanning()
            }
        }
    }, [apiClient, isConnected, isAuthorized])

    // Process patterns for selected market
    useEffect(() => {
        if (!apiClient || !isConnected || !isAuthorized || !selectedMarket) return

        let currentSubId: string | null = null
        let isCancelled = false
        const digits: number[] = []

        addLog(`Focusing analysis on ${selectedMarket.replace('_', ' ')}`, "system")

        const startLocalSub = async () => {
            try {
                const id = await apiClient.subscribeTicks(selectedMarket, (tick) => {
                    if (isCancelled) return

                    const lastDigit = DerivWebSocketManager.getInstance().extractLastDigit(tick.quote)
                    digits.push(lastDigit)
                    if (digits.length > 100) digits.shift()

                    patternRef.current.updateWindow(digits)
                    patternRef.current.setTickDuration(tickDuration)

                    const currentPatterns = patternRef.current.analyze()
                    setPatterns(currentPatterns)

                    const currentSignals = strategyRef.current.getSignals(currentPatterns)
                    setSignals(currentSignals)

                    if (tradingRef.current) {
                        setStats(tradingRef.current.getStats())
                        setTradingStatus(tradingRef.current.getStatus())
                    }
                })

                if (isCancelled) {
                    if (id) apiClient.forget(id)
                } else {
                    currentSubId = id
                }
            } catch (err) {
                console.error("Failed to subscribe to focus market:", err)
                addLog(`Failed to sync with ${selectedMarket}`, "error")
            }
        }

        startLocalSub()

        return () => {
            isCancelled = true
            if (currentSubId) apiClient.forget(currentSubId)
        }
    }, [apiClient, isConnected, isAuthorized, selectedMarket, tickDuration])

    // Filter signals based on selected strategy
    const filteredSignals = useMemo(() => {
        if (selectedStrategy === "All") return signals
        return signals.filter(s => s.strategy === selectedStrategy)
    }, [signals, selectedStrategy])

    const tradeOnce = useCallback(async (signal: StrategySignal) => {
        if (!tradingRef.current) return
        addLog(`Manual execution: ${signal.strategy} - ${signal.type}`, "trade")

        try {
            // For manual trades, bypass session limits
            return await tradingRef.current.tradeOnce(signal, selectedMarket, true)
        } catch (err: any) {
            if (err?.message?.startsWith("SESSION_LIMIT")) {
                addLog(`Session limit reached but executing manual trade anyway`, "warning")
                // Try again with bypass
                return await tradingRef.current.tradeOnce(signal, selectedMarket, true)
            }
            addLog(`Trade execution failed: ${err?.message || "Unknown error"}`, "error")
            throw err
        }
    }, [selectedMarket])

    const startAutoTrade = useCallback(() => {
        if (!tradingRef.current) return
        addLog(`PI Auto Engine ENGAGED: ${selectedStrategy} only`, "system")
        tradingRef.current.startAutoTrade(selectedMarket, () => {
            const currentPatterns = patternRef.current.analyze()
            const currentSignals = strategyRef.current.getSignals(currentPatterns)

            const possibleSignals = selectedStrategy === "All"
                ? currentSignals
                : currentSignals.filter(s => s.strategy === selectedStrategy)

            const signal = possibleSignals.length > 0 ? possibleSignals[0] : null

            if (signal && signal.entryStatus === "Confirmed") {
                addLog(`Auto-executing: ${signal.strategy} - ${signal.type}`, "trade")
            }
            return signal
        })
    }, [selectedMarket, selectedStrategy])

    const addLog = (message: string, type = "info") => {
        setLogs(prev => [{ message, type, timestamp: Date.now() }, ...prev].slice(0, 50))
    }

    const stopAutoTrade = useCallback(() => {
        if (!tradingRef.current) return
        tradingRef.current.stopAutoTrade()
    }, [])

    const setConfig = useCallback((config: any) => {
        if (!tradingRef.current) return
        tradingRef.current.setConfig({ ...config, duration: tickDuration })
    }, [tickDuration])

    const resetSession = useCallback(() => {
        if (!tradingRef.current) return
        tradingRef.current.resetSession()
        addLog("Session statistics reset", "system")
    }, [])

    return {
        marketScores,
        selectedMarket,
        setSelectedMarket,
        selectedStrategy,
        setSelectedStrategy,
        patterns,
        signals: filteredSignals,
        stats,
        tradingStatus,
        tickDuration,
        setTickDuration,
        tradeOnce,
        startAutoTrade,
        stopAutoTrade,
        setConfig,
        resetSession,
        isConnected,
        isAuthorized,
        balance,
        logs
    }
}
