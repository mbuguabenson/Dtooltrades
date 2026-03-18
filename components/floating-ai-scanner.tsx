"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Brain, Zap, ChevronDown, ChevronUp, Loader2 } from "lucide-react"

interface FloatingAIScannerProps {
  theme?: "light" | "dark"
  availableSymbols?: any[]
  onScanComplete?: (results: any[]) => void
}

export function FloatingAIScanner({ theme = "dark", availableSymbols = [], onScanComplete }: FloatingAIScannerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([])
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanResults, setScanResults] = useState<any[]>([])

  const strategies = [
    { id: "even-odd", label: "Even/Odd", icon: "🎯" },
    { id: "over-under", label: "Over/Under", icon: "📊" },
    { id: "matches", label: "Matches", icon: "✓" },
    { id: "differs", label: "Differs", icon: "⚡" },
    { id: "high-probability", label: "High Probability (70%+)", icon: "🚀" }
  ]

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
    if (availableSymbols.length === 0) return
    setSelectedMarkets(availableSymbols.map(s => s.symbol))
  }

  const handleScan = async () => {
    if (selectedMarkets.length === 0 || selectedStrategies.length === 0) {
      alert("Please select at least one market and one strategy")
      return
    }

    setIsScanning(true)
    setScanProgress(0)

    // Simulate scanning
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + Math.random() * 30
      })
    }, 300)

    // Simulate results after 2 seconds
    setTimeout(() => {
      const mockResults = selectedMarkets.map(market => ({
        symbol: market,
        displayName: availableSymbols.find(s => s.symbol === market)?.display_name || market,
        matchingStrategies: selectedStrategies,
        confidence: Math.floor(Math.random() * 40 + 60),
        signals: Math.floor(Math.random() * 5 + 1)
      }))

      setScanResults(mockResults)
      setScanProgress(100)
      setIsScanning(false)
      if (onScanComplete) onScanComplete(mockResults)
    }, 2000)
  }

  return (
    <div className="fixed bottom-6 right-6 z-[50]">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className={`rounded-full w-16 h-16 p-0 shadow-lg flex items-center justify-center animate-pulse ${
            theme === "dark"
              ? "bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              : "bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          }`}
          title="Open AI Scanner"
        >
          <Brain className="w-6 h-6 text-white" />
        </Button>
      ) : (
        <Card className={`w-96 shadow-2xl border ${
          theme === "dark"
            ? "bg-gray-900/95 border-purple-500/40"
            : "bg-white/95 border-purple-300/40"
        } backdrop-blur-sm`}>
          {/* Header */}
          <div className={`p-4 border-b flex items-center justify-between ${
            theme === "dark" ? "border-gray-700/50 bg-gradient-to-r from-purple-600/20 to-blue-600/20" : "border-gray-200/50 bg-gradient-to-r from-purple-100/50 to-blue-100/50"
          }`}>
            <div className="flex items-center gap-2">
              <Brain className={`w-5 h-5 ${theme === "dark" ? "text-purple-400" : "text-purple-600"}`} />
              <h3 className={`font-bold text-sm uppercase tracking-wide ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                AI Market Scanner
              </h3>
            </div>
            <div className="flex items-center gap-1">
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
                }}
                className={`h-7 w-7 p-0 ${theme === "dark" ? "hover:bg-white/10" : "hover:bg-black/10"}`}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {/* Strategy Selection */}
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  Select Strategies
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {strategies.map(strategy => (
                    <Badge
                      key={strategy.id}
                      onClick={() => toggleStrategy(strategy.id)}
                      className={`cursor-pointer px-3 py-2 rounded-lg transition-all text-xs font-bold text-center border-none ${
                        selectedStrategies.includes(strategy.id)
                          ? theme === "dark"
                            ? "bg-purple-500 text-white"
                            : "bg-purple-600 text-white"
                          : theme === "dark"
                            ? "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                            : "bg-gray-200/50 text-gray-700 hover:bg-gray-300/50"
                      }`}
                    >
                      <span className="mr-1">{strategy.icon}</span>
                      {strategy.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Market Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className={`text-xs font-bold uppercase tracking-wider ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    Select Markets ({selectedMarkets.length})
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleScanAll}
                    className={`text-xs h-6 px-2 ${theme === "dark" ? "text-blue-400 hover:bg-blue-500/20" : "text-blue-600 hover:bg-blue-100"}`}
                  >
                    Scan All
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {availableSymbols.slice(0, 20).map(market => (
                    <Badge
                      key={market.symbol}
                      onClick={() => toggleMarket(market.symbol)}
                      className={`cursor-pointer px-2 py-1 rounded text-[10px] font-bold text-center border-none whitespace-nowrap overflow-hidden text-ellipsis ${
                        selectedMarkets.includes(market.symbol)
                          ? theme === "dark"
                            ? "bg-blue-500 text-white"
                            : "bg-blue-600 text-white"
                          : theme === "dark"
                            ? "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                            : "bg-gray-200/50 text-gray-700 hover:bg-gray-300/50"
                      }`}
                    >
                      {market.display_name || market.symbol}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Scan Progress */}
              {isScanning && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className={`w-4 h-4 animate-spin ${theme === "dark" ? "text-purple-400" : "text-purple-600"}`} />
                    <span className={`text-xs font-bold ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      Scanning Markets...
                    </span>
                  </div>
                  <div className={`w-full h-2 rounded-full ${theme === "dark" ? "bg-gray-700/50" : "bg-gray-300/50"} overflow-hidden`}>
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                      style={{ width: `${Math.min(scanProgress, 100)}%` }}
                    />
                  </div>
                  <p className={`text-xs text-center ${theme === "dark" ? "text-gray-500" : "text-gray-600"}`}>
                    {Math.round(Math.min(scanProgress, 100))}%
                  </p>
                </div>
              )}

              {/* Scan Results Preview */}
              {scanResults.length > 0 && !isScanning && (
                <div className={`p-3 rounded-lg border ${
                  theme === "dark"
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-green-100/50 border-green-300"
                }`}>
                  <p className={`text-xs font-bold mb-2 ${theme === "dark" ? "text-green-400" : "text-green-700"}`}>
                    Found {scanResults.length} matching market{scanResults.length !== 1 ? 's' : ''}
                  </p>
                  <div className="space-y-1">
                    {scanResults.slice(0, 3).map(result => (
                      <div key={result.symbol} className={`text-[10px] flex items-center justify-between p-1.5 rounded ${theme === "dark" ? "bg-white/5" : "bg-white/50"}`}>
                        <span className="font-semibold truncate">{result.displayName}</span>
                        <Badge className={`text-[8px] px-2 py-0.5 ${theme === "dark" ? "bg-blue-500/50 text-blue-200" : "bg-blue-400/50 text-blue-900"}`}>
                          {result.confidence}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Scan Button */}
              <Button
                onClick={handleScan}
                disabled={isScanning || selectedMarkets.length === 0 || selectedStrategies.length === 0}
                className={`w-full font-bold uppercase tracking-wider py-2 ${
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
                {isScanning ? "Scanning..." : "Start Scan"}
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
