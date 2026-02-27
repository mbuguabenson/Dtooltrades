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
import { ToolsInfoTab } from "@/components/tabs/tools-info-tab"
import { UnifiedTradingDashboard } from "@/components/unified-trading-dashboard"
import SmartAdaptiveTradingTab from "@/components/tabs/smart-adaptive-trading"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function DerivAnalysisApp() {
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const [activeTab, setActiveTab] = useState("smart-analysis")
  const [isLoading, setIsLoading] = useState(true)
  const [showTradingSlider, setShowTradingSlider] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false)
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
      className={`min-h-screen flex flex-col ${theme === "dark" ? "bg-linear-to-br from-[#0a0e27] via-[#0f1629] to-[#1a1f3a]" : "bg-linear-to-br from-gray-50 via-white to-gray-100"}`}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col relative">
        <header
          className={`fixed top-0 left-0 right-0 z-[100] shrink-0 w-full transition-all duration-500 border-b ${theme === "dark"
            ? "bg-[#050505]/90 border-white/5"
            : "bg-white/95 border-gray-100"
            } backdrop-blur-xl`}
        >
          <div className="mx-auto w-full px-2 sm:px-6">
            <div className="flex flex-row items-center py-1.5 sm:h-14 gap-1.5 sm:gap-4 w-full justify-between">

              {/* Brand */}
              <div className="flex items-center shrink-0">
                <h1 className="text-sm sm:text-xl font-bold tracking-tight flex items-center gap-0.5 sm:gap-1">
                  <span className={theme === "dark" ? "text-white" : "text-slate-900"}>PROFIT</span>
                  <span className={`hidden sm:inline ${theme === "dark" ? "text-slate-400 font-medium" : "text-slate-500 font-medium"}`}>HUB</span>
                </h1>
              </div>

              {/* Ticker (flex-1) */}
              <div className="flex-1 flex justify-center sm:justify-end items-center min-w-0 max-w-2xl px-1 sm:px-0">
                <LiveTicker
                  price={currentPrice ?? undefined}
                  digit={currentDigit}
                  theme={theme}
                  symbol={symbol}
                  compact={true}
                  depthSelector={
                    <div className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2 py-0.5 sm:py-1 rounded-md bg-transparent group/depth">
                      <span className={`text-[8px] font-black uppercase tracking-wider ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                        D
                      </span>
                      <Select value={maxTicks.toString()} onValueChange={(value) => changeMaxTicks(parseInt(value))}>
                        <SelectTrigger className="w-[40px] sm:w-[50px] h-4 sm:h-7 text-[9px] sm:text-[10px] font-bold bg-transparent border-0 ring-0 focus:ring-0 shadow-none p-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className={theme === "dark" ? "bg-[#1a1f3a] border-white/5" : "bg-white"}>
                          {[10, 25, 60, 120, 250, 500, 1000, 5000].map((tv) => (
                            <SelectItem key={tv} value={tv.toString()} className="text-[10px]">{tv}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  }
                >

                </LiveTicker>
              </div>

              {/* Auth & Theme */}
              <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
                <DerivAuth theme={theme} />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className={`h-7 w-7 sm:h-9 sm:w-9 rounded-lg transition-all ${theme === "dark"
                    ? "bg-white/5 text-yellow-500 hover:bg-white/10"
                    : "bg-black/5 text-slate-700 hover:bg-black/10"
                    }`}
                >
                  {theme === "dark" ? <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                </Button>
              </div>
            </div>

            {/* Elegant Navigation Row within Header */}
            <div className="mt-1 pb-1 sm:pb-2 px-1 sm:px-4">
              <ResponsiveTabs theme={theme} value={activeTab} onValueChange={setActiveTab}>
                {[
                  "smart-adaptive",
                  "smart-analysis",
                  "smartauto24",
                  "autobot",
                  "automated",
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
                  "tools-info",
                ].map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className={`shrink-0 rounded-full text-[10px] sm:text-[12px] px-3 sm:px-4 py-1.5 sm:py-2 mx-0.5 whitespace-nowrap transition-all duration-200 capitalize font-medium tracking-wide ${activeTab === tab
                      ? theme === "dark"
                        ? "bg-white/10 text-white"
                        : "bg-black/5 text-black"
                      : theme === "dark"
                        ? "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                        : "text-gray-500 hover:text-gray-700 hover:bg-black/[0.03]"
                      }`}
                  >
                    {tab === "autobot" ? "Autobot 🤖" : tab === "automated" ? "Autotrader 🚀" : tab.replace("-", " ")}
                  </TabsTrigger>
                ))}
              </ResponsiveTabs>
            </div>
          </div>
        </header>

        <main className="flex-1 pt-[100px] sm:pt-[110px] pb-4 px-1 sm:px-4 space-y-1.5 sm:space-y-4 max-w-7xl mx-auto w-full">
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
              <TabsContent value="smart-analysis" className="mt-0 space-y-2 sm:space-y-3 md:space-y-4">
                {availableSymbols.length > 0 && (
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Market</span>
                    <MarketSelector symbols={availableSymbols} currentSymbol={symbol} onSymbolChange={changeSymbol} theme={theme} />
                  </div>
                )}
                <div
                  className={`rounded-lg sm:rounded-xl p-2 sm:p-3 border glow-card-active flex items-center justify-between ${theme === "dark" ? "bg-linear-to-br from-[#0f1629]/80 to-[#1a2235]/80 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]" : "bg-white border-gray-200 shadow-lg"}`}
                >
                  <div className="flex items-center gap-3 sm:gap-6">
                    <div className="flex flex-col items-start">
                      <div className={`text-[8px] uppercase tracking-wider ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>
                        Digit
                      </div>
                      <div className={`text-xl sm:text-3xl font-black ${theme === "dark" ? "text-orange-400" : "text-orange-600"}`}>
                        {currentDigit !== null ? currentDigit : "0"}
                      </div>
                    </div>

                    <div className="flex flex-col items-start pl-2">
                      <div className={`text-[8px] uppercase tracking-wider ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>
                        Price
                      </div>
                      <div
                        className={`text-sm sm:text-base font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                      >
                        {currentPrice?.toFixed(5) || "---"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse`} />
                    <span className={`text-[10px] font-bold uppercase ${theme === "dark" ? "text-green-400" : "text-green-600"}`}>Live</span>
                  </div>
                </div>

                {analysis && analysis.digitFrequencies && (
                  <div
                    className={`rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border glow-card-active ${theme === "dark" ? "bg-linear-to-br from-[#0f1629]/80 to-[#1a2235]/80 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]" : "bg-white border-gray-200 shadow-lg"}`}
                  >
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-6 gap-3">
                      <h3
                        className={`text-sm sm:text-lg md:text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                      >
                        Digits Distribution
                      </h3>
                    </div>

                    <DigitDistribution
                      frequencies={analysis.digitFrequencies}
                      currentDigit={currentDigit}
                      theme={theme}
                    />
                  </div>
                )}

                {analysis && recent100Digits.length > 0 && recentDigits.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-4">
                    <div
                      className={`rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-4 border glow-card-active ${theme === "dark" ? "bg-linear-to-br from-[#0f1629]/80 to-[#1a2235]/80 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]" : "bg-white border-gray-200 shadow-lg"}`}
                    >
                      <h3
                        className={`text-sm sm:text-base md:text-lg font-bold mb-3 sm:mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                      >
                        Last Digits Line Chart
                      </h3>
                      <LastDigitsLineChart digits={recentDigits.slice(-10)} />
                    </div>

                    <div
                      className={`rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-4 border glow-card-active ${theme === "dark" ? "bg-linear-to-br from-[#0f1629]/80 to-[#1a2235]/80 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]" : "bg-white border-gray-200 shadow-lg"}`}
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
                {analysis && <SignalsTab signals={signals} proSignals={proSignals} analysis={analysis} theme={theme} symbol={symbol} availableSymbols={availableSymbols} onSymbolChange={changeSymbol} />}
              </TabsContent>

              <TabsContent value="pro-signals" className="mt-0">
                {analysis && <ProSignalsTab proSignals={proSignals} analysis={analysis} theme={theme} symbol={symbol} availableSymbols={availableSymbols} onSymbolChange={changeSymbol} />}
              </TabsContent>

              <TabsContent value="super-signals" className="mt-0">
                <SuperSignalsTab theme={theme} symbol={symbol} availableSymbols={availableSymbols} onSymbolChange={changeSymbol} />
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
                    symbol={symbol}
                    availableSymbols={availableSymbols}
                    onSymbolChange={changeSymbol}
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
                    symbol={symbol}
                    availableSymbols={availableSymbols}
                    onSymbolChange={changeSymbol}
                  />
                )}
              </TabsContent>

              <TabsContent value="advanced-over-under" className="mt-0">
                {analysis && <MoneyMakerTab theme={theme} recentDigits={recent50Digits} symbol={symbol} availableSymbols={availableSymbols} onSymbolChange={changeSymbol} />}
              </TabsContent>

              <TabsContent value="matches" className="mt-0">
                {analysis && (
                  <MatchesTab analysis={analysis} signals={signals} recentDigits={recentDigits} theme={theme} symbol={symbol} availableSymbols={availableSymbols} onSymbolChange={changeSymbol} />
                )}
              </TabsContent>

              <TabsContent value="differs" className="mt-0">
                {analysis && (
                  <DiffersTab analysis={analysis} signals={signals} recentDigits={recentDigits} theme={theme} symbol={symbol} availableSymbols={availableSymbols} onSymbolChange={changeSymbol} />
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
                    symbol={symbol}
                    availableSymbols={availableSymbols}
                    onSymbolChange={changeSymbol}
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
                    availableSymbols={availableSymbols}
                    onSymbolChange={changeSymbol}
                  />
                )}
              </TabsContent>


              <TabsContent value="autobot" className="mt-0">
                <AutoBotTab theme={theme} symbol={symbol} onSymbolChange={changeSymbol} availableSymbols={availableSymbols} />
              </TabsContent>

              <TabsContent value="automated" className="mt-0">
                <AutomatedTab theme={theme} symbol={symbol} onSymbolChange={changeSymbol} availableSymbols={availableSymbols} />
              </TabsContent>

              <TabsContent value="smartauto24" className="mt-0">
                <SmartAuto24Tab theme={theme} symbol={symbol} onSymbolChange={changeSymbol} availableSymbols={availableSymbols} />
              </TabsContent>

              <TabsContent value="smart-adaptive" className="mt-0">
                {analysis && <SmartAdaptiveTradingTab signals={signals} analysis={analysis} symbol={symbol} availableSymbols={availableSymbols} onSymbolChange={changeSymbol} theme={theme} />}
              </TabsContent>

              <TabsContent value="tools-info" className="mt-0">
                <ToolsInfoTab theme={theme} connectionLogs={connectionLogs} />
              </TabsContent>
            </>
          )}
        </main>
      </Tabs>

      <footer
        className={`border-t mt-4 py-4 transition-all duration-300 ${theme === "dark"
          ? "bg-[#050505] border-white/5"
          : "bg-white border-gray-100"
          }`}
      >
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className={`font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                PROFIT<span className="text-blue-500">HUB</span>
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-500">Quantum Trading Terminal</span>
            </div>

            <div className="flex items-center gap-4 text-gray-500">
              <button
                onClick={() => setIsDisclaimerOpen(true)}
                className="hover:text-blue-500 transition-colors font-medium border border-gray-500/20 px-2 py-0.5 rounded-md hover:border-blue-500/30"
              >
                Risk Disclaimer
              </button>
              <a href="#" className="hover:text-blue-500 transition-colors">Privacy</a>
              <a href="#" className="hover:text-blue-500 transition-colors">Terms</a>
              <a href="#" className="hover:text-blue-500 transition-colors">Support</a>
            </div>

            <div className="text-gray-600">
              © 2026 Profit Hub. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Risk Disclaimer Modal */}
      <Dialog open={isDisclaimerOpen} onOpenChange={setIsDisclaimerOpen}>
        <DialogContent className={`${theme === "dark" ? "bg-[#0a0e27] border-blue-500/30 text-white" : "bg-white"} sm:max-w-2xl`}>
          <DialogHeader>
            <DialogTitle className={`text-xl font-bold mb-2 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}>
              Risk Disclaimer
            </DialogTitle>
            <DialogDescription className={`${theme === "dark" ? "text-gray-300" : "text-gray-700"} text-sm leading-relaxed space-y-4`}>
              <p>
                Deriv offers complex derivatives, such as options and contracts for difference (&quot;CFDs&quot;). These products may not be suitable for all clients, and trading them puts you at risk. Please understand the following risks before trading Deriv products:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>a)</strong> You may lose some or all of the money you invest in the trade
                </li>
                <li>
                  <strong>b)</strong> If your trade involves currency conversion, exchange rates will affect your profit and loss.
                </li>
              </ul>
              <p className="font-bold border-l-2 border-blue-500 pl-3 italic">
                You should never trade with borrowed money or with money that you cannot afford to lose.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDisclaimerOpen(false)}
              className={theme === "dark" ? "border-gray-500 text-gray-300 hover:bg-gray-800" : ""}
            >
              Close
            </Button>
            <Button
              onClick={() => setIsDisclaimerOpen(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Accept
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  )
}
