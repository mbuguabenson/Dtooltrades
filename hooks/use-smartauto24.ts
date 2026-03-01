'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { SmartAuto24Engine } from '@/lib/smartauto24-engine-integration'
import type { AnalysisSnapshot, BotSignal } from '@/lib/core-analytics-engine'
import { SmartIntelligenceEngine, type MarketScore } from "@/lib/trading/smart-intelligence-engine"

export function useSmartAuto24(market: string, isConnected: boolean) {
  const engineRef = useRef<SmartAuto24Engine>(new SmartAuto24Engine(100))
  const intelligenceRef = useRef<SmartIntelligenceEngine | null>(null)

  const [currentDigit, setCurrentDigit] = useState<number | null>(null)
  const [snapshot, setSnapshot] = useState<AnalysisSnapshot | null>(null)
  const [signals, setSignals] = useState<BotSignal[]>([])
  const [tickCount, setTickCount] = useState(0)
  const [activeBots, setActiveBots] = useState<string[]>(['even_odd'])
  const [marketScores, setMarketScores] = useState<MarketScore[]>([])

  useEffect(() => {
    if (!isConnected) {
      if (intelligenceRef.current) {
        intelligenceRef.current.stopScanning()
      }
      return
    }

    if (!intelligenceRef.current) {
      intelligenceRef.current = SmartIntelligenceEngine.getInstance()
    }

    intelligenceRef.current.setFocusMarket(market)
    intelligenceRef.current.startScanning()

    const unsub = intelligenceRef.current.onUpdate((scores) => {
      setMarketScores(scores)
    })

    return () => {
      if (unsub) unsub()
      // We don't stop scanning globally on unmount in case other components need it, 
      // as it's a singleton, but we could if we wanted stricter resource management.
    }
  }, [isConnected, market])

  // Set active bots
  const setBotsActive = useCallback((bots: string[]) => {
    setActiveBots(bots)
    engineRef.current.setActiveBots(bots)
  }, [])

  // Set pip size
  const setPipSize = useCallback((pipSize: number) => {
    engineRef.current.setPipSize(pipSize)
  }, [])

  // Process tick
  const processTick = useCallback((price: number) => {
    if (!engineRef.current) return

    const result = engineRef.current.processTick(price)
    setCurrentDigit(result.digit)
    setSnapshot(result.snapshot)
    setSignals(result.signals)
    setTickCount(prev => prev + 1)

    return result
  }, [])

  // Record trade result
  const recordTradeResult = useCallback((botType: string, won: boolean) => {
    engineRef.current.recordTradeResult(botType, won)
  }, [])

  // Get bot state
  const getBotState = useCallback((botType: string) => {
    return engineRef.current.getBotState(botType)
  }, [])

  // Reset engine
  const reset = useCallback(() => {
    engineRef.current.reset()
    setCurrentDigit(null)
    setSnapshot(null)
    setSignals([])
    setTickCount(0)
  }, [])

  return {
    engineRef,
    currentDigit,
    snapshot,
    signals,
    tickCount,
    activeBots,
    setBotsActive,
    setPipSize,
    processTick,
    recordTradeResult,
    getBotState,
    reset,
    marketScores
  }
}
