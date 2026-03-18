"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, Zap, Activity, Info, Loader2, Zap as ZapIcon } from "lucide-react"
import { AnalysisEngine, type Signal } from "@/lib/analysis-engine"
import { DerivWebSocketManager } from "@/lib/deriv-websocket-manager"

interface AdvancedSignalResult {
  symbol: string
  displayName: string
  signals: Signal[]
  lastUpdate: number
}

interface AdvancedSignalsTabProps {
  theme: "light" | "dark"
  availableSymbols: any[]
}

export function AdvancedSignalsTab({ theme, availableSymbols }: AdvancedSignalsTabProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [scannedResults, setScannedResults] = useState<AdvancedSignalResult[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  
  const scannerActiveRef = useRef(false)

  // Filtering logic
  const filteredResults = useMemo(() => {
    return scannedResults.filter(result => {
      const matchesSearch = result.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           result.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesFilter = !activeFilter || result.signals.some(s => {
        if (activeFilter === "even_odd") return s.type === "even_odd" || s.type === "pro_even_odd"
        if (activeFilter === "over_under") return s.type === "over_under" || s.type === "pro_over_under"
        if (activeFilter === "matches") return s.type === "matches"
        if (activeFilter === "differs") return s.type === "differs" || s.type === "pro_differs"
        return false
      })

      return matchesSearch && matchesFilter
    }).sort((a, b) => {
      const maxA = Math.max(...a.signals.map(s => s.probability), 0)
      const maxB = Math.max(...b.signals.map(s => s.probability), 0)
      return maxB - maxA
    })
  }, [scannedResults, searchQuery, activeFilter])

  // Scan Logic
  useEffect(() => {
    let isMounted = true
    const ws = DerivWebSocketManager.getInstance()

    const startScanner = async () => {
      // Use availableSymbols directly as they are already filtered and sorted in use-deriv hook
      // This ensures consistency across the app.
      const filteredMarkets = [...availableSymbols]

      if (scannerActiveRef.current || filteredMarkets.length === 0) return
      
      console.log("[v0] 🚀 Heritage Scanner: Starting scan for", filteredMarkets.length, "markets")
      scannerActiveRef.current = true
      setIsScanning(true)
      setScanProgress(0)
      
      const results: AdvancedSignalResult[] = []
      const batchSize = 10 
      
      try {
        for (let i = 0; i < filteredMarkets.length; i += batchSize) {
          if (!isMounted) break
          
          const batch = filteredMarkets.slice(i, i + batchSize)
          setScanProgress(Math.round((i / filteredMarkets.length) * 100))

          await Promise.all(batch.map(async (item) => {
            try {
              const historyPromise = ws.getTicksHistory(item.symbol, 100)
              const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000))
              const history = await Promise.race([historyPromise, timeoutPromise]) as any[]
              
              if (history && history.length > 0) {
                const tempEngine = new AnalysisEngine(100)
                tempEngine.addTicksBatch(history)
                
                const signals = [
                  ...tempEngine.generateSignals(),
                  ...tempEngine.generateProSignals(),
                  ...tempEngine.generateAdvancedSignalsList()
                ].filter(s => s.status !== "NEUTRAL")

                if (signals.length > 0) {
                  results.push({
                    symbol: item.symbol,
                    displayName: item.display_name,
                    signals,
                    lastUpdate: Date.now()
                  })
                }
              }
            } catch (e) {
              // Silently catch skip
            }
          }))

          setScannedResults([...results])
          await new Promise(r => setTimeout(r, 150))
        }
      } finally {
        if (isMounted) {
          setIsScanning(false)
          setScanProgress(100)
          scannerActiveRef.current = false
        }
      }
    }

    const initialDelay = setTimeout(startScanner, 2000)
    const interval = setInterval(startScanner, 120000)

    return () => {
      isMounted = false
      clearInterval(interval)
      clearTimeout(initialDelay)
    }
  }, [availableSymbols.length])

  const getStatusColor = (status: string) => {
    if (status === "TRADE NOW") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    if (status === "WAIT") return "bg-amber-500/20 text-amber-400 border-amber-500/30"
    return "bg-slate-500/20 text-slate-400 border-slate-500/30"
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Scanner Control Bar - Heritage Style */}
      <Card className="soft-card border-white/5 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input 
                placeholder="Market Search..." 
                className="pl-10 h-10 rounded-xl border-white/10 bg-white/5 focus:bg-white/10 text-white font-bold tracking-wide"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full md:w-auto">
              <span className="text-[10px] font-black uppercase text-slate-500 mr-2 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filters
              </span>
              {[
                { id: "even_odd", label: "Even/Odd" },
                { id: "over_under", label: "Over/Under" },
                { id: "matches", label: "Matches" },
                { id: "differs", label: "Differs" }
              ].map(f => (
                <Badge
                  key={f.id}
                  onClick={() => setActiveFilter(activeFilter === f.id ? null : f.id)}
                  className={`cursor-pointer px-4 py-1.5 rounded-full transition-all border-none font-bold uppercase text-[10px] ${
                    activeFilter === f.id 
                      ? "bg-primary text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]" 
                      : "bg-white/5 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  {f.label}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-3 min-w-fit">
              {isScanning ? (
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Scanning {scanProgress}%
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-400">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  Scanner Active
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Grid - Modern Card Design */}
      <div>
        {filteredResults.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResults.map((result) => (
              result.signals.map((signal, idx) => (
                <Card key={`${result.symbol}-${idx}`} className="border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] hover:from-white/10 hover:to-white/[0.05] transition-all duration-300 p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-white truncate">
                        {result.displayName}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono mt-1">
                        {result.symbol}
                      </p>
                    </div>
                    <Badge variant="outline" className="rounded-md bg-indigo-500/10 text-indigo-400 border-indigo-500/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider whitespace-nowrap ml-2">
                      {signal.type.replace('_', ' ')}
                    </Badge>
                  </div>

                  {/* Probability Bar */}
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">Confidence</span>
                      <span className="text-sm font-bold text-slate-200">
                        {signal.probability.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${signal.probability > 70 ? 'bg-gradient-to-r from-indigo-500 to-blue-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`} 
                        style={{ width: `${signal.probability}%` }}
                      />
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4 flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">Status:</span>
                    <Badge className={`rounded-md border font-black text-[9px] px-2.5 py-1 uppercase tracking-widest ${getStatusColor(signal.status)}`}>
                      {signal.status}
                    </Badge>
                  </div>

                  {/* Strategy Guide */}
                  <div className="pt-4 border-t border-white/10">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                        <p className="text-[11px] font-semibold leading-relaxed text-slate-300">
                          {signal.recommendation}
                        </p>
                      </div>
                      <div className="flex items-start gap-2 mt-2">
                        <Zap className="w-3.5 h-3.5 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <p className="text-[10px] text-slate-400 font-medium">
                          <span className="font-black text-yellow-400/80 uppercase tracking-tighter mr-1">ENTRY:</span> {signal.entryCondition}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ))}
          </div>
        ) : (
          <Card className="soft-card border-white/5 p-16">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-6 rounded-full bg-white/5 border border-white/10">
                <Zap className="w-12 h-12 text-slate-600 animate-pulse" />
              </div>
              <div className="space-y-1 text-center">
                <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-sm">
                  {isScanning ? "Analyzing Market Frequencies..." : "Scanning Complete - No Signals Met Filter"}
                </p>
                {isScanning && (
                  <div className="w-64 mx-auto h-2 bg-white/5 rounded-full overflow-hidden mt-4">
                    <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${scanProgress}%` }} />
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
      
      {/* Heritage Footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-white/5">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-primary" /> Active Monitoring: {availableSymbols.length} Instruments
        </p>
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600">
          Uplink Update: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
}
