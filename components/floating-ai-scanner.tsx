"use client"

import { useState, useEffect } from "react"
import { useSmartAdaptiveTrading } from "@/hooks/use-smart-adaptive-trading"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, Brain, Zap, Loader2, TrendingUp, CheckCircle, Circle } from "lucide-react"

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
}

export function FloatingAIScanner({ theme = "dark", availableSymbols = [], onScanComplete }: FloatingAIScannerProps) {
  const { marketScores, signals, isConnected, isAuthorized } = useSmartAdaptiveTrading()
  
  const [isOpen, setIsOpen] = useState(false)
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>(["EVEN_ODD", "OVER_UNDER", "DIFFERS", "MATCHES"])
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanResults, setScanResults] = useState<any[]>([])

  const strategies: StrategyData[] = [
    {
      id: "EVEN_ODD",
      label: "Even/Odd",
      icon: "🎯",
      description: "Even or odd last digit",
      entryCondition: "Pattern consistency",
      exitCondition: "3 mismatches or profit"
    },
    {
      id: "OVER_UNDER",
      label: "Over/Under",
      icon: "📊",
      description: "Above/below threshold",
      entryCondition: "Mean deviation",
      exitCondition: "Reversion signal"
    },
    {
      id: "DIFFERS",
      label: "Differs",
      icon: "⚡",
      description: "Digit change",
      entryCondition: "Repetition break",
      exitCondition: "5 tick window"
    },
    {
      id: "MATCHES",
      label: "Matches",
      icon: "✓",
      description: "Digit match",
      entryCondition: "Pattern emerges",
      exitCondition: "Break detected"
    }
  ]

  const toggleStrategy = (strategyId: string) => {
    setSelectedStrategies(prev =>
      prev.includes(strategyId) ? prev.filter(s => s !== strategyId) : [...prev, strategyId]
    )
  }

  const getStrategyProbability = (strategyId: string): number => {
    const matchingSignals = signals.filter(s => s.strategy === strategyId)
    if (matchingSignals.length === 0) return 0
    const avgConfidence = matchingSignals.reduce((sum, s) => sum + s.confidence, 0) / matchingSignals.length
    return Math.round(avgConfidence)
  }

  const handleScan = async () => {
    if (selectedStrategies.length === 0) {
      alert("Please select at least one strategy")
      return
    }
    
    setIsScanning(true)
    setScanProgress(0)

    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 95) return prev
        return prev + Math.random() * 30
      })
    }, 300)

    setTimeout(() => {
      setScanProgress(100)
      setIsScanning(false)
      clearInterval(interval)
      if (onScanComplete) onScanComplete(scanResults)
    }, 2500)
  }

  // Update scan results from live signals
  useEffect(() => {
    if (!isConnected || !isAuthorized || marketScores.length === 0) return
    
    const results = marketScores.slice(0, 5).map(market => {
      const activeSignals = signals.filter(
        s => s.confidence > 60 && selectedStrategies.includes(s.strategy)
      )
      return {
        symbol: market.symbol,
        displayName: market.symbol.replace('_', ' '),
        matchingStrategies: activeSignals.map(s => s.strategy),
        confidence: Math.round(market.score),
        signals: activeSignals.length,
        probability: market.score,
        status: market.score > 70 ? "Ready" : "Monitor"
      }
    })
    setScanResults(results)
  }, [signals, marketScores, isConnected, isAuthorized, selectedStrategies])

  return (
    <div className="fixed bottom-6 right-6 z-[50]">
      <style>{`
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.6); } 50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.9); } }
        @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes shimmer { 0% { opacity: 0.7; } 50% { opacity: 1; } 100% { opacity: 0.7; } }
        .pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .slide-in { animation: slide-in 0.4s ease-out; }
        .shimmer { animation: shimmer 2s ease-in-out infinite; }
      `}
      </style>

      {!isOpen ? (
        // Floating button
        <Button
          onClick={() => setIsOpen(true)}
          className={`rounded-full w-14 h-14 p-0 shadow-lg flex items-center justify-center transition-all ${
            isScanning ? "pulse-glow" : "hover:scale-110"
          } ${
            theme === "dark"
              ? "bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              : "bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          }`}
          title="Market Scanner"
        >
          <Brain className={`w-6 h-6 text-white ${isScanning ? "animate-spin" : ""}`} />
        </Button>
      ) : (
        // Scanner panel
        <Card className={`w-96 shadow-2xl border slide-in ${
          theme === "dark"
            ? "bg-gray-900/95 border-purple-500/30"
            : "bg-white/95 border-purple-300/30"
        } backdrop-blur-md overflow-hidden`}>
          
          {/* Header */}
          <div className={`p-4 border-b ${
            theme === "dark" ? "border-gray-700/50 bg-black/20" : "border-gray-200/50 bg-white/50"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className={`w-5 h-5 ${theme === "dark" ? "text-purple-400" : "text-purple-600"}`} />
                <div>
                  <h3 className={`font-bold text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    Market Scanner
                  </h3>
                  <p className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-600"}`}>
                    {isConnected ? "Live" : "Offline"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className={`h-6 w-6 p-0 ${theme === "dark" ? "hover:bg-white/10" : "hover:bg-black/10"}`}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Strategy Selection */}
          <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider block mb-3 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                Select Strategies
              </label>
              <div className="grid grid-cols-2 gap-3">
                {strategies.map(strategy => {
                  const isSelected = selectedStrategies.includes(strategy.id)
                  const probability = getStrategyProbability(strategy.id)
                  const isHighSignal = probability > 70
                  
                  return (
                    <div
                      key={strategy.id}
                      onClick={() => toggleStrategy(strategy.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? theme === "dark"
                            ? "bg-purple-500/20 border-purple-500/60 shimmer"
                            : "bg-purple-100/60 border-purple-400/60 shimmer"
                          : theme === "dark"
                            ? "bg-gray-800/50 border-gray-700/50 hover:bg-gray-700/50"
                            : "bg-gray-100/50 border-gray-300/50 hover:bg-gray-200/50"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xl">{strategy.icon}</span>
                        {isSelected && (
                          <CheckCircle className={`w-4 h-4 ${theme === "dark" ? "text-purple-400" : "text-purple-600"}`} />
                        )}
                        {!isSelected && (
                          <Circle className={`w-4 h-4 ${theme === "dark" ? "text-gray-600" : "text-gray-400"}`} />
                        )}
                      </div>
                      
                      <p className={`text-sm font-bold mb-1 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                        {strategy.label}
                      </p>
                      <p className={`text-xs mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                        {strategy.description}
                      </p>

                      {/* Probability bar if selected */}
                      {isSelected && probability > 0 && (
                        <div className="space-y-1 mt-2 pt-2 border-t border-current border-opacity-20">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold ${
                              isHighSignal
                                ? theme === "dark" ? "text-green-400" : "text-green-600"
                                : theme === "dark" ? "text-yellow-400" : "text-yellow-600"
                            }`}>
                              Signal: {probability}%
                            </span>
                          </div>
                          <div className={`h-1.5 rounded-full overflow-hidden ${theme === "dark" ? "bg-gray-700/50" : "bg-gray-300/50"}`}>
                            <div
                              className={`h-full transition-all ${
                                isHighSignal 
                                  ? "bg-green-500" 
                                  : probability > 50 
                                  ? "bg-yellow-500" 
                                  : "bg-gray-500"
                              }`}
                              style={{ width: `${probability}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Entry/Exit on hover */}
                      <div className={`text-[10px] mt-2 pt-2 border-t border-current border-opacity-20 space-y-0.5 ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}>
                        <p><span className={theme === "dark" ? "text-emerald-400" : "text-emerald-600"}>Entry:</span> {strategy.entryCondition}</p>
                        <p><span className={theme === "dark" ? "text-red-400" : "text-red-600"}>Exit:</span> {strategy.exitCondition}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Scan Progress */}
            {isScanning && (
              <div className={`p-3 rounded-lg border space-y-2 ${
                theme === "dark"
                  ? "bg-blue-500/10 border-blue-500/30"
                  : "bg-blue-100/50 border-blue-300"
              }`}>
                <div className="flex items-center gap-2">
                  <Loader2 className={`w-4 h-4 animate-spin ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`} />
                  <span className={`text-xs font-bold ${theme === "dark" ? "text-blue-300" : "text-blue-700"}`}>
                    Scanning...
                  </span>
                </div>
                <div className={`w-full h-2 rounded-full ${theme === "dark" ? "bg-gray-700/50" : "bg-gray-300/50"} overflow-hidden`}>
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all"
                    style={{ width: `${Math.min(scanProgress, 100)}%` }}
                  />
                </div>
                <p className={`text-xs text-center font-semibold ${theme === "dark" ? "text-blue-300" : "text-blue-700"}`}>
                  {Math.round(Math.min(scanProgress, 100))}%
                </p>
              </div>
            )}

            {/* Results */}
            {!isScanning && scanResults.length > 0 && (
              <div className={`p-3 rounded-lg border space-y-2 ${
                theme === "dark"
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-emerald-100/50 border-emerald-300"
              }`}>
                <p className={`text-xs font-bold ${theme === "dark" ? "text-emerald-400" : "text-emerald-700"}`}>
                  Found {scanResults.length} Opportunities
                </p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {scanResults.slice(0, 5).map(result => (
                    <div
                      key={result.symbol}
                      className={`text-xs p-2 rounded flex items-center justify-between ${
                        theme === "dark" ? "bg-white/5" : "bg-white/50"
                      }`}
                    >
                      <span className="font-semibold">{result.displayName}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        result.confidence > 70
                          ? theme === "dark" ? "bg-green-500/30 text-green-300" : "bg-green-100 text-green-700"
                          : theme === "dark" ? "bg-yellow-500/30 text-yellow-300" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {result.confidence}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scan Button */}
            <Button
              onClick={handleScan}
              disabled={isScanning || !isConnected || selectedStrategies.length === 0}
              className={`w-full font-bold py-2 transition-all ${
                isScanning
                  ? theme === "dark"
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : theme === "dark"
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
                    : "bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600"
              }`}
            >
              <Zap className="w-4 h-4 mr-2 inline" />
              {isScanning ? "Scanning" : "Start Scan"}
            </Button>

            {!isConnected && (
              <div className={`p-2 rounded text-center text-xs ${
                theme === "dark"
                  ? "bg-red-500/10 text-red-300"
                  : "bg-red-100 text-red-700"
              }`}>
                Connect API for live scanning
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
