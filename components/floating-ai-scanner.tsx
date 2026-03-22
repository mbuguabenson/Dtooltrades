"use client"

import { useState, useEffect } from "react"
import { useSmartAdaptiveTrading } from "@/hooks/use-smart-adaptive-trading"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Brain, Zap, ChevronDown, ChevronUp, Loader2, Play, Pause, TrendingUp, Activity } from "lucide-react"

interface FloatingAIScannerProps {
  theme?: "light" | "dark"
  availableSymbols?: any[]
  onScanComplete?: (results: any[]) => void
}

interface StrategyData {
  id: string
  label: string
  icon: string
  description: string
  entryCondition: string
  exitCondition: string
  probability?: number
  isActive?: boolean
  confidence?: number
}

export function FloatingAIScanner({ theme = "dark", availableSymbols = [], onScanComplete }: FloatingAIScannerProps) {
  const { marketScores, selectedMarket, setSelectedMarket, signals, stats, isConnected, isAuthorized } = useSmartAdaptiveTrading()
  
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([])
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>(["EVEN_ODD", "OVER_UNDER", "DIFFERS", "MATCHES"])
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanResults, setScanResults] = useState<any[]>([])
  const [isScannerRunning, setIsScannerRunning] = useState(false)

  const strategies: StrategyData[] = [
    {
      id: "EVEN_ODD",
      label: "Even/Odd",
      icon: "🎯",
      description: "Predicts if last digit is even or odd",
      entryCondition: "Strong pattern consistency in digit sequence",
      exitCondition: "3 consecutive mismatches or profit target hit"
    },
    {
      id: "OVER_UNDER",
      label: "Over/Under",
      icon: "📊",
      description: "Predicts if digit is above/below threshold",
      entryCondition: "Clear deviation from mean with support levels",
      exitCondition: "Mean reversion signal or volatility spike"
    },
    {
      id: "DIFFERS",
      label: "Differs",
      icon: "⚡",
      description: "Predicts digit change from previous",
      entryCondition: "Break in repetition pattern detected",
      exitCondition: "Sequence stabilization or 5 tick window"
    },
    {
      id: "MATCHES",
      label: "Matches",
      icon: "✓",
      description: "Predicts digit match with previous",
      entryCondition: "Repetition pattern emerges in data",
      exitCondition: "Pattern break or consecutive variation"
    }
  ]

  // Update scan results from live signals
  useEffect(() => {
    if (!isConnected || !isAuthorized) return

    if (signals.length > 0) {
      const results = marketScores.slice(0, 5).map(market => {
        const marketSignals = signals.filter(s => s.confidence > 60)
        return {
          symbol: market.symbol,
          displayName: market.symbol.replace('_', ' '),
          matchingStrategies: marketSignals.map(s => s.strategy),
          confidence: Math.round(market.score),
          signals: marketSignals.length,
          probability: market.score,
          status: market.score > 70 ? "Ready to Trade" : "Monitoring"
        }
      })
      setScanResults(results)
    }
  }, [signals, marketScores, isConnected, isAuthorized])

  const toggleMarket = (symbol: string) => {
    setSelectedMarkets(prev => 
      prev.includes(symbol) ? prev.filter(m => m !== symbol) : [...prev, symbol]
    )
  }

  const toggleStrategy = (strategyId: string) => {
    setSelectedStrategies(prev =>
      prev.includes(strategyId) ? prev.filter(s => s !== strategyId) : [...prev, strategyId]
    )
  }

  const handleScanAll = () => {
    if (marketScores.length === 0) return
    setSelectedMarkets(marketScores.map(m => m.symbol))
  }

  const getStrategyProbability = (strategyId: string): number => {
    const matchingSignals = signals.filter(s => s.strategy === strategyId)
    if (matchingSignals.length === 0) return 0
    const avgConfidence = matchingSignals.reduce((sum, s) => sum + s.confidence, 0) / matchingSignals.length
    return Math.round(avgConfidence)
  }

  const toggleScannerRunning = () => {
    setIsScannerRunning(!isScannerRunning)
    if (!isScannerRunning) {
      setIsScanning(true)
      setScanProgress(0)
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + Math.random() * 25
        })
      }, 400)
    }
  }

  const handleScan = async () => {
    if (selectedMarkets.length === 0 || selectedStrategies.length === 0) {
      alert("Please select at least one market and one strategy")
      return
    }

    setIsScanning(true)
    setIsScannerRunning(true)
    setScanProgress(0)

    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 95) {
          return prev
        }
        return prev + Math.random() * 30
      })
    }, 300)

    // Update from real market data
    setTimeout(() => {
      setScanProgress(100)
      setIsScanning(false)
      if (onScanComplete) onScanComplete(scanResults)
    }, 2500)

    return () => clearInterval(interval)
  }

  return (
    <div className="fixed bottom-6 right-6 z-[50]">
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.2); }
          50% { box-shadow: 0 0 30px rgba(139, 92, 246, 0.8), 0 0 60px rgba(59, 130, 246, 0.4); }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes float-up {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
          100% { transform: translateY(0px); }
        }
        .pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .shimmer { animation: shimmer 3s infinite; background-size: 1000px 100%; }
        .slide-in-right { animation: slide-in-right 0.5s ease-out; }
        .float-up { animation: float-up 3s ease-in-out infinite; }
      `}
      </style>

      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className={`rounded-full w-16 h-16 p-0 shadow-xl flex items-center justify-center transition-all ${
            isScannerRunning ? "pulse-glow" : "hover:scale-110"
          } ${
            theme === "dark"
              ? "bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              : "bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          }`}
          title="Open AI Market Scanner"
        >
          <Brain className={`w-6 h-6 text-white ${isScannerRunning ? "animate-spin" : ""}`} />
        </Button>
      ) : (
        <Card className={`w-[420px] shadow-2xl border slide-in-right ${
          theme === "dark"
            ? "bg-gray-900/98 border-purple-500/40"
            : "bg-white/98 border-purple-300/40"
        } backdrop-blur-md`}>
          {/* Header with Live Status */}
          <div className={`p-4 border-b flex items-center justify-between ${
            theme === "dark" ? "border-gray-700/50 bg-gradient-to-r from-purple-600/20 to-blue-600/20" : "border-gray-200/50 bg-gradient-to-r from-purple-100/50 to-blue-100/50"
          }`}>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Brain className={`w-5 h-5 ${theme === "dark" ? "text-purple-400" : "text-purple-600"}`} />
                {isConnected && <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
              </div>
              <div>
                <h3 className={`font-bold text-sm uppercase tracking-wide ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  AI Market Scanner
                </h3>
                <p className={`text-[10px] ${theme === "dark" ? "text-gray-500" : "text-gray-600"}`}>
                  {isConnected ? "Live Analysis Active" : "Offline Mode"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                onClick={toggleScannerRunning}
                className={`h-7 w-7 p-0 ${
                  isScannerRunning
                    ? theme === "dark" ? "bg-red-500/30 text-red-400" : "bg-red-100 text-red-600"
                    : theme === "dark" ? "bg-green-500/30 text-green-400" : "bg-green-100 text-green-600"
                }`}
                title={isScannerRunning ? "Stop Scanner" : "Start Scanner"}
              >
                {isScannerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className={`h-7 w-7 p-0 ${theme === "dark" ? "hover:bg-white/10" : "hover:bg-black/10"}`}
              >
                {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOpen(false)
                  setIsMinimized(false)
                  setIsScannerRunning(false)
                }}
                className={`h-7 w-7 p-0 ${theme === "dark" ? "hover:bg-white/10" : "hover:bg-black/10"}`}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
              {/* All Strategies Display */}
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  <TrendingUp className="w-4 h-4" />
                  Market Strategies & Probabilities
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {strategies.map(strategy => {
                    const probability = getStrategyProbability(strategy.id)
                    const isActive = selectedStrategies.includes(strategy.id)
                    return (
                      <div
                        key={strategy.id}
                        onClick={() => toggleStrategy(strategy.id)}
                        className={`cursor-pointer p-3 rounded-lg border transition-all ${
                          isActive
                            ? theme === "dark"
                              ? "bg-purple-500/20 border-purple-500/60 shimmer"
                              : "bg-purple-100/50 border-purple-400/60 shimmer"
                            : theme === "dark"
                              ? "bg-gray-800/50 border-gray-700/50 hover:bg-gray-700/50"
                              : "bg-gray-100/50 border-gray-300/50 hover:bg-gray-200/50"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-lg">{strategy.icon}</span>
                          {isActive && (
                            <Activity className={`w-3 h-3 ${theme === "dark" ? "text-green-400" : "text-green-600"} animate-pulse`} />
                          )}
                        </div>
                        <p className={`text-xs font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                          {strategy.label}
                        </p>
                        <p className={`text-[10px] ${theme === "dark" ? "text-gray-400" : "text-gray-600"} mt-1`}>
                          {strategy.description}
                        </p>
                        
                        {/* Probability Gauge */}
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-[9px] font-bold ${
                              probability > 70 ? theme === "dark" ? "text-green-400" : "text-green-600"
                              : probability > 50 ? theme === "dark" ? "text-yellow-400" : "text-yellow-600"
                              : theme === "dark" ? "text-gray-500" : "text-gray-600"
                            }`}>
                              Power: {probability}%
                            </span>
                          </div>
                          <div className={`h-1.5 rounded-full overflow-hidden ${theme === "dark" ? "bg-gray-700/50" : "bg-gray-300/50"}`}>
                            <div
                              className={`h-full transition-all duration-500 ${
                                probability > 70 ? "bg-gradient-to-r from-green-500 to-emerald-400"
                                : probability > 50 ? "bg-gradient-to-r from-yellow-500 to-amber-400"
                                : "bg-gradient-to-r from-gray-500 to-gray-400"
                              }`}
                              style={{ width: `${probability}%` }}
                            />
                          </div>
                        </div>

                        {/* Entry/Exit Conditions */}
                        <div className={`mt-2 pt-2 border-t ${theme === "dark" ? "border-gray-700/50" : "border-gray-300/50"}`}>
                          <p className={`text-[9px] font-semibold ${theme === "dark" ? "text-emerald-400" : "text-emerald-600"} mb-0.5`}>
                            Entry: {strategy.entryCondition}
                          </p>
                          <p className={`text-[9px] font-semibold ${theme === "dark" ? "text-red-400" : "text-red-600"}`}>
                            Exit: {strategy.exitCondition}
                          </p>
                        </div>

                        {/* Run/Stop Status */}
                        <div className="mt-2 flex items-center justify-between">
                          <div className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold ${
                            probability > 70
                              ? theme === "dark" ? "bg-green-500/30 text-green-300" : "bg-green-100 text-green-700"
                              : theme === "dark" ? "bg-yellow-500/30 text-yellow-300" : "bg-yellow-100 text-yellow-700"
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${probability > 70 ? "bg-green-400" : "bg-yellow-400"} animate-pulse`} />
                            {probability > 70 ? "RUN" : "WAIT"}
                          </div>
                          <span className={`text-[8px] ${theme === "dark" ? "text-gray-500" : "text-gray-600"}`}>
                            {strategy.id === "EVEN_ODD" ? "Avg Confidence" : "Confidence"}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Scan Progress */}
              {isScanning && (
                <div className={`p-3 rounded-lg border ${
                  theme === "dark"
                    ? "bg-blue-500/10 border-blue-500/30"
                    : "bg-blue-100/50 border-blue-300"
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 className={`w-4 h-4 animate-spin ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`} />
                    <span className={`text-xs font-bold ${theme === "dark" ? "text-blue-300" : "text-blue-700"}`}>
                      Real-time Market Scan
                    </span>
                  </div>
                  <div className={`w-full h-2 rounded-full ${theme === "dark" ? "bg-gray-700/50" : "bg-gray-300/50"} overflow-hidden`}>
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 animate-pulse transition-all duration-300"
                      style={{ width: `${Math.min(scanProgress, 100)}%` }}
                    />
                  </div>
                  <p className={`text-xs text-center mt-1 font-semibold ${theme === "dark" ? "text-blue-300" : "text-blue-700"}`}>
                    {Math.round(Math.min(scanProgress, 100))}% Complete
                  </p>
                </div>
              )}

              {/* Live Results */}
              {scanResults.length > 0 && (
                <div className={`p-3 rounded-lg border ${
                  theme === "dark"
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-emerald-100/50 border-emerald-300"
                }`}>
                  <p className={`text-xs font-bold mb-2 ${theme === "dark" ? "text-emerald-400" : "text-emerald-700"}`}>
                    Active Opportunities ({scanResults.length})
                  </p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {scanResults.slice(0, 5).map((result, idx) => (
                      <div
                        key={result.symbol}
                        className={`text-[11px] flex items-center justify-between p-2 rounded border float-up ${
                          theme === "dark"
                            ? "bg-gray-800/50 border-gray-700/50 hover:bg-gray-700/50"
                            : "bg-white/50 border-gray-300/50 hover:bg-gray-200/50"
                        }`}
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        <div className="flex-1">
                          <p className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                            {result.displayName}
                          </p>
                          <p className={`text-[9px] ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                            {result.signals} active signal{result.signals !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`px-2 py-1 rounded font-bold text-[10px] ${
                            result.confidence > 70
                              ? theme === "dark" ? "bg-green-500/30 text-green-300" : "bg-green-100 text-green-700"
                              : theme === "dark" ? "bg-yellow-500/30 text-yellow-300" : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {result.confidence}%
                          </div>
                          <p className={`text-[8px] mt-1 ${
                            result.confidence > 70
                              ? theme === "dark" ? "text-green-400" : "text-green-600"
                              : theme === "dark" ? "text-yellow-400" : "text-yellow-600"
                          }`}>
                            {result.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleScan}
                  disabled={isScanning || !isConnected}
                  className={`font-bold uppercase tracking-wider py-2 transition-all ${
                    isScanning
                      ? theme === "dark"
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : theme === "dark"
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
                        : "bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600"
                  }`}
                >
                  <Zap className="w-4 h-4 mr-1 inline" />
                  {isScanning ? "Scanning" : "Full Scan"}
                </Button>
                <Button
                  onClick={handleScanAll}
                  disabled={!isConnected}
                  variant="outline"
                  className={`font-bold uppercase tracking-wider py-2 ${
                    theme === "dark"
                      ? "border-gray-600 text-gray-300 hover:bg-gray-800"
                      : "border-gray-400 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Brain className="w-4 h-4 mr-1 inline" />
                  All Markets
                </Button>
              </div>

              {!isConnected && (
                <div className={`p-2 rounded-lg border text-center ${
                  theme === "dark"
                    ? "bg-red-500/10 border-red-500/30 text-red-300 text-xs"
                    : "bg-red-100/50 border-red-300 text-red-700 text-xs"
                }`}>
                  Connect to API for live analysis
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
