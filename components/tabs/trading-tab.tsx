"use client"
import { useCallback, useState, useEffect } from "react"
import { useDerivAPI } from "@/lib/deriv-api-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, AlertCircle, TrendingUp } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { TradingJournal } from "@/lib/trading-journal"
import { RiskManagementTab } from "./risk-management-tab"
import { DigitPowerVisualizer } from "../digit-power-visualizer"
import { powerEngine, type PowerSnapshot } from "@/lib/high-speed/power-analytics-engine"
import { StrategyRouter, type TradeStrategy } from "@/lib/high-speed/strategy-router"
import { LayoutDashboard, Zap, ShieldCheck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ManualTrader } from "./manual-trader"
import { AutoRunBot } from "./autorun-bot"
import { SpeedBot } from "./speedbot"
import { derivWebSocket } from "@/lib/deriv-websocket-manager"

interface TradingTabProps {
  theme?: "light" | "dark"
}

export function TradingTab({ theme: propTheme }: TradingTabProps) {
  const {
    apiClient,
    isConnected,
    isAuthorized,
    error,
    connectionStatus,
    token: globalApiToken,
    isLoggedIn,
    balance: globalBalance,
    accountType: globalAccountType,
    accountCode: globalAccountCode,
  } = useDerivAPI()

  const currentThemeFromProps = propTheme || "dark"

  const balance = globalBalance?.amount || 0
  const currency = globalBalance?.currency || "USD"
  const accountType = globalAccountType || "DEMO"
  const loginId = globalAccountCode || ""

  const [activeSymbols, setActiveSymbols] = useState<any[]>([])
  const [markets, setMarkets] = useState<string[]>([])
  const [submarkets, setSubmarkets] = useState<Record<string, string[]>>({})
  const [instruments, setInstruments] = useState<Record<string, any[]>>({})
  const [contractsCache, setContractsCache] = useState<Record<string, any>>({})
  const [loadingMarkets, setLoadingMarkets] = useState(false)
  const [marketError, setMarketError] = useState<string | null>(null)

  const [currentTheme, setCurrentTheme] = useState(currentThemeFromProps)
  const [activeTab, setActiveTab] = useState("manual")

  const [selectedMarket, setSelectedMarket] = useState<string>("")
  const [selectedSubmarket, setSelectedSubmarket] = useState<string>("")
  const [selectedSymbol, setSelectedSymbol] = useState<string>("")

  const [currentTick, setCurrentTick] = useState<number | null>(null)
  const [tickTimestamp, setTickTimestamp] = useState<string>("")

  // High-Speed Engine State
  const [powerSnapshot, setPowerSnapshot] = useState<PowerSnapshot | null>(null)
  const [selectedStrategy, setSelectedStrategy] = useState<TradeStrategy>("EVEN_ODD")
  const [autoBotConfig, setAutoBotConfig] = useState({
    stake: 1,
    martingale: 2.1,
    duration: 1,
    durationUnit: "t",
    autoBotEnabled: false,
    marketSwitchOnLoss: false,
    maxLossEnabled: false,
    maxLossAmount: 10
  })

  // Initialize Strategy Router
  const [strategyRouter] = useState(() => new StrategyRouter(autoBotConfig))

  useEffect(() => {
    strategyRouter.setConfig(autoBotConfig)
  }, [autoBotConfig, strategyRouter])

  const logJournal = useCallback((message: string, type: "info" | "success" | "error" | "warn" = "info") => {
    console.log(`[${type.toUpperCase()}] ${message}`)
  }, [])

  useEffect(() => {
    setIsConnectedState(isConnected)
    setIsAuthorisedState(isAuthorized)
  }, [apiClient, isConnected, isAuthorized])

  const [isConnectedState, setIsConnectedState] = useState(false)
  const [isAuthorisedState, setIsAuthorisedState] = useState(false)

  useEffect(() => {
    if (apiClient && isConnected && isAuthorized) {
      setIsConnectedState(true)
      setIsAuthorisedState(true)

      // Instead of forgetAll which kills other components' streams, 
      // we just load what we need for this tab.
      loadMarketsAndSymbols()
    } else {
      setIsConnectedState(false)
      setIsAuthorisedState(false)
    }
  }, [apiClient, isConnected, isAuthorized])

  const loadMarketsAndSymbols = async () => {
    if (!apiClient) {
      setMarketError("API client not available")
      return
    }

    try {
      setLoadingMarkets(true)
      setMarketError(null)
      const symbols = await apiClient.getActiveSymbols()

      if (!symbols || symbols.length === 0) {
        setMarketError("No markets available")
        logJournal("No markets available from API", "warn")
        return
      }

      const continuousIndices = symbols.filter((symbol: any) => {
        const market = symbol.market?.toLowerCase() || ""
        const submarket = symbol.submarket?.toLowerCase() || ""
        const display = symbol.display_name?.toLowerCase() || ""

        return (
          market === "synthetic_index" ||
          submarket.includes("crash") ||
          submarket.includes("boom") ||
          submarket.includes("volatility") ||
          submarket.includes("jump") ||
          submarket.includes("step") ||
          display.includes("volatility") ||
          display.includes("crash") ||
          display.includes("boom")
        )
      })

      const marketGroups: Record<string, Record<string, any[]>> = {}
      const uniqueMarkets = new Set<string>()

      continuousIndices.forEach((symbol: any) => {
        const market = symbol.market || "synthetic_index"
        const submarket = symbol.submarket || "other"

        uniqueMarkets.add(market)

        if (!marketGroups[market]) {
          marketGroups[market] = {}
        }
        if (!marketGroups[market][submarket]) {
          marketGroups[market][submarket] = []
        }
        marketGroups[market][submarket].push(symbol)
      })

      setMarkets(Array.from(uniqueMarkets))
      setSubmarkets(
        Object.keys(marketGroups).reduce(
          (acc, market) => {
            acc[market] = Object.keys(marketGroups[market])
            return acc
          },
          {} as Record<string, string[]>,
        ),
      )
      setInstruments(
        Object.keys(marketGroups).reduce(
          (acc, market) => {
            Object.keys(marketGroups[market]).forEach((submarket) => {
              const key = `${market}_${submarket}`
              acc[key] = marketGroups[market][submarket]
            })
            return acc
          },
          {} as Record<string, any[]>,
        ),
      )
      setActiveSymbols(continuousIndices)

      const defaultMarket = Array.from(uniqueMarkets)[0]
      const defaultSubmarket = Object.keys(marketGroups[defaultMarket])[0]
      const defaultSymbol = marketGroups[defaultMarket][defaultSubmarket][0].symbol

      setSelectedMarket(defaultMarket)
      setSelectedSubmarket(defaultSubmarket)
      setSelectedSymbol(defaultSymbol)

      await loadContractsForMarket(defaultSymbol)

      logJournal(
        `Continuous Indices loaded: ${uniqueMarkets.size} markets with ${continuousIndices.length} instruments`,
        "success",
      )
    } catch (error: any) {
      console.error("[v0] Error loading markets:", error)
      setMarketError(error.message || "Failed to load markets")
      logJournal("Error loading markets: " + error.message, "error")
    } finally {
      setLoadingMarkets(false)
    }
  }

  const loadContractsForMarket = async (symbol: string) => {
    if (!apiClient || !symbol) return

    try {
      const contracts = await apiClient.getContractsFor(symbol)

      if (!contracts || contracts.length === 0) {
        return
      }

      const grouped: Record<string, any[]> = {}
      contracts.forEach((contract: any) => {
        const category = contract.contract_category || "Other"
        if (!grouped[category]) {
          grouped[category] = []
        }
        grouped[category].push(contract)
      })

      setContractsCache((prev) => ({
        ...prev,
        [symbol]: grouped,
      }))

      logJournal(`Contracts loaded for ${symbol}`, "success")
    } catch (error: any) {
      console.error("[v0] Failed to load contracts:", error)
      logJournal(`Failed to load contracts for ${symbol}: ${error.message}`, "error")
    }
  }

  useEffect(() => {
    if (!apiClient || !selectedSymbol || !isConnected || !isAuthorized) return

    let tickSubscriptionId: string | null = null

    const subscribeTicks = async () => {
      try {
        tickSubscriptionId = await apiClient.subscribeTicks(selectedSymbol, (tick: any) => {
          if (tick.quote) {
            setCurrentTick(tick.quote)
            setTickTimestamp(new Date(tick.epoch * 1000).toLocaleTimeString())

            // Trigger Power Engine
            const price = tick.quote
            const lastDigit = derivWebSocket.extractLastDigit(price)
            const snapshot = powerEngine.addDigit(lastDigit)
            setPowerSnapshot(snapshot)

            // Trigger Strategy Router
            strategyRouter.onTickUpdate(snapshot, selectedStrategy, selectedSymbol)
          }
        })
      } catch (error: any) {
        console.error(`[v0] ❌ Failed to subscribe to ${selectedSymbol}:`, error.message || error);
      }
    }

    subscribeTicks()

    return () => {
      if (tickSubscriptionId && apiClient) {
        apiClient.forget(tickSubscriptionId).catch(() => { })
      }
    }
  }, [apiClient, selectedSymbol, isConnected, isAuthorized])

  const [manualJournal] = useState(() => new TradingJournal("manual-trader"))
  const [autorunJournal] = useState(() => new TradingJournal("autorun-bot"))
  const [speedbotJournal] = useState(() => new TradingJournal("speedbot"))

  const [manualStats, setManualStats] = useState(manualJournal.getStats())
  const [autorunStats, setAutorunStats] = useState(autorunJournal.getStats())
  const [speedbotStats, setSpeedbotStats] = useState(speedbotJournal.getStats())

  useEffect(() => {
    manualJournal.on("stats-updated", setManualStats)
    autorunJournal.on("stats-updated", setAutorunStats)
    speedbotJournal.on("stats-updated", setSpeedbotStats)

    return () => {
      manualJournal.removeAllListeners()
      autorunJournal.removeAllListeners()
      speedbotJournal.removeAllListeners()
    }
  }, [])

  const handleMarketChange = useCallback(
    (market: string) => {
      setSelectedMarket(market)
      const firstSubmarket = submarkets[market]?.[0] || ""
      setSelectedSubmarket(firstSubmarket)
      const key = `${market}_${firstSubmarket}`
      const firstInstrument = instruments[key]?.[0]
      if (firstInstrument) {
        setSelectedSymbol(firstInstrument.symbol)
        loadContractsForMarket(firstInstrument.symbol)
      }
    },
    [submarkets, instruments],
  )

  const handleSubmarketChange = useCallback(
    (submarket: string) => {
      setSelectedSubmarket(submarket)
      const key = `${selectedMarket}_${submarket}`
      const firstInstrument = instruments[key]?.[0]
      if (firstInstrument) {
        setSelectedSymbol(firstInstrument.symbol)
        loadContractsForMarket(firstInstrument.symbol)
      }
    },
    [selectedMarket, instruments],
  )

  const handleSymbolChange = useCallback((symbol: string) => {
    setSelectedSymbol(symbol)
    loadContractsForMarket(symbol)
  }, [])

  return (
    <div
      className={`w-full rounded-lg p-3 sm:p-4 border ${currentTheme === "dark" ? "bg-linear-to-br from-[#0f1629]/80 to-[#1a2235]/80 border-blue-500/20" : "bg-white border-gray-200"}`}
    >
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-blue-500/20">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${isConnectedState && isAuthorisedState ? "bg-green-400 animate-pulse" : connectionStatus === "reconnecting" ? "bg-yellow-400 animate-pulse" : "bg-red-400"}`}
          />
          <span
            className={`text-xs sm:text-sm font-medium ${currentTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}
          >
            {connectionStatus === "connecting"
              ? "Connecting..."
              : connectionStatus === "reconnecting"
                ? "Reconnecting..."
                : isConnectedState && isAuthorisedState
                  ? "Connected"
                  : "Disconnected"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <h2 className={`text-base sm:text-lg font-bold ${currentTheme === "dark" ? "text-white" : "text-gray-900"}`}>
            Trade Now - Continuous Indices
          </h2>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">{accountType}</Badge>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs font-bold">
              {balance.toFixed(2)} {currency}
            </Badge>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div
          className={`p-3 rounded-lg border mb-4 flex items-start gap-2 ${currentTheme === "dark" ? "bg-red-500/10 border-red-500/30" : "bg-red-50 border-red-200"}`}
        >
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-400" />
          <div>
            <p className={`text-sm font-medium ${currentTheme === "dark" ? "text-red-400" : "text-red-600"}`}>
              Connection Error
            </p>
            <p className={`text-xs mt-1 ${currentTheme === "dark" ? "text-red-300" : "text-red-500"}`}>{error}</p>
          </div>
        </div>
      )}

      {!isConnectedState || !isAuthorisedState ? (
        <div
          className={`p-4 rounded-lg border text-center ${currentTheme === "dark" ? "bg-red-500/10 border-red-500/30" : "bg-red-50 border-red-200"}`}
        >
          <p className={`text-sm ${currentTheme === "dark" ? "text-red-400" : "text-red-600"}`}>
            {connectionStatus === "connecting"
              ? "Connecting to API..."
              : connectionStatus === "reconnecting"
                ? "Reconnecting to API..."
                : "Waiting for authorization..."}
          </p>
          <p className={`text-xs mt-2 ${currentTheme === "dark" ? "text-gray-600" : "text-gray-600"}`}>
            Please ensure you have entered a valid API token
          </p>
        </div>
      ) : (
        <>
          <Card
            className={`p-4 border mb-4 ${currentTheme === "dark" ? "bg-[#0a0e27]/50 border-blue-500/20" : "bg-gray-50 border-gray-200"}`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className={`text-xs font-semibold ${currentTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Market</label>
                <Select value={selectedMarket} onValueChange={handleMarketChange}>
                  <SelectTrigger className={currentTheme === "dark" ? "bg-[#0a0e27] border-blue-500/30 text-white" : ""}>
                    <SelectValue placeholder="Select Market" />
                  </SelectTrigger>
                  <SelectContent className={currentTheme === "dark" ? "bg-[#0a0e27] border-blue-500/30 text-white" : ""}>
                    {markets.map((m) => (
                      <SelectItem key={m} value={m}>{m.replace(/_/g, " ").toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className={`text-xs font-semibold ${currentTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Submarket</label>
                <Select value={selectedSubmarket} onValueChange={handleSubmarketChange}>
                  <SelectTrigger className={currentTheme === "dark" ? "bg-[#0a0e27] border-blue-500/30 text-white" : ""}>
                    <SelectValue placeholder="Select Submarket" />
                  </SelectTrigger>
                  <SelectContent className={currentTheme === "dark" ? "bg-[#0a0e27] border-blue-500/30 text-white" : ""}>
                    {submarkets[selectedMarket]?.map((sm) => (
                      <SelectItem key={sm} value={sm}>{sm.replace(/_/g, " ").toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className={`text-xs font-semibold ${currentTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Symbol</label>
                <Select value={selectedSymbol} onValueChange={handleSymbolChange}>
                  <SelectTrigger className={currentTheme === "dark" ? "bg-[#0a0e27] border-blue-500/30 text-white font-bold" : ""}>
                    <SelectValue placeholder="Select Symbol" />
                  </SelectTrigger>
                  <SelectContent className={currentTheme === "dark" ? "bg-[#0a0e27] border-blue-500/30 text-white" : ""}>
                    {instruments[`${selectedMarket}_${selectedSubmarket}`]?.map((s) => (
                      <SelectItem key={s.symbol} value={s.symbol}>{s.display_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {currentTick !== null && (
            <div
              className={`p-4 rounded-lg border mb-4 ${currentTheme === "dark" ? "bg-linear-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30" : "bg-linear-to-r from-blue-50 to-purple-50 border-blue-200"}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div
                    className={`text-xs font-semibold mb-1 ${currentTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Current Tick Price
                  </div>
                  <div className={`text-2xl font-bold ${currentTheme === "dark" ? "text-blue-400" : "text-blue-600"}`}>
                    {currentTick.toFixed(4)}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-xs font-semibold mb-1 ${currentTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Timestamp
                  </div>
                  <div className={`text-sm ${currentTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                    {tickTimestamp}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-xs font-semibold mb-1 ${currentTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Symbol
                  </div>
                  <div
                    className={`text-sm font-bold ${currentTheme === "dark" ? "text-orange-400" : "text-orange-600"}`}
                  >
                    {selectedSymbol}
                  </div>
                </div>
              </div>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
            <TabsList
              className={`grid w-full grid-cols-4 mb-6 h-12 ${currentTheme === "dark" ? "bg-[#0a0e27]/50 border border-blue-500/20" : "bg-gray-100"}`}
            >
              <TabsTrigger
                value="manual"
                className="text-xs sm:text-sm font-semibold data-[state=active]:bg-blue-500 data-[state=active]:text-white gap-2"
              >
                <LayoutDashboard className="w-4 h-4 hidden sm:block" />
                Manual
              </TabsTrigger>
              <TabsTrigger
                value="autobot"
                className="text-xs sm:text-sm font-semibold data-[state=active]:bg-orange-500 data-[state=active]:text-white gap-2"
              >
                <Zap className="w-4 h-4 hidden sm:block" />
                Auto-Bot (Power)
              </TabsTrigger>
              <TabsTrigger
                value="risk"
                className="text-xs sm:text-sm font-semibold data-[state=active]:bg-indigo-500 data-[state=active]:text-white gap-2"
              >
                <ShieldCheck className="w-4 h-4 hidden sm:block" />
                Risk Planning
              </TabsTrigger>
              <TabsTrigger
                value="speedbot"
                className="text-xs sm:text-sm font-semibold data-[state=active]:bg-purple-500 data-[state=active]:text-white gap-2"
              >
                SpeedBot
              </TabsTrigger>
            </TabsList>

            <TabsContent value="autobot" className="space-y-6 mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <DigitPowerVisualizer snapshot={powerSnapshot} theme={currentTheme} />
                </div>
                <Card className="p-6 bg-black/40 border-white/5 backdrop-blur-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-orange-400">Bot Controls</h3>
                    <Button
                      variant={autoBotConfig.autoBotEnabled ? "destructive" : "default"}
                      size="sm"
                      onClick={() => setAutoBotConfig(prev => ({ ...prev, autoBotEnabled: !prev.autoBotEnabled }))}
                    >
                      {autoBotConfig.autoBotEnabled ? "STOP BOT" : "START BOT"}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500">STRATEGY</label>
                    <Select value={selectedStrategy} onValueChange={(v: any) => setSelectedStrategy(v)}>
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EVEN_ODD">Even / Odd Power</SelectItem>
                        <SelectItem value="OVER_UNDER">Over / Under Power</SelectItem>
                        <SelectItem value="DIFFERS">Smart Differs (2-7)</SelectItem>
                        <SelectItem value="MATCHES">High-Speed Matches</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500">STAKE ($)</label>
                      <Input
                        type="number"
                        value={autoBotConfig.stake}
                        onChange={(e) => setAutoBotConfig(prev => ({ ...prev, stake: Number(e.target.value) }))}
                        className="bg-white/5 border-white/10 h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500">MARTINGALE</label>
                      <Input
                        type="number"
                        value={autoBotConfig.martingale}
                        onChange={(e) => setAutoBotConfig(prev => ({ ...prev, martingale: Number(e.target.value) }))}
                        className="bg-white/5 border-white/10 h-8"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <p className="text-[10px] text-orange-400 leading-relaxed uppercase font-bold text-center">
                      {autoBotConfig.autoBotEnabled ? "Bot is scanning markets..." : "Configure & Start to Automate"}
                    </p>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="risk" className="mt-4">
              <RiskManagementTab />
            </TabsContent>

            <TabsContent value="manual" className="space-y-4 mt-4">
              <ManualTrader
                apiClient={apiClient}
                isAuthorized={isAuthorized}
                balance={balance}
                currency={currency}
                theme={currentTheme}
                activeSymbols={activeSymbols}
                contractsCache={contractsCache}
                journal={manualJournal}
                selectedSymbol={selectedSymbol}
              />
            </TabsContent>

            <TabsContent value="autorun" className="space-y-4 mt-4">
              <AutoRunBot
                apiClient={apiClient}
                isAuthorized={isAuthorized}
                balance={balance}
                currency={currency}
                theme={currentTheme}
                activeSymbols={activeSymbols}
                contractsCache={contractsCache}
                journal={autorunJournal}
                selectedSymbol={selectedSymbol}
              />
            </TabsContent>

            <TabsContent value="speedbot" className="space-y-4 mt-4">
              <SpeedBot
                apiClient={apiClient}
                isAuthorized={isAuthorized}
                balance={balance}
                currency={currency}
                theme={currentTheme}
                activeSymbols={activeSymbols}
                contractsCache={contractsCache}
                journal={speedbotJournal}
                selectedSymbol={selectedSymbol}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
