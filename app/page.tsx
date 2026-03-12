"use client"

import { useState, useEffect } from "react"
import { useDeriv } from "@/hooks/use-deriv"
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Moon, Sun, User, AlertTriangle, Menu } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from 'next/link'
import { DigitDistribution } from "@/components/digit-distribution"
import { SignalsTab } from "@/components/tabs/signals-tab"
import { ProSignalsTab } from "@/components/tabs/pro-signals-tab"
import { EvenOddTab } from "@/components/tabs/even-odd-tab"
import { OverUnderTab } from "@/components/tabs/over-under-tab"
import { TabMarketBar } from "@/components/tab-market-bar"
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
import { ResponsiveTabs } from "@/components/responsive-tabs"
import { MoneyMakerTab } from "@/components/tabs/money-maker-tab"
import { ToolsInfoTab } from "@/components/tabs/tools-info-tab"
import SmartAdaptiveTradingTab from "@/components/tabs/smart-adaptive-trading"
import { RiskDisclaimerModal } from "@/components/modals/risk-disclaimer-modal"
import { MarketSelector } from "@/components/market-selector"
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
  const [initError, setInitError] = useState<string | null>(null)
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false)
  const [showRiskModal, setShowRiskModal] = useState(false)
  const [siteConfig, setSiteConfig] = useState<any>(null)
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
  } = useDeriv("R_100")

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
      verifier.markComplete("Core System")
      console.log("[v0] App initialization completed successfully")
    } catch (error) {
      console.error("[v0] Initialization error:", error)
      setInitError(error instanceof Error ? error.message : "Unknown error")
    }

    // Check for risk acceptance
    const accepted = localStorage.getItem("deriv_risk_accepted")
    if (!accepted) {
      setShowRiskModal(true)
    }

    // Fetch site config
    fetch("/api/admin/site-config")
      .then(r => r.json())
      .then(setSiteConfig)
      .catch(console.error)
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

  return (
    <div
      className={`min-h-screen flex flex-col ${theme === "dark" ? "bg-linear-to-br from-[#0a0e27] via-[#0f1629] to-[#1a1f3a]" : "bg-linear-to-br from-gray-50 via-white to-gray-100"}`}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col relative">
        {!siteConfig?.headerHidden && (
          <header
            className={`fixed top-0 left-0 right-0 z-[100] shrink-0 w-full transition-all duration-500 border-b ${theme === "dark"
              ? "bg-[#050505]/90 border-white/5"
              : "bg-white/95 border-gray-100"
              } backdrop-blur-xl`}
          >
            <div className="mx-auto w-full px-2 sm:px-6">
              <div className="flex flex-nowrap items-center py-1.5 h-auto sm:h-14 gap-1.5 sm:gap-2 w-full justify-between">

                {/* Brand Logo only on mobile, full text on desktop */}
                <div className="flex items-center shrink-0">
                  <h1 className="text-sm sm:text-xl font-bold tracking-tight flex items-center gap-0.5 sm:gap-1">
                    <span className={`hidden sm:inline ${theme === "dark" ? "text-white" : "text-slate-900"}`}>PROFIT</span>
                    <span className={`hidden sm:inline ${theme === "dark" ? "text-slate-400 font-medium" : "text-slate-500 font-medium"}`}>HUB</span>
                    <span className={`sm:hidden ${theme === "dark" ? "text-white" : "text-slate-900"}`}>PH</span>
                  </h1>
                </div>

                {/* Centralized Market Selector + Live Price */}
                <div className="order-none w-auto flex-1 flex justify-center items-center min-w-0 max-w-2xl px-0.5 sm:px-2 gap-1.5 sm:gap-2">
                  {/* Market Selector */}
                  {availableSymbols.length > 0 && (
                    <div className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-xl border transition-all ${theme === "dark"
                      ? "bg-white/5 border-white/10 hover:border-blue-500/30"
                      : "bg-gray-50 border-gray-200 hover:border-blue-400"
                      }`}>
                      <span className={`text-[9px] font-black uppercase tracking-widest hidden sm:inline ${theme === "dark" ? "text-slate-500" : "text-gray-400"
                        }`}>Market</span>
                      <MarketSelector
                        symbols={availableSymbols}
                        currentSymbol={symbol}
                        onSymbolChange={changeSymbol}
                        theme={theme}
                      />
                    </div>
                  )}

                  {/* Live Price + Digit */}
                  {currentPrice !== null && currentPrice !== undefined && (
                    <div className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 rounded-xl border ${theme === "dark"
                      ? "bg-white/5 border-white/10"
                      : "bg-gray-50 border-gray-200"
                      }`}>
                      <div className="text-center">
                        <p className={`text-[8px] font-bold uppercase tracking-widest ${theme === "dark" ? "text-slate-500" : "text-gray-400"
                          }`}>Price</p>
                        <p className={`text-xs sm:text-sm font-black tabular-nums tracking-tight ${theme === "dark" ? "text-emerald-400" : "text-emerald-600"
                          }`}>{currentPrice.toFixed(2)}</p>
                      </div>
                      {currentDigit !== null && currentDigit !== undefined && (
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-black text-sm sm:text-base ${theme === "dark"
                          ? "bg-blue-500/15 text-blue-300 border border-blue-500/20"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}>
                          {currentDigit}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Auth & Desktop Tools */}
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  {/* Desktop Only Buttons */}
                  <div className="hidden sm:flex items-center gap-2">
                    <Link href="/account">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 px-3 text-xs rounded-xl font-bold flex items-center gap-1.5 transition-all ${theme === "dark"
                          ? "bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:bg-blue-600 hover:text-white"
                          : "bg-gray-100 text-slate-700 hover:bg-blue-500 hover:text-white"}`}
                      >
                        <User className="h-3.5 w-3.5" />
                        Account
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowRiskModal(true)}
                      className={`h-8 px-3 text-xs rounded-xl font-bold flex items-center gap-1.5 transition-all ${theme === "dark"
                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20"
                        : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"}`}
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Risk
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleTheme}
                      className={`h-8 w-8 rounded-lg transition-all ${theme === "dark"
                        ? "bg-white/5 text-yellow-500 hover:bg-white/10"
                        : "bg-black/5 text-slate-700 hover:bg-black/10"
                        }`}
                    >
                      {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                    </Button>
                  </div>

                  <DerivAuth theme={theme} />

                  {/* Mobile Hamburger Menu */}
                  <div className="sm:hidden -ml-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className={`h-7 w-7 rounded-lg ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                          <Menu className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className={`w-48 ${theme === "dark" ? "bg-[#0a0e27] border-white/10" : ""}`}>
                        <DropdownMenuItem asChild>
                          <Link href="/account" className="flex items-center gap-2 w-full cursor-pointer">
                            <User className="h-4 w-4 shrink-0" />
                            <span>Account</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowRiskModal(true)} className="flex items-center gap-2 cursor-pointer">
                          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                          <span>Risk Disclaimer</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className={theme === "dark" ? "bg-white/10" : ""} />
                        <DropdownMenuItem onClick={toggleTheme} className="flex items-center justify-between cursor-pointer">
                          <span className="flex items-center gap-2">
                            {theme === "dark" ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4 shrink-0" />}
                            <span>Theme</span>
                          </span>
                          <span className="text-xs opacity-50">{theme === "dark" ? "Light" : "Dark"}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
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
                  ].filter(tab => !siteConfig?.hiddenTabs?.includes(tab)).map((tab) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className={`shrink-0 rounded-full text-[12px] sm:text-[14px] px-5 sm:px-7 py-2 sm:py-2.5 mx-1 whitespace-nowrap transition-all duration-300 capitalize font-semibold tracking-wide border ${activeTab === tab
                        ? theme === "dark"
                          ? "bg-white text-[#0f1629] border-white shadow-md shadow-white/10"
                          : "bg-[#0f1629] text-white border-[#0f1629] shadow-md shadow-black/10"
                        : theme === "dark"
                          ? "bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/10"
                          : "bg-transparent border-transparent text-slate-500 hover:text-slate-900 hover:bg-black/5"
                        }`}
                    >
                      {tab === "autobot" ? "Autobot 🤖" : tab === "automated" ? "Autotrader 🚀" : tab.replace("-", " ")}
                    </TabsTrigger>
                  ))}
                </ResponsiveTabs>
              </div>
            </div>
          </header>
        )}

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
                <TabMarketBar
                  symbol={symbol}
                  availableSymbols={availableSymbols}
                  onSymbolChange={changeSymbol}
                  currentPrice={currentPrice}
                  currentDigit={currentDigit}
                  tickCount={tickCount}
                  theme={theme}
                />
                <div
                  className={`rounded-lg sm:rounded-xl p-2 sm:p-3 border flex items-center justify-between ${theme === "dark" ? "bg-linear-to-br from-[#0f1629]/80 to-[#1a2235]/80 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]" : "bg-white border-gray-200 shadow-lg"}`}
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
                    className={`rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border ${theme === "dark" ? "bg-linear-to-br from-[#0f1629]/80 to-[#1a2235]/80 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]" : "bg-white border-gray-200 shadow-lg"}`}
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
                      className={`rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-4 border ${theme === "dark" ? "bg-linear-to-br from-[#0f1629]/80 to-[#1a2235]/80 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]" : "bg-white border-gray-200 shadow-lg"}`}
                    >
                      <h3
                        className={`text-sm sm:text-base md:text-lg font-bold mb-3 sm:mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                      >
                        Last Digits Line Chart
                      </h3>
                      <LastDigitsLineChart digits={recentDigits.slice(-10)} />
                    </div>

                    <div
                      className={`rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-4 border ${theme === "dark" ? "bg-linear-to-br from-[#0f1629]/80 to-[#1a2235]/80 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]" : "bg-white border-gray-200 shadow-lg"}`}
                    >
                      <StatisticalAnalysis analysis={analysis} recentDigits={recent100Digits} theme={theme} />
                    </div>
                  </div>
                )}

                {recentDigits.length > 0 && (
                  <div
                    className={`rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border ${theme === "dark" ? "bg-linear-to-br from-[#0f1629]/80 to-[#1a2235]/80 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]" : "bg-white border-gray-200 shadow-lg"}`}
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
                    className={`rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border ${theme === "dark" ? "bg-linear-to-br from-green-500/10 to-green-500/10 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]" : "bg-green-50 border-green-200 shadow-lg"}`}
                  >
                    <h3
                      className={`text-sm sm:text-base md:text-lg font-bold mb-3 sm:mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                    >
                      Frequency Analysis
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div
                        className={`text-center rounded-lg p-2 sm:p-3 md:p-4 border ${theme === "dark" ? "bg-blue-500/10" : "bg-blue-50"}`}
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
                        className={`text-center rounded-lg p-2 sm:p-3 md:p-4 border ${theme === "dark" ? "bg-red-500/10" : "bg-red-50"}`}
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
              </TabsContent>

              <TabsContent value="signals" className="mt-0">
                {analysis && <SignalsTab signals={signals} proSignals={proSignals} analysis={analysis} theme={theme} symbol={symbol} currentPrice={currentPrice} currentDigit={currentDigit} tickCount={tickCount} maxTicks={maxTicks} onMaxTicksChange={changeMaxTicks} />}
              </TabsContent>

              <TabsContent value="pro-signals" className="mt-0">
                {analysis && <ProSignalsTab proSignals={proSignals} analysis={analysis} theme={theme} symbol={symbol} currentPrice={currentPrice} currentDigit={currentDigit} tickCount={tickCount} maxTicks={maxTicks} onMaxTicksChange={changeMaxTicks} />}
              </TabsContent>

              <TabsContent value="super-signals" className="mt-0">
                <SuperSignalsTab theme={theme} symbol={symbol} availableSymbols={availableSymbols} />
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
                    tickCount={tickCount}
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
                    tickCount={tickCount}
                  />
                )}
              </TabsContent>

              <TabsContent value="advanced-over-under" className="mt-0">
                {analysis && <MoneyMakerTab theme={theme} recentDigits={recent50Digits} symbol={symbol} />}
              </TabsContent>

              <TabsContent value="matches" className="mt-0">
                {analysis && (
                  <MatchesTab analysis={analysis} signals={signals} recentDigits={recentDigits} theme={theme} symbol={symbol} currentPrice={currentPrice} currentDigit={currentDigit} tickCount={tickCount} maxTicks={maxTicks} onMaxTicksChange={changeMaxTicks} />
                )}
              </TabsContent>

              <TabsContent value="differs" className="mt-0">
                {analysis && (
                  <DiffersTab analysis={analysis} signals={signals} recentDigits={recentDigits} theme={theme} symbol={symbol} currentPrice={currentPrice} currentDigit={currentDigit} tickCount={tickCount} maxTicks={maxTicks} onMaxTicksChange={changeMaxTicks} />
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
                    currentDigit={currentDigit}
                    tickCount={tickCount}
                    maxTicks={maxTicks}
                    onMaxTicksChange={changeMaxTicks}
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
                <AutoBotTab theme={theme} symbol={symbol} />
              </TabsContent>

              <TabsContent value="automated" className="mt-0">
                <AutomatedTab theme={theme} symbol={symbol} />
              </TabsContent>

              <TabsContent value="smartauto24" className="mt-0">
                <SmartAuto24Tab
                  theme={theme}
                  symbol={symbol}
                  onSymbolChange={changeSymbol}
                  availableSymbols={availableSymbols}
                  maxTicks={maxTicks}
                  onMaxTicksChange={changeMaxTicks}
                />
              </TabsContent>

              <TabsContent value="smart-adaptive" className="mt-0">
                {analysis && <SmartAdaptiveTradingTab signals={signals} analysis={analysis} symbol={symbol} theme={theme} currentPrice={currentPrice} currentDigit={currentDigit} tickCount={tickCount} />}
              </TabsContent>

              <TabsContent value="tools-info" className="mt-0">
                <ToolsInfoTab theme={theme} connectionLogs={connectionLogs} />
              </TabsContent>
            </>
          )}
        </main>
      </Tabs>

      {!siteConfig?.footerHidden && (
        <footer
          className={`mt-12 py-8 transition-all duration-300 border-t relative overflow-hidden ${theme === "dark"
            ? "bg-[#0a0e27]/40 border-white/5"
            : "bg-gray-50 border-gray-200"
            }`}
        >
          {theme === "dark" && (
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
          )}
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
              {/* Brand Col */}
              <div className="flex flex-col items-center md:items-start space-y-2 max-w-xs text-center md:text-left">
                <span className={`text-xl font-black tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                  PROFIT<span className="text-blue-500">HUB</span>
                </span>
                <span className={`text-sm font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                  Quantum Trading Terminal
                </span>
                <p className={`text-[11px] mt-4 leading-relaxed ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>
                  Experience next-generation autonomous trading, powered by quantitative analysis and real-time market data.
                </p>
              </div>

              {/* Links Col */}
              <div className="flex flex-col items-center md:items-end space-y-4">
                <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-3 text-sm font-semibold">
                  <button
                    onClick={() => setIsDisclaimerOpen(true)}
                    className={`transition-all flex items-center gap-1.5 ${theme === "dark" ? "text-amber-500/80 hover:text-amber-400" : "text-amber-600 hover:text-amber-500"}`}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Risk Disclaimer
                  </button>
                  <a href="#" className={`transition-colors ${theme === "dark" ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}>Privacy Policy</a>
                  <a href="#" className={`transition-colors ${theme === "dark" ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}>Terms of Service</a>
                  <a href="#" className={`transition-colors ${theme === "dark" ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}>Support Center</a>
                </div>
                <div className={`text-xs mt-4 ${theme === "dark" ? "text-gray-600" : "text-gray-400"}`}>
                  © 2026 Profit Hub. All rights reserved.
                </div>
              </div>
            </div>
          </div>
        </footer>
      )}

      <Dialog open={isDisclaimerOpen} onOpenChange={setIsDisclaimerOpen}>
        <DialogContent className={`${theme === "dark" ? "bg-[#0a0e27] border-blue-500/30 text-white" : "bg-white"} sm:max-w-2xl`}>
          <DialogHeader>
            <DialogTitle className={`text-xl font-bold mb-2 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}>
              Risk Disclaimer
            </DialogTitle>
            <DialogDescription className={`${theme === "dark" ? "text-gray-300" : "text-gray-700"} text-sm leading-relaxed space-y-4`}>
              <p>
                Deriv offers complex derivatives, such as options and contracts for difference (&quot;CFDs&quot;). These products may not be suitable for all clients, and trading them puts you at risk.
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
      <RiskDisclaimerModal
        isOpen={showRiskModal}
        onClose={() => setShowRiskModal(false)}
        onAccept={() => {
          localStorage.setItem("deriv_risk_accepted", "true")
          setShowRiskModal(false)
        }}
        theme={theme}
      />
    </div >
  )
}
