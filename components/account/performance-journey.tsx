"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useDerivAPI } from "@/lib/deriv-api-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, ComposedChart, Bar, Line
} from "recharts"
import {
    TrendingUp, TrendingDown, Wallet, ArrowDownCircle, ArrowUpCircle,
    History, Calendar, RefreshCcw, Activity, BookOpen
} from "lucide-react"

interface JourneyEvent {
    type: "deposit" | "withdrawal" | "trade_win" | "trade_loss" | "other"
    amount: number
    time: number
    balance: number
    description: string
}

interface PerformanceJourneyProps {
    theme?: "light" | "dark"
}

export function PerformanceJourney({ theme = "dark" }: PerformanceJourneyProps) {
    const { apiClient, isAuthorized, activeLoginId } = useDerivAPI()
    const [events, setEvents] = useState<JourneyEvent[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchJourneyData = useCallback(async () => {
        if (!apiClient || !isAuthorized) return

        setIsLoading(true)
        setError(null)
        try {
            // Fetch a larger set of data for a better journey view
            const response = await apiClient.getStatement(100)
            if (response && response.transactions) {
                const txs = response.transactions

                const processEvents: JourneyEvent[] = txs.reverse().map((tx: any) => {
                    let type: JourneyEvent["type"] = "other"
                    const action = tx.action_type.toLowerCase()

                    if (action === "deposit") type = "deposit"
                    else if (action === "withdrawal") type = "withdrawal"
                    else if (action === "buy" || action === "sell") {
                        type = tx.amount > 0 ? "trade_win" : "trade_loss"
                    }

                    return {
                        type,
                        amount: tx.amount,
                        time: tx.transaction_time,
                        balance: tx.balance_after,
                        description: tx.longcode || tx.display_name || action
                    }
                })

                setEvents(processEvents)
            }
        } catch (err: any) {
            console.error("[v0] Error fetching journey data:", err)
            setError(err?.message || "Failed to load journey data")
        } finally {
            setIsLoading(false)
        }
    }, [apiClient, isAuthorized])

    useEffect(() => {
        fetchJourneyData()
    }, [fetchJourneyData, activeLoginId])

    const metrics = useMemo(() => {
        const deposited = events.filter(e => e.type === "deposit").reduce((s, e) => s + e.amount, 0)
        const withdrawn = events.filter(e => e.type === "withdrawal").reduce((s, e) => s + Math.abs(e.amount), 0)
        const tradingPnL = events.filter(e => e.type === "trade_win" || e.type === "trade_loss").reduce((s, e) => s + e.amount, 0)

        return {
            deposited,
            withdrawn,
            tradingPnL,
            totalFunding: deposited - withdrawn,
            netResult: (deposited - withdrawn) + tradingPnL
        }
    }, [events])

    const chartData = useMemo(() => {
        return events.map((e, i) => ({
            name: new Date(e.time * 1000).toLocaleDateString(),
            balance: e.balance,
            amount: e.amount,
            type: e.type
        }))
    }, [events])

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Summary Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-slate-900/50 border-slate-800 shadow-xl overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 group-hover:w-2 transition-all"></div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Total Deposited</CardDescription>
                        <CardTitle className="text-2xl font-black text-emerald-400 flex items-center gap-2">
                            <ArrowDownCircle className="h-5 w-5" />
                            ${metrics.deposited.toFixed(2)}
                        </CardTitle>
                    </CardHeader>
                </Card>

                <Card className="bg-slate-900/50 border-slate-800 shadow-xl overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 group-hover:w-2 transition-all"></div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Total Withdrawn</CardDescription>
                        <CardTitle className="text-2xl font-black text-rose-400 flex items-center gap-2">
                            <ArrowUpCircle className="h-5 w-5" />
                            ${metrics.withdrawn.toFixed(2)}
                        </CardTitle>
                    </CardHeader>
                </Card>

                <Card className="bg-slate-900/50 border-slate-800 shadow-xl overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 group-hover:w-2 transition-all"></div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Net Trading P&L</CardDescription>
                        <CardTitle className={`text-2xl font-black flex items-center gap-2 ${metrics.tradingPnL >= 0 ? "text-blue-400" : "text-rose-400"}`}>
                            <Activity className="h-5 w-5" />
                            {metrics.tradingPnL >= 0 ? "+" : ""}${metrics.tradingPnL.toFixed(2)}
                        </CardTitle>
                    </CardHeader>
                </Card>

                <Card className="bg-slate-900/50 border-slate-800 shadow-xl overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 group-hover:w-2 transition-all"></div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Account Standing</CardDescription>
                        <CardTitle className="text-2xl font-black text-slate-200 flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-purple-400" />
                            ${events.length > 0 ? events[events.length - 1].balance.toFixed(2) : "0.00"}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Journey Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 bg-slate-900/30 border-slate-800 shadow-2xl backdrop-blur-md">
                    <CardHeader className="flex flex-row items-center justify-between pb-8">
                        <div>
                            <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-blue-500" />
                                Profitability Journey
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-500">Cumulative balance including deposits, withdrawals, and trading result.</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={fetchJourneyData} className="rounded-xl hover:bg-slate-800">
                            <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[400px] w-full">
                            {isLoading ? (
                                <Skeleton className="h-full w-full bg-slate-800/50 rounded-2xl" />
                            ) : events.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={chartData}>
                                        <defs>
                                            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                        <XAxis dataKey="name" hide />
                                        <YAxis
                                            stroke="#64748b"
                                            fontSize={10}
                                            fontFamily="monospace"
                                            tickFormatter={(val) => `$${val.toLocaleString()}`}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.4)" }}
                                            itemStyle={{ fontWeight: "800" }}
                                            formatter={(value: any, name: string) => [`$${value.toFixed(2)}`, name === "balance" ? "Balance" : "Change"]}
                                        />
                                        <Area type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#balanceGradient)" />
                                        <Bar dataKey="amount" barSize={10}>
                                            {chartData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.amount > 0 ? "#10b981" : "#f43f5e"}
                                                    fillOpacity={0.4}
                                                />
                                            ))}
                                        </Bar>
                                    </ComposedChart>
                                </ResponsiveContainer>

                            ) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-30">
                                    <History className="h-12 w-12 mb-4" />
                                    <p>No journey data found.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Journal View */}
                <Card className="bg-slate-900/30 border-slate-800 shadow-2xl backdrop-blur-md">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-purple-500" />
                            Account Journal
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500">Recent significant events in your journey.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-2">
                        <div className="max-h-[420px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex gap-3 p-3 rounded-xl border border-slate-800/50">
                                        <Skeleton className="h-10 w-10 rounded-full bg-slate-800" />
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-3 w-1/2 bg-slate-800" />
                                            <Skeleton className="h-3 w-full bg-slate-800" />
                                        </div>
                                    </div>
                                ))
                            ) : events.length > 0 ? (
                                [...events].reverse().slice(0, 20).map((event, idx) => (
                                    <div key={idx} className="flex gap-4 p-3 rounded-2xl border border-slate-800/50 bg-slate-900/20 hover:bg-slate-800/40 transition-colors relative group">
                                        <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center border ${event.type === 'deposit' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                                event.type === 'withdrawal' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                                                    event.type === 'trade_win' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                                                        'bg-slate-500/10 border-slate-500/20 text-slate-500'
                                            }`}>
                                            {event.type === 'deposit' ? <ArrowDownCircle className="h-5 w-5" /> :
                                                event.type === 'withdrawal' ? <ArrowUpCircle className="h-5 w-5" /> :
                                                    <Activity className="h-5 w-5" />}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex justify-between items-start">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                    {event.type.replace('_', ' ')}
                                                </span>
                                                <span className="text-[9px] font-mono text-slate-600">
                                                    {new Date(event.time * 1000).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-xs font-medium text-slate-300 line-clamp-2 leading-relaxed">
                                                {event.description}
                                            </p>
                                            <div className={`text-sm font-black ${event.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {event.amount >= 0 ? '+' : '-'}${Math.abs(event.amount).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-slate-600 py-20 text-sm italic">Your journey begins here.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
