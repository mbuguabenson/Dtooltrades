"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import {
    Zap,
    Target,
    Activity,
    ShieldCheck,
    AlertTriangle,
    TrendingUp,
    Brain,
    BarChart3,
    History,
    Lock,
    Unlock,
    Play,
    Square,
    ChevronRight,
    Search,
    Cpu,
    Radio,
    Terminal,
    Globe
} from 'lucide-react'
import { useSmartAdaptiveTrading } from "@/hooks/use-smart-adaptive-trading"
import { TransactionHistory } from "@/components/transaction-history"
import type { Signal, AnalysisResult } from "@/lib/analysis-engine"

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
}

export default function SmartAdaptiveTradingTab({
    signals: engineSignals = [],
    analysis: engineAnalysis,
    symbol = "R_100",
    availableSymbols,
    onSymbolChange,
    theme = "dark",
    currentPrice,
    currentDigit,
    tickCount
}: {
    signals?: Signal[],
    analysis?: AnalysisResult,
    symbol?: string,
    availableSymbols?: any[],
    onSymbolChange?: (symbol: string) => void,
    theme?: "light" | "dark",
    currentPrice?: number | null,
    currentDigit?: number | null,
    tickCount?: number
}) {
    const {
        marketScores,
        selectedMarket,
        setSelectedMarket,
        selectedStrategy,
        setSelectedStrategy,
        selectedStrategies,
        setSelectedStrategies,
        patterns,
        signals,
        stats,
        tradingStatus,
        tickDuration,
        setTickDuration,
        tradeOnce,
        startAutoTrade,
        stopAutoTrade,
        setConfig,
        resetSession,
        isConnected,
        isAuthorized,
        balance,
        logs
    } = useSmartAdaptiveTrading()

    // Sync with global symbol selection
    useEffect(() => {
        if (symbol && symbol !== selectedMarket) {
            setSelectedMarket(symbol)
        }
    }, [symbol, setSelectedMarket])

    const [stake, setStake] = useState(0.35)
    const [tp, setTp] = useState(5)
    const [sl, setSl] = useState(10)

    useEffect(() => {
        setConfig({ stake, targetProfit: tp, maxLoss: sl, duration: tickDuration })
    }, [stake, tp, sl, tickDuration, setConfig])

    const topSignal = useMemo(() => signals.length > 0 ? signals[0] : null, [signals])
    const currentMarketInfo = useMemo(() => marketScores.find(m => m.symbol === selectedMarket), [marketScores, selectedMarket])

    if (!isConnected || !isAuthorized) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px] gap-6 text-slate-400">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                    <Cpu className="w-16 h-16 text-sky-500 opacity-50" />
                </motion.div>
                <div className="text-center">
                    <h3 className="text-xl font-bold text-white mb-2 italic tracking-widest">INITIALIZING QUANTUM LAYER</h3>
                    <p className="text-sm">Waiting for authorized API handshake...</p>
                </div>
            </div>
        )
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-12 gap-2 sm:gap-4 p-2 sm:p-4 lg:p-6 bg-[#030712] min-h-screen text-slate-200 font-sans selection:bg-sky-500/30"
        >
            {/* --- TOP STATUS HUD --- */}
            <motion.div variants={itemVariants} className="col-span-12 flex flex-col xl:flex-row items-stretch gap-4">
                <div className="flex-1 flex items-center gap-3 sm:gap-6 p-3 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-slate-900/40 border border-slate-800/50 backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    <div className="relative">
                        <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center border-2 transition-all duration-700 ${currentMarketInfo?.state === 'Structured' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]' :
                            currentMarketInfo?.state === 'Transitional' ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.2)]' :
                                'bg-rose-500/10 border-rose-500 text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.2)]'
                            }`}>
                            <span className="text-2xl sm:text-4xl font-black mb-0.5 sm:mb-1">{currentMarketInfo?.lastDigit ?? '-'}</span>
                            <span className="text-[10px] uppercase font-bold tracking-tighter opacity-70">LAST DIGIT</span>
                        </div>
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 rounded-full border-4 border-slate-950 shadow-lg shadow-emerald-500/50"
                        />
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                            <h2 className="text-xl sm:text-3xl font-black tracking-tighter text-white uppercase italic">
                                {selectedMarket.replace('_', ' ')}
                                <span className="text-sky-500 ml-0.5 sm:ml-1">.IDX</span>
                            </h2>
                            <Badge className={`px-2 sm:px-4 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-black border-none shadow-lg ${currentMarketInfo?.state === 'Structured' ? 'bg-emerald-500 text-white' :
                                currentMarketInfo?.state === 'Transitional' ? 'bg-amber-500 text-black' :
                                    'bg-rose-500 text-white'
                                }`}>
                                {currentMarketInfo?.state ?? 'ANALYZING'}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-sky-400" />
                                <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest">Conf:</span>
                                <span className="text-lg sm:text-xl font-mono font-bold text-white leading-none">{currentMarketInfo?.score ?? 0}%</span>
                            </div>
                            <div className="h-6 w-[1px] bg-slate-800" />
                            <div className="flex items-center gap-2">
                                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                                <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Sync:</span>
                                <span className="text-xs font-mono font-bold text-emerald-400">ACTIVE</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="xl:w-80 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-slate-900/40 border border-slate-800/50 backdrop-blur-2xl flex flex-col justify-center">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black mb-2">Quant Balance</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-mono font-black text-white hover:text-sky-400 transition-colors cursor-default">
                            {balance ? (balance.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "---.--"}
                        </span>
                        <span className="text-sky-500 font-black italic">{balance?.currency || ""}</span>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                        <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '70%' }}
                                className="h-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]"
                            />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* --- ADAPTIVE GRID --- */}
            <div className="col-span-12 xl:col-span-3 space-y-4">
                <Card className="bg-slate-900/40 border-slate-800/50 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] backdrop-blur-xl h-full shadow-2xl overflow-hidden relative group">
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
                            <Search className="w-4 h-4 text-sky-400" /> Market Intelligence
                        </h3>
                    </div>
                    <div className="space-y-3 relative z-10">
                        <AnimatePresence mode="popLayout">
                            {marketScores.map((market, idx) => (
                                <motion.div
                                    key={market.symbol}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => setSelectedMarket(market.symbol)}
                                    className={`group flex items-center justify-between p-4 rounded-3xl cursor-pointer transition-all duration-500 ${selectedMarket === market.symbol
                                        ? 'bg-sky-500/10 border border-sky-500/30 shadow-[0_0_20px_rgba(14,165,233,0.1)]'
                                        : 'bg-slate-950/40 hover:bg-slate-950/70 border border-transparent'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-1 h-8 rounded-full transition-colors ${market.state === 'Structured' ? 'bg-emerald-500' :
                                            market.state === 'Transitional' ? 'bg-amber-500' :
                                                'bg-slate-700'
                                            }`} />
                                        <div>
                                            <div className="text-sm font-black text-white italic">{market.symbol.replace('_', ' ')}</div>
                                            <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest leading-none mt-1">{market.state}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-mono font-black text-sky-400 leading-none">{market.score}%</div>
                                        <ChevronRight className={`w-4 h-4 text-sky-500/20 mt-1 transition-transform ${selectedMarket === market.symbol ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'}`} />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </Card>
            </div>

            <div className="col-span-12 xl:col-span-6 space-y-4">
                {/* ACTIVE COMMAND PANEL */}
                <Card className={`relative p-4 sm:p-8 rounded-2xl sm:rounded-[3rem] border transition-all duration-700 overflow-hidden ${topSignal?.entryStatus === 'Confirmed'
                    ? 'bg-emerald-500/5 border-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.15)]'
                    : 'bg-slate-900/40 border-slate-800/50'
                    }`}>
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                        <Zap className="w-64 h-64 text-white" />
                    </div>

                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 flex items-center justify-center border border-sky-500/30">
                                <Radio className={`w-5 h-5 text-sky-400 ${topSignal ? 'animate-pulse' : ''}`} />
                            </div>
                            <h3 className="text-sm font-black tracking-[0.4em] text-slate-400 uppercase italic">Adaptive Node Core</h3>
                        </div>
                        <div className="flex gap-2">
                            {["OverUnder", "EvenOdd", "Differs"].map((strat) => (
                                <Badge
                                    key={strat}
                                    onClick={() => {
                                        const exists = selectedStrategies.includes(strat)
                                        if (exists) {
                                            if (selectedStrategies.length > 1) setSelectedStrategies(prev => prev.filter(s => s !== strat))
                                        } else {
                                            setSelectedStrategies(prev => [...prev, strat])
                                        }
                                    }}
                                    className={`px-3 py-1 rounded-full cursor-pointer transition-all duration-300 font-black text-[8px] uppercase tracking-widest border ${selectedStrategies.includes(strat)
                                        ? 'bg-sky-500 border-sky-400 text-white shadow-lg shadow-sky-500/20'
                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                                        }`}
                                >
                                    {strat}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 relative z-10">
                        {signals.length > 0 ? (
                            <AnimatePresence mode="popLayout">
                                {signals.map((signal, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className={`p-4 sm:p-6 rounded-xl sm:rounded-[2rem] border transition-all duration-500 ${signal.entryStatus === 'Confirmed'
                                            ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                                            : 'bg-slate-950/40 border-slate-800'
                                            }`}
                                    >
                                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Badge className={`px-3 py-0.5 rounded-full text-[9px] font-black italic ${signal.entryStatus === 'Confirmed' ? 'bg-emerald-500' : 'bg-slate-800'}`}>
                                                        {signal.strategy.toUpperCase()}
                                                    </Badge>
                                                    <span className="text-[10px] font-black text-sky-500/70 uppercase tracking-widest">{signal.type}</span>
                                                </div>
                                                <div className="text-xl sm:text-3xl font-black text-white italic tracking-tighter">
                                                    TARGET BARRIER: <span className="text-sky-500 not-italic ml-2">{signal.barrier}</span>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-2 font-medium">{signal.description}</p>
                                            </div>

                                            <div className="w-full md:w-auto flex items-center gap-4">
                                                <div className="flex flex-col items-end px-4">
                                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Strength</span>
                                                    <span className="text-xl font-mono font-black text-white">{signal.confidence}%</span>
                                                </div>
                                                <Button
                                                    onClick={() => tradeOnce(signal)}
                                                    disabled={signal.entryStatus !== 'Confirmed'}
                                                    className={`h-12 sm:h-16 px-6 sm:px-8 rounded-xl sm:rounded-2xl font-black italic shadow-xl transition-all ${signal.entryStatus === 'Confirmed'
                                                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border-none'
                                                        }`}
                                                >
                                                    {signal.entryStatus === 'Confirmed' ? (
                                                        <><Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" /> MANUAL STRIKE</>
                                                    ) : (
                                                        <><Lock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" /> LOCKED</>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 gap-4">
                                <motion.div
                                    animate={{ rotate: [0, 90, 180, 270, 360] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="p-4 rounded-full border-2 border-dashed border-slate-800"
                                >
                                    <Search className="w-12 h-12 text-slate-800" />
                                </motion.div>
                                <p className="text-slate-600 font-black italic tracking-widest uppercase text-sm">Targeting structural resonance...</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* NEURAL PROTOCOL (AnalysisEngine) */}
                <Card className="bg-slate-900/40 border-slate-800/50 p-4 sm:p-8 rounded-2xl sm:rounded-[3rem] backdrop-blur-xl shadow-2xl mt-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-sky-400 mb-8 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-sky-500" /> Global Neural Protocol
                    </h3>
                    <div className="flex flex-col gap-3">
                        {engineSignals.filter(s => s.status !== "NEUTRAL").length > 0 ? (
                            engineSignals.filter(s => s.status !== "NEUTRAL").map((s, idx) => (
                                <div key={idx} className={`p-4 rounded-2xl border ${s.status === 'TRADE NOW' ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-slate-950/50 border-slate-800'} flex items-center justify-between`}>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge className={`text-[8px] font-black ${s.status === 'TRADE NOW' ? 'bg-emerald-500' : 'bg-blue-500'}`}>{s.status}</Badge>
                                            <span className="text-[10px] font-bold text-white uppercase">{s.type.replace('_', ' ')}</span>
                                        </div>
                                        <div className="text-xs text-slate-300 font-medium">{s.recommendation}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-mono font-black text-white">{s.probability.toFixed(1)}%</div>
                                        <div className="text-[8px] text-slate-500 uppercase font-black">Accuracy</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center text-slate-700 italic font-black uppercase tracking-widest text-xs">Awaiting neural sync...</div>
                        )}
                    </div>
                </Card>

                {/* PATTERN HUD */}
                <Card className="bg-slate-900/40 border-slate-800/50 p-4 sm:p-8 rounded-2xl sm:rounded-[3rem] backdrop-blur-xl shadow-2xl">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-8 flex items-center gap-2">
                        <Brain className="w-4 h-4 text-purple-500" /> Neural Pattern Stream
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AnimatePresence mode="popLayout">
                            {patterns.length === 0 ? (
                                <div className="col-span-2 py-12 text-center text-slate-700 italic font-black uppercase tracking-widest">Waiting for structural emergence...</div>
                            ) : (
                                patterns.map((p, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="p-4 sm:p-6 rounded-xl sm:rounded-[2rem] bg-slate-950/50 border border-slate-800/50 group relative hover:border-sky-500/30 transition-all"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30">
                                                    <TrendingUp className="w-4 h-4 text-purple-400" />
                                                </div>
                                                <span className="text-sm font-black text-white italic">{p.type}</span>
                                            </div>
                                            <Badge className="bg-purple-500 text-white border-none font-black text-[10px]">{p.confidence}%</Badge>
                                        </div>
                                        <p className="text-xs text-slate-500 leading-relaxed mb-4">{p.description}</p>
                                        <div className="text-[10px] font-black text-emerald-400 uppercase flex items-center gap-2 tracking-tighter">
                                            <Zap className="w-3 h-3" /> {p.suggestion}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </Card>
            </div>

            <div className="col-span-12 xl:col-span-3 space-y-4">
                {/* AUTO ENGINE RE-DESIGN */}
                <Card className="bg-slate-900/40 border-slate-800/50 p-4 sm:p-8 rounded-2xl sm:rounded-[2rem] backdrop-blur-xl h-full shadow-2xl flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-2 italic">
                            Quant Engine
                        </span>
                        <motion.div
                            animate={tradingStatus?.isAutoTrading ? { scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] } : {}}
                            transition={{ duration: 1, repeat: Infinity }}
                            className={`w-3 h-3 rounded-full ${tradingStatus?.isAutoTrading ? 'bg-emerald-500' : 'bg-slate-700'}`}
                        />
                    </div>

                    <div className="space-y-6 flex-1">
                        <div className="relative group">
                            <span className="text-[9px] text-slate-500 uppercase font-black px-2 mb-2 block tracking-widest">Stake Magnitude</span>
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={stake}
                                    onChange={(e) => setStake(parseFloat(e.target.value))}
                                    className="bg-slate-950/80 border-slate-800 h-14 rounded-2xl font-mono font-black text-lg focus:ring-sky-500 border-none pl-12"
                                />
                                <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sky-500/50" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-[9px] text-slate-500 uppercase font-black px-2 mb-2 block tracking-widest">Target TP</span>
                                <Input
                                    type="number"
                                    value={tp}
                                    onChange={(e) => setTp(parseFloat(e.target.value))}
                                    className="bg-slate-950/80 border-slate-800 h-12 rounded-xl font-mono font-bold focus:ring-sky-500 border-none px-4 text-emerald-400"
                                />
                            </div>
                            <div>
                                <span className="text-[9px] text-slate-500 uppercase font-black px-2 mb-2 block tracking-widest">Max SL</span>
                                <Input
                                    type="number"
                                    value={sl}
                                    onChange={(e) => setSl(parseFloat(e.target.value))}
                                    className="bg-slate-950/80 border-slate-800 h-12 rounded-xl font-mono font-bold focus:ring-sky-500 border-none px-4 text-rose-400"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 space-y-4">
                        <Button
                            onClick={tradingStatus?.isAutoTrading ? stopAutoTrade : startAutoTrade}
                            className={`w-full h-20 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all duration-700 group overflow-hidden relative ${tradingStatus?.isAutoTrading
                                ? 'bg-rose-500 hover:bg-rose-600 shadow-[0_0_30px_rgba(244,63,94,0.3)]'
                                : 'bg-emerald-500 hover:bg-emerald-600 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                                }`}
                        >
                            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            {tradingStatus?.isAutoTrading ? (
                                <div className="flex flex-col items-center">
                                    <Square className="w-4 h-4 mb-1" />
                                    <span>DISENGAGE AUTOPILOT</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <Play className="w-4 h-4 mb-1" />
                                    <span>ACTIVATE 24H CYCLE</span>
                                </div>
                            )}
                        </Button>
                        <p className="text-[8px] text-slate-600 font-black uppercase tracking-[0.4em] text-center italic">
                            {tradingStatus?.isAutoTrading ? 'System Locked in Auto-Phase' : 'Awaiting Pilot Initialization'}
                        </p>
                    </div>
                </Card>
            </div>

            {/* --- BOTTOM HUD & LOGS & HISTORY --- */}
            <motion.div variants={itemVariants} className="col-span-12 flex flex-col gap-4">
                {/* 1. NEURAL SYSTEM STREAM (LOGS) - NOW TOP */}
                <Card className="bg-slate-900/40 border-slate-800/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl backdrop-blur-xl shadow-2xl flex flex-col group overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-sky-400" /> Neural System Stream
                        </h3>
                        <div className="flex gap-2">
                            <div className="w-2 h-2 rounded-full bg-rose-500/50" />
                            <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                            <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
                        </div>
                    </div>
                    <div className="flex-1 bg-black/60 rounded-xl sm:rounded-2xl border border-slate-800/50 p-3 sm:p-4 font-mono text-[9px] sm:text-[10px] overflow-y-auto min-h-[250px] max-h-[350px] scrollbar-hide selection:bg-sky-500/50">
                        <div className="flex flex-col gap-1.5">
                            {logs.map((log, i) => (
                                <motion.div
                                    initial={{ x: -10, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    key={i}
                                    className="flex items-start gap-4"
                                >
                                    <span className="text-slate-700 min-w-[70px] font-bold">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                                    <div className={`flex-1 ${log.type === 'system' ? 'text-slate-500' :
                                        log.type === 'scanner' ? 'text-emerald-400/80' :
                                            log.type === 'trade' ? 'text-sky-400 font-bold' :
                                                log.type === 'error' ? 'text-rose-500 font-black' :
                                                    'text-purple-400/80'}
                                    `}>
                                        <span className={`mr-2 px-1 rounded bg-slate-900 border border-slate-800 text-[8px] uppercase font-black tracking-widest`}>{log.type}</span>
                                        {log.message}
                                    </div>
                                </motion.div>
                            ))}
                            {logs.length === 0 && (
                                <div className="text-slate-800 italic uppercase font-black tracking-widest text-center py-12">Synchronizing Neural Interface...</div>
                            )}
                        </div>
                    </div>
                </Card>

                {/* 2. SESSION VAULT (STATS) - NOW MIDDLE & COMPACT */}
                <Card className="bg-slate-900/40 border-slate-800/50 p-3 sm:p-5 rounded-2xl sm:rounded-3xl backdrop-blur-xl shadow-2xl overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-1000" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-4 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" /> Session Vault
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
                        <div className="p-3 sm:p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col items-center">
                            <div className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1">Portfolio P/L</div>
                            <div className={`text-xl sm:text-2xl font-black tabular-nums italic ${stats?.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {stats?.profit >= 0 ? '+' : ''}${Math.abs(stats?.profit ?? 0).toFixed(2)}
                            </div>
                        </div>
                        <div className="p-3 sm:p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col items-center">
                            <div className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1">Strike Rate</div>
                            <div className="text-xl sm:text-2xl font-black text-white italic tabular-nums">
                                {stats ? Math.round((stats.wins / (stats.trades || 1)) * 100) : 0}%
                            </div>
                        </div>
                        <div className="p-3 sm:p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between overflow-hidden">
                            <div className="flex flex-col">
                                <div className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-0.5">Execution Index</div>
                                <div className="text-xl font-black text-sky-400 italic tabular-nums">
                                    {stats?.trades ?? 0} <span className="text-[8px] text-slate-600 not-italic uppercase tracking-widest ml-1">Trades</span>
                                </div>
                            </div>
                            <div className="flex -space-x-1">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="w-5 h-5 rounded-full border-2 border-slate-950 bg-slate-900 flex items-center justify-center">
                                        <div className="w-1 h-1 rounded-full bg-sky-500/40" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* 3. TRANSACTION HISTORY - NOW LAST */}
                <Card className="bg-slate-900/40 border-slate-800/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl backdrop-blur-xl shadow-2xl overflow-hidden group">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-4 flex items-center gap-2">
                        <History className="w-4 h-4 text-sky-500" /> Automated Ledger
                    </h3>
                    <div className="rounded-xl overflow-hidden border border-slate-800/50">
                        <TransactionHistory transactions={[]} theme={theme as any} />
                    </div>
                </Card>
            </motion.div>
        </motion.div>
    )
}
