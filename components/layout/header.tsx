"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Moon, Sun, Home, Menu } from "lucide-react"
import { MarketSelector } from "@/components/market-selector"
import { DerivAuth } from "@/components/deriv-auth"

interface HeaderProps {
    theme: "light" | "dark"
    toggleTheme: () => void
    connectionStatus: string
    symbol: string
    availableSymbols: any[]
    changeSymbol: (symbol: string) => void
    currentPrice: number | null
    currentDigit: number | null
}

export function Header({
    theme,
    toggleTheme,
    connectionStatus,
    symbol,
    availableSymbols,
    changeSymbol,
    currentPrice,
    currentDigit,
}: HeaderProps) {
    return (
        <header
            className={`fixed top-4 left-4 right-4 z-50 rounded-2xl border transition-all duration-300 ${theme === "dark"
                    ? "bg-[#0a0e17]/80 border-blue-500/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                    : "bg-white/90 border-gray-200 shadow-lg"
                } backdrop-blur-xl`}
        >
            <div className="px-4 h-16 sm:h-20 flex items-center justify-between">
                {/* Left: Branding */}
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <div className="absolute -inset-2 bg-linear-to-r from-blue-600 to-cyan-500 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-cyan-600 text-white shadow-lg">
                            <span className="text-xl font-bold">P</span>
                        </div>
                    </div>

                    <div className="hidden sm:flex flex-col">
                        <h1 className={`text-xl font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                            <span className="bg-linear-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">Profit Hub</span>
                        </h1>
                        <span className={`text-[10px] uppercase tracking-widest font-medium ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                            AI Trading Terminal
                        </span>
                    </div>
                </div>

                {/* Center: Market Ticker (Desktop) */}
                <div className="hidden lg:flex items-center gap-6 bg-slate-900/50 rounded-full px-6 py-2 border border-slate-800/50">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Price</span>
                        <span className={`text-sm font-mono font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            {currentPrice?.toFixed(5) || "----"}
                        </span>
                    </div>
                    <div className="w-px h-8 bg-slate-700/50"></div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Digit</span>
                        <span className={`text-sm font-mono font-bold ${currentDigit !== null ? (currentDigit % 2 === 0 ? 'text-blue-400' : 'text-red-400') : 'text-slate-500'}`}>
                            {currentDigit !== null ? currentDigit : "-"}
                        </span>
                    </div>
                </div>

                {/* Right: Controls */}
                <div className="flex items-center gap-3">
                    <DerivAuth theme={theme} />

                    <div className="hidden md:block">
                        {availableSymbols.length > 0 && (
                            <MarketSelector
                                symbols={availableSymbols}
                                currentSymbol={symbol}
                                onSymbolChange={changeSymbol}
                                theme={theme}
                            />
                        )}
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        className={`rounded-xl w-10 h-10 ${theme === "dark"
                                ? "bg-slate-800/50 text-yellow-400 hover:bg-slate-700"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                    >
                        {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </Button>

                    <div className="md:hidden">
                        <Button variant="ghost" size="icon">
                            <Menu className="w-6 h-6" />
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    )
}
