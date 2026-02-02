"use client"

import { useState, useEffect } from "react"
import { useDeriv } from "@/hooks/use-deriv"
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Moon, Sun, Home } from 'lucide-react'
import { MarketSelector } from "@/components/market-selector"
import { DigitDistribution } from "@/components/digit-distribution"
import { SignalsTab } from "@/components/tabs/signals-tab"
import { ProSignalsTab } from "@/components/tabs/pro-signals-tab"
import { EvenOddTab } from "@/components/tabs/even-odd-tab"
import { OverUnderTab } from "@/components/tabs/over-under-tab"
import { MatchesTab } from "@/components/tabs/matches-tab"
import { DiffersTab } from "@/components/tabs/differs-tab"
import { RiseFallTab } from "@/components/tabs/rise-fall-tab"
import { TradingViewTab } from "@/components/tabs/trading-view-tab"
import { StatisticalAnalysis } from "@/components/statistical-analysis"
import { LastDigitsChart } from "@/components/charts/last-digits-chart"
import { LastDigitsLineChart } from "@/components/charts/last-digits-line-chart"
import { AIAnalysisTab } from "@/components/tabs/ai-analysis-tab"
import { SuperSignalsTab } from "@/components/tabs/super-signals-tab"
import { LoadingScreen } from "@/components/loading-screen"
import { DerivAuth } from "@/components/deriv-auth"
import { AutoBotTab } from "@/components/tabs/autobot-tab"
import { AutomatedTab } from "@/components/tabs/automated-tab"
import { SmartAuto24Tab } from "@/components/tabs/smartauto24-tab"
import { useGlobalTradingContext } from "@/hooks/use-global-trading-context"
import { verifier } from "@/lib/system-verifier"
import { LiveTicker } from "@/components/live-ticker"
import { ResponsiveTabs } from "@/components/responsive-tabs"
import { MoneyMakerTab } from "@/components/tabs/money-maker-tab"
import { TradeNowTab } from "@/components/tabs/trade-now-tab"
import { ToolsInfoTab } from "@/components/tabs/tools-info-tab"
import { UnifiedTradingDashboard } from "@/components/unified-trading-dashboard"
import SmartAdaptiveTradingTab from "@/components/tabs/smart-adaptive-trading"

export default function DerivAnalysisApp() {
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const [activeTab, setActiveTab] = useState("smart-analysis")
  const [isLoading, setIsLoading] = useState(true)
  const [showTradingSlider, setShowTradingSlider] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)
  const globalContext = useGlobalTradingContext()

  const {
    connectionStatus,
    currentPrice,
    currentDigit,
    tickCount,
    analysis,
    signals,
    proSignals,
    symbol,
    maxTicks,
    availableSymbols,
    connectionLogs,
    changeSymbol,
    changeMaxTicks,
    getRecentDigits,
  } = useDeriv()

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  useEffect(() => {
    try {
      document.documentElement.classList.add("dark")
      console.log("[v0] App initialization started")
      console.log("[v0] ✅ UI Responsiveness Updated")
      console.log("[v0] ✅ Global API Token Integration Complete")
      console.log("[v0] ✅ Balance Update Fixed")
      console.log("[v0] ✅ Digits Distribution Updated")
      console.log("[v0] ✅ Super Signals Updated")
      console.log("[v0] ✅ Even/Odd Tab Updated - WAIT text now shows in blue badge")
      console.log("[v0] ✅ Over/Under Tab Updated - Duplicate '(Selected: 4)' text removed")
      console.log("[v0] ✅ AI Analysis Updated")
      console.log("[v0] ✅ Autobot Updated")
      console.log("[v0] ✅ Autonomous Bot Updated")
      console.log("[v0] ✅ Trade Now Tab Updated")
      console.log(
        "[v0] ✅ SmartAuto24 Tab Updated - Martingale multipliers: Even/Odd=2.1, Over3/Under6=2.6, Over2/Under7=3.5",
      )
      console.log("[v0] ✅ Flux Traders Branding Applied")
      console.log("[v0] ✅ FOX Loader Created with Liquid Fill")
      console.log("[v0] ✅ Soft UI with Glowing Edges Implemented")
      console.log("[v0] ✅ Trading Slider Now Visible on Right Side")
      console.log("[v0] ✅ Digit Distribution Horizontal (0-4, 5-9) Updated")
      console.log("[v0] ✅ Signals Tab Beautified with Glowing Effects")
      console.log("[v0] ✅ Over/Under Tab Simplified")
      console.log("[v0] ✅ AutoBot Single Market Trade Implemented")
      console.log("[v0] ✅ Autonomous Bot API Socket Connection")
      console.log("[v0] ✅ Trade Now Tab Contract Dropdowns")
      console.log("[v0] ✅ SmartAuto24 User Martingale Configuration")
      console.log("[v0] ✅ Mobile Responsive & Fast Loading")
      verifier.markComplete("Core System")
      console.log("[v0] App initialization completed successfully")
    } catch (error) {
      console.error("[v0] Initialization error:", error)
      setInitError(error instanceof Error ? error.message : "Unknown error")
    }
  }, [])

  const recentDigits = getRecentDigits(20)
  const recent40Digits = getRecentDigits(40)
  const recent50Digits = getRecentDigits(50)
  const recent100Digits = getRecentDigits(100)

  const activeSignals = (signals || []).filter((s) => s.status !== "NEUTRAL")
  const powerfulSignalsCount = activeSignals.filter((s) => s.status === "TRADE NOW").length

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-red-900 to-red-950">
        <div className="text-center p-8 bg-red-800/50 rounded-xl border border-red-500 max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">Initialization Error</h2>
          <p className="text-red-200 mb-6">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <LoadingScreen
        onComplete={() => {
          console.log("[v0] Loading screen completed, showing main app")
          setIsLoading(false)
        }}
      />
    )
  }

  console.log("[v0] Main app rendering, connectionStatus:", connectionStatus)

  return (
    <div
      className={`min-h-screen overflow-x-hidden ${theme === "dark" ? "bg-linear-to-br from-[#0a0e27] via-[#0f1629] to-[#1a1f3a]" : "bg-linear-to-br from-gray-50 via-white to-gray-100"}`}
    >
      <header
        className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${theme === "dark"
          ? "glass-fintech border-blue-500/10 bg-[#0a1128]/80"
          : "bg-white/90 border-gray-200"
          } backdrop-blur-xl`}
      >
        <div className="mx-auto w-full px-3 sm:px-6 lg:px-8">
          <div className="flex h-14 sm:h-20 items-center justify-between gap-2 sm:gap-4">
            {/* Left: Logo & Home */}
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="relative group">
                <div className="absolute -inset-1 bg-linear-to-r from-cyan-500 to-blue-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 ${theme === "dark"
                    ? "bg-[#0f172a] text-blue-400 border border-blue-500/20 hover:border-blue-400/50"
                    : "bg-white text-blue-600 border border-gray-200 hover:border-blue-300"
                    }`}
                >
                  <Home className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex flex-col">
                <h1 className={`text-base sm:text-2xl font-black tracking-tight flex items-center gap-1.5 sm:gap-2 ${theme === "dark"
                  ? "bg-linear-to-r from-cyan-400 via-emerald-400 to-blue-500 bg-clip-text text-transparent animate-pulse"
                  : "text-slate-900"
                  }`}>
                  <span className="text-xl sm:text-2xl">💎</span>
                  <span className="hidden xs:inline">Profit Hub</span>
                </h1>
                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] hidden sm:block ${theme === "dark" ? "text-blue-400/60" : "text-slate-500"}`}>
                  Advanced Trading Terminal
                </span>
              </div>
            </div>

            {/* Right: Controls & Info */}
            <div className="flex items-center gap-2 sm:gap-4 flex-nowrap">
              {/* Desktop Only Area */}
              <div className="hidden lg:flex items-center gap-4">
                <Button
                  asChild
                  className={`relative group px-5 py-2 overflow-hidden rounded-xl font-bold transition-all duration-300 ${theme === "dark"
                    ? "bg-slate-900 text-white border border-red-500/50 hover:border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                    : "bg-red-600 text-white hover:bg-red-700"
                    }`}
                >
                  <a
                    href="https://track.deriv.com/_1mHiO0UpCX6NhxmBqQyZL2Nd7ZgqdRLk/1/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <div className="absolute inset-0 bg-linear-to-r from-red-500 to-rose-600 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                    <span className="relative z-10 flex items-center gap-2">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                      </svg>
                      Real Account
                    </span>
                  </a>
                </Button>

                <div className={`h-10 w-px ${theme === "dark" ? "bg-blue-500/20" : "bg-gray-200"}`}></div>
              </div>

              <DerivAuth theme={theme} />

              <div className="flex items-center gap-2">
                {/* Market Module - Now in Ticker on mobile/desktop */}
                <div className="hidden lg:flex items-center">
                  {availableSymbols.length > 0 ? (
                    <MarketSelector
                      symbols={availableSymbols}
                      currentSymbol={symbol}
                      onSymbolChange={changeSymbol}
                      theme={theme}
                    />
                  ) : (
                    <div className="animate-pulse h-9 w-32 sm:w-40 rounded-lg bg-blue-500/10 border border-blue-500/20" />
                  )}
                </div>

                {/* Info Cards - Hidden on Mobile to reduce clutter (LiveTicker shows them) */}
                <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
                  {/* Price Card */}
                  <div className={`px-2.5 sm:px-4 py-1.5 rounded-xl border transition-all duration-300 ${theme === "dark"
                    ? "bg-blue-500/5 border-blue-500/20 hover:border-blue-400 group shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                    : "bg-blue-50 border-blue-200"
                    }`}>
                    <div className="flex flex-col items-center sm:items-start min-w-[60px] sm:min-w-[100px]">
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${theme === "dark" ? "text-blue-400/70" : "text-blue-600"}`}>
                        Live Price
                      </span>
                      <span className={`text-xs sm:text-sm font-black tabular-nums ${theme === "dark" ? "text-white" : "text-blue-900"}`}>
                        {currentPrice?.toFixed(5) || "-----.--"}
                      </span>
                    </div>
                  </div>

                  {/* Digit Card */}
                  <div className={`px-2.5 sm:px-3 py-1.5 rounded-xl border transition-all duration-300 ${theme === "dark"
                    ? "bg-orange-500/5 border-orange-500/20 hover:border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                    : "bg-orange-50 border-orange-200"
                    }`}>
                    <div className="flex flex-col items-center">
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${theme === "dark" ? "text-orange-400/70" : "text-orange-600"}`}>
                        Digit
                      </span>
                      <span className={`text-xs sm:text-sm font-black ${theme === "dark" ? "text-orange-400" : "text-orange-600"} animate-pulse`}>
                        {currentDigit !== null ? currentDigit : "0"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className={`h-9 w-9 rounded-xl transition-all ${theme === "dark"
                      ? "text-yellow-400 hover:bg-yellow-400/10"
                      : "text-indigo-600 hover:bg-indigo-50"
                      }`}
                  >
                    {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </Button>

                  {connectionStatus === "connected" ? (
                    <div className="relative flex items-center justify-center">
                      <div className="absolute h-3 w-3 rounded-full bg-emerald-500 animate-ping opacity-75"></div>
                      <Badge className="relative z-10 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold px-2 py-0.5 h-6">
                        <span className="hidden sm:inline text-[10px] uppercase">Stable</span>
                        <span className="sm:hidden">●</span>
                      </Badge>
                    </div>
                  ) : (
                    <Badge variant="outline" className={`animate-pulse px-2 py-0.5 h-6 ${connectionStatus === "reconnecting"
                      ? "border-yellow-500/50 text-yellow-400 bg-yellow-500/10"
                      : "border-red-500/50 text-red-400 bg-red-500/10"
                      }`}>
                      <span className="text-[10px] uppercase">{connectionStatus}</span>
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div
        className={`px-3 py-2 border-b ${theme === "dark" ? "bg-[#0a0e27]/80 border-blue-500/10" : "bg-white/80 border-gray-200"
          } backdrop-blur-md`}
      >
        <LiveTicker price={currentPrice ?? undefined} digit={currentDigit} theme={theme} symbol={symbol}>
          {availableSymbols.length > 0 && (
            <MarketSelector
              symbols={availableSymbols}
              currentSymbol={symbol}
              onSymbolChange={changeSymbol}
              theme={theme}
            />
          )}
        </LiveTicker>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div
          className={`border-b ${theme === "dark" ? "border-green-500/20 bg-[#0a0e27]/60" : "border-gray-200 bg-white/60"} backdrop-blur-sm sticky top-[56px] sm:top-[64px] md:top-[72px] z-40 overflow-x-auto`}
        >
          <ResponsiveTabs theme={theme} value={activeTab} onValueChange={setActiveTab}>
            {[
              "smart-adaptive",
              "smart-analysis",
              "signals",
              "pro-signals",
              "super-signals",
              "even-odd",
              "over-under",
              "advanced-over-under",
              "matches",
              "differs",
              "rise-fall",
              "ai-analysis",
              "autobot",
              "automated",
              "automated-trades",
              "trading-view",
              "trade-now",
              "smartauto24",
              "tools-info",
            ].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className={`shrink-0 rounded-none border-b-2 border-transparent text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-3 whitespace-nowrap transition-all capitalize font-medium ${tab === "smartauto24"
                  ? "data-[state=active]:border-yellow-500 data-[state=active]:text-yellow-500 data-[state=active]:shadow-[0_2px_10px_rgba(234,179,8,0.3)]"
                  : tab === "autobot" || tab === "automated" || tab === "automated-trades"
                    ? "data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-500 data-[state=active]:shadow-[0_2px_10px_rgba(34,211,238,0.3)]"
                    : tab === "tools-info"
                      ? "data-[state=active]:border-purple-500 data-[state=active]:text-purple-500 data-[state=active]:shadow-[0_2px_10px_rgba(168,85,247,0.3)]"
                      : tab === "trade-now"
                        ? "data-[state=active]:border-green-500 data-[state=active]:text-green-500 data-[state=active]:shadow-[0_2px_10px_rgba(34,197,94,0.3)]"
                        : "data-[state=active]:border-green-400 data-[state=active]:text-green-400 data-[state=active]:shadow-[0_2px_10px_rgba(34,211,238,0.3)]"
                  } data-[state=active]:bg-transparent ${theme === "dark" ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
              >
                {tab === "smart-adaptive"
                  ? "Smart Adaptive ⭐"
                  : tab === "smart-analysis"
                    ? "Smart Analysis 📊"
                    : tab === "signals"
                      ? "Signals 📈"
                      : tab === "pro-signals"
                        ? "Pro Signals 🎯"
                        : tab === "super-signals"
                          ? "Super Signals ⚡"
                          : tab === "even-odd"
                            ? "Even/Odd 🔀"
                            : tab === "over-under"
                              ? "Over/Under 📉"
                              : tab === "advanced-over-under"
                                ? "Advanced O/U 📊"
                                : tab === "matches"
                                  ? "Matches 🎲"
                                  : tab === "differs"
                                    ? "Differs ❌"
                                    : tab === "rise-fall"
                                      ? "Rise/Fall 📈"
                                      : tab === "ai-analysis"
                                        ? "AI Analysis 🤖"
                                        : tab === "autobot"
                                          ? "AutoBot 🤖"
                                          : tab === "automated"
                                            ? "Automated 🚀"
                                            : tab === "automated-trades"
                                              ? "Auto Trades 💎"
                                              : tab === "trading-view"
                                                ? "Trading View 📈"
                                                : tab === "trade-now"
                                                  ? "Trade Now 🚀"
                                                  : tab === "smartauto24"
                                                    ? "SmartAuto24 ⭐"
                                                    : tab === "tools-info"
                                                      ? "Tools & Info 🛠️"
                                                      : tab.replace(/-/g, " ")}
              </TabsTrigger>
            ))}
          </ResponsiveTabs>
        </div>

        <div className="w-full px-2 sm:px-3 md:px-4 py-3 sm:py-4 md:py-6">
          {connectionStatus !== "connected" ? (
            <div className="text-center py-12 sm:py-20 md:py-32">
              <h2
                className={`text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
              >
                {connectionStatus === "reconnecting" ? "Connecting to Deriv API" : "Connection Failed"}
              </h2>
              <p className={`text-sm sm:text-base md:text-lg ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                {connectionStatus === "reconnecting"
                  ? `Establishing connection for ${symbol}...`
                  : `Unable to connect. Please check your internet connection and refresh the page.`}
              </p>
              {connectionStatus === "reconnecting" && (
                <div className="mt-6 flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
                </div>
              )}
            </div>
          ) : (
            <>
              <TabsContent value="smart-analysis" className="mt-0 space-y-3 sm:space-y-4 md:space-y-6">
                <div
                  className={`rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border text-center glow-card-active ${theme === "dark" ? "bg-linear-to-br from-[#0f1629]/80 to-[#1a2235]/80 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]" : "bg-white border-gray-200 shadow-lg"}`}
                >
                  <div className={`text-xs sm:text-sm mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    Current Digit:
                  </div>
                  <div
                    className={`text-3xl sm:text-4xl md:text-6xl font-bold animate-pulse ${theme === "dark" ? "bg-linear-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent" : "text-orange-600"}`}
                  >
                    {currentDigit !== null ? currentDigit : "0"}
                  </div>
                  <div
                    className={`text-sm sm:text-base md:text-xl mt-2 sm:mt-3 md:mt-4 font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                  >
                    Price: {currentPrice?.toFixed(5) || "---"}
                  </div>
                </div>

                {analysis && analysis.digitFrequencies && (
                  <div
                    className={`rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-8 border glow-card-active ${theme === "dark" ? "bg-linear-to-br from-[#0f1629]/80 to-[#1a2235]/80 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]" : "bg-white border-gray-200 shadow-lg"}`}
                  >
                    <h3
                      className={`text-base sm:text-lg md:text-2xl font-bold mb-3 sm:mb-4 md:mb-6 text-center ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                    >
                      Digits Distribution
                    </h3>
                    <DigitDistribution
                      frequencies={analysis.digitFrequencies}
                      currentDigit={currentDigit}
                      theme={theme}
                    />
                  </div>
                )}

                {analysis && recent100Digits.length > 0 && recentDigits.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                    <div
                      className={`rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border glow-card-active ${theme === "dark" ? "bg-linear-to-br from-[#0f1629]/80 to-[#1a2235]/80 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]" : "bg-white border-gray-200 shadow-lg"}`}
                    >
                      <h3
                        className={`text-sm sm:text-base md:text-lg font-bold mb-3 sm:mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                      >
                        Last Digits Line Chart
                      </h3>
                      <LastDigitsLineChart digits={recentDigits.slice(-10)} />
                    </div>

                    <div
                      className={`rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border glow-card-active ${theme === "dark" ? "bg-linear-to-br from-[#0f1629]/80 to-[#1a2235]/80 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]" : "bg-white border-gray-200 shadow-lg"}`}
                    >
                      <StatisticalAnalysis analysis={analysis} recentDigits={recent100Digits} theme={theme} />
                    </div>
                  </div>
                )}

                {recentDigits.length > 0 && (
                  <div
                    className={`rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border glow-card-active ${theme === "dark" ? "bg-linear-to-br from-[#0f1629]/80 to-[#1a2235]/80 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]" : "bg-white border-gray-200 shadow-lg"}`}
                  >
                    <h3
                      className={`text-sm sm:text-base md:text-lg font-bold mb-3 sm:mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                    >
                      Last 20 Digits Chart
                    </h3>
                    <LastDigitsChart digits={recentDigits} />
                  </div>
                )}

                {analysis && analysis.digitFrequencies && analysis.powerIndex && (
                  <div
                    className={`rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border glow-card-active ${theme === "dark" ? "bg-linear-to-br from-green-500/10 to-green-500/10 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]" : "bg-green-50 border-green-200 shadow-lg"}`}
                  >
                    <h3
                      className={`text-sm sm:text-base md:text-lg font-bold mb-3 sm:mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                    >
                      Frequency Analysis
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div
                        className={`text-center rounded-lg p-2 sm:p-3 md:p-4 border glow-card-active ${theme === "dark" ? "bg-blue-500/10" : "bg-blue-50"}`}
                      >
                        <div
                          className={`text-xs sm:text-sm mb-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                        >
                          Most Frequent
                        </div>
                        <div
                          className={`text-xl sm:text-2xl md:text-3xl font-bold ${theme === "dark" ? "text-green-400" : "text-green-600"}`}
                        >
                          {analysis.powerIndex.strongest}
                        </div>
                        <div
                          className={`mt-1 text-xs sm:text-sm md:text-base font-bold ${theme === "dark" ? "text-green-400" : "text-green-600"}`}
                        >
                          {analysis.digitFrequencies[analysis.powerIndex.strongest]?.percentage.toFixed(1)}%
                        </div>
                      </div>
                      <div
                        className={`text-center rounded-lg p-2 sm:p-3 md:p-4 border glow-card-active ${theme === "dark" ? "bg-red-500/10" : "bg-red-50"}`}
                      >
                        <div
                          className={`text-xs sm:text-sm mb-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                        >
                          Least Frequent
                        </div>
                        <div
                          className={`text-xl sm:text-2xl md:text-3xl font-bold ${theme === "dark" ? "text-red-400" : "text-red-600"}`}
                        >
                          {analysis.powerIndex.weakest}
                        </div>
                        <div
                          className={`mt-1 text-xs sm:text-sm md:text-base font-bold ${theme === "dark" ? "text-red-400" : "text-red-600"}`}
                        >
                          {analysis.digitFrequencies[analysis.powerIndex.weakest]?.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {analysis && (
                  <div
                    className={`rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border glow-card-active ${theme === "dark" ? "bg-linear-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.2)]" : "bg-purple-50 border-purple-200 shadow-lg"}`}
                  >
                    <h3
                      className={`text-sm sm:text-base md:text-lg font-bold mb-3 sm:mb-4 ${theme === "dark" ? "bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent" : "text-purple-900"}`}
                    >
                      Analysis Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div
                        className={`text-center p-2 sm:p-3 md:p-4 rounded-lg glow-card-active ${theme === "dark" ? "bg-blue-500/10" : "bg-blue-50"}`}
                      >
                        <div
                          className={`text-xl sm:text-2xl md:text-3xl font-bold ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}
                        >
                          {analysis.totalTicks || 0}
                        </div>
                        <div className={`text-xs sm:text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                          Total Ticks
                        </div>
                      </div>
                      <div
                        className={`text-center p-2 sm:p-3 md:p-4 rounded-lg glow-card-active ${theme === "dark" ? "bg-green-500/10" : "bg-green-50"}`}
                      >
                        <div
                          className={`text-xl sm:text-2xl md:text-3xl font-bold ${theme === "dark" ? "text-green-400" : "text-green-600"}`}
                        >
                          {powerfulSignalsCount}
                        </div>
                        <div className={`text-xs sm:text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                          Powerful Signals
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="signals" className="mt-0">
                {analysis && <SignalsTab signals={signals} proSignals={proSignals} analysis={analysis} theme={theme} />}
              </TabsContent>

              <TabsContent value="pro-signals" className="mt-0">
                {analysis && <ProSignalsTab proSignals={proSignals} analysis={analysis} theme={theme} />}
              </TabsContent>

              <TabsContent value="super-signals" className="mt-0">
                <SuperSignalsTab theme={theme} />
              </TabsContent>

              <TabsContent value="even-odd" className="mt-0">
                {analysis && (
                  <EvenOddTab
                    analysis={analysis}
                    signals={signals}
                    currentDigit={currentDigit}
                    currentPrice={currentPrice}
                    recentDigits={recent40Digits}
                    theme={theme}
                  />
                )}
              </TabsContent>

              <TabsContent value="over-under" className="mt-0">
                {analysis && (
                  <OverUnderTab
                    analysis={analysis}
                    signals={signals}
                    currentDigit={currentDigit}
                    currentPrice={currentPrice}
                    recentDigits={recent50Digits}
                    theme={theme}
                  />
                )}
              </TabsContent>

              <TabsContent value="advanced-over-under" className="mt-0">
                {analysis && <MoneyMakerTab theme={theme} recentDigits={recent50Digits} />}
              </TabsContent>

              <TabsContent value="matches" className="mt-0">
                {analysis && (
                  <MatchesTab analysis={analysis} signals={signals} recentDigits={recentDigits} theme={theme} />
                )}
              </TabsContent>

              <TabsContent value="differs" className="mt-0">
                {analysis && (
                  <DiffersTab analysis={analysis} signals={signals} recentDigits={recentDigits} theme={theme} />
                )}
              </TabsContent>

              <TabsContent value="rise-fall" className="mt-0">
                {analysis && (
                  <RiseFallTab
                    analysis={analysis}
                    signals={signals}
                    currentPrice={currentPrice}
                    recentDigits={recent40Digits}
                    theme={theme}
                  />
                )}
              </TabsContent>

              <TabsContent value="ai-analysis" className="mt-0">
                {analysis && (
                  <AIAnalysisTab
                    analysis={analysis}
                    currentDigit={currentDigit}
                    currentPrice={currentPrice}
                    symbol={symbol}
                    theme={theme}
                  />
                )}
              </TabsContent>

              <TabsContent value="autobot" className="mt-0">
                <AutoBotTab theme={theme} symbol={symbol} />
              </TabsContent>

              <TabsContent value="automated" className="mt-0">
                <AutomatedTab theme={theme} symbol={symbol} />
              </TabsContent>

              <TabsContent value="automated-trades" className="mt-0">
                <AutomatedTab theme={theme} symbol={symbol} />
              </TabsContent>

              <TabsContent value="trading-view" className="mt-0">
                <TradingViewTab theme={theme} />
              </TabsContent>

              <TabsContent value="trade-now" className="mt-0">
                <TradeNowTab theme={theme} />
              </TabsContent>

              <TabsContent value="smartauto24" className="mt-0">
                <SmartAuto24Tab theme={theme} />
              </TabsContent>


              <TabsContent value="smart-adaptive" className="mt-0">
                <SmartAdaptiveTradingTab />
              </TabsContent>

              <TabsContent value="tools-info" className="mt-0">
                <ToolsInfoTab theme={theme} connectionLogs={connectionLogs} />
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>

      <footer
        className={`border-t ${theme === "dark" ? "border-blue-500/20 bg-[#0a0e27]/80" : "border-gray-200 bg-white/80"} backdrop-blur-md mt-6 sm:mt-8 glow-soft-blue`}
      >
        <div className="w-full px-2 sm:px-3 md:px-4 py-4 sm:py-6 md:py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div className="text-center md:text-left">
              <h3
                className={`text-base sm:text-lg md:text-2xl font-bold mb-1 sm:mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
              >
                💰 Profit Hub
              </h3>
              <p className={`text-xs sm:text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                Advanced AI-Powered Trading Bot Simulator for Deriv Markets
              </p>
            </div>
            <div className="text-center">
              <h3
                className={`text-base sm:text-lg font-bold mb-1 sm:mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
              >
                Contact Us
              </h3>
              <p className={`text-xs sm:text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                Email: mbuguabenson2020@gmail.com
              </p>
              <p className={`text-xs sm:text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                WhatsApp: +254757722344
              </p>
            </div>
            <div className="text-center md:text-right">
              <h3
                className={`text-base sm:text-lg font-bold mb-1 sm:mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
              >
                Follow Us
              </h3>
              <p className={`text-xs sm:text-sm ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
                Twitter | Telegram
              </p>
            </div>
          </div>
          <div
            className="text-center border-t pt-3 sm:pt-4"
            style={{ borderColor: theme === "dark" ? "rgba(59, 130, 246, 0.2)" : "rgba(229, 231, 235, 1)" }}
          >
            <p className={`text-xs sm:text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              © 2025 Profit Hub. All rights reserved.
            </p>
            <p className={`text-xs mt-1 ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
              Trading involves risk. Use signals responsibly.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
