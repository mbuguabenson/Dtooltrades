"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useDerivAPI } from "@/lib/deriv-api-context"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"
import {
    TrendingUp, TrendingDown, Wallet, ArrowDownCircle, ArrowUpCircle,
    Activity, RefreshCcw, Trophy, Target, Zap, BarChart3, BookOpen,
    CheckCircle2, XCircle
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

const EVENT_COLORS = {
    deposit: "#10b981",
    withdrawal: "#f43f5e",
    trade_win: "#3b82f6",
    trade_loss: "#f43f5e",
    other: "#6b7280",
}

const RADIAN = Math.PI / 180
function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
    if (percent < 0.05) return null
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    )
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
            const response = await apiClient.getStatement(200)
            if (response?.transactions) {
                const processEvents: JourneyEvent[] = [...response.transactions].reverse().map((tx: any) => {
                    const action = tx.action_type?.toLowerCase()
                    let type: JourneyEvent["type"] = "other"
                    if (action === "deposit") type = "deposit"
                    else if (action === "withdrawal") type = "withdrawal"
                    else if (action === "buy" || action === "sell") {
                        type = tx.amount > 0 ? "trade_win" : "trade_loss"
                    }
                    return {
                        type, amount: tx.amount, time: tx.transaction_time,
                        balance: tx.balance_after, description: tx.longcode || tx.display_name || action
                    }
                })
                setEvents(processEvents)
            }
        } catch (err: any) {
            setError(err?.message || "Failed to load journey data")
        } finally {
            setIsLoading(false)
        }
    }, [apiClient, isAuthorized])

    useEffect(() => { fetchJourneyData() }, [fetchJourneyData, activeLoginId])

    const metrics = useMemo(() => {
        const deposited = events.filter(e => e.type === "deposit").reduce((s, e) => s + e.amount, 0)
        const withdrawn = events.filter(e => e.type === "withdrawal").reduce((s, e) => s + Math.abs(e.amount), 0)
        const tradeTxs = events.filter(e => e.type === "trade_win" || e.type === "trade_loss")
        const wins = tradeTxs.filter(e => e.type === "trade_win")
        const losses = tradeTxs.filter(e => e.type === "trade_loss")
        const tradingPnL = tradeTxs.reduce((s, e) => s + e.amount, 0)
        const winRate = tradeTxs.length > 0 ? (wins.length / tradeTxs.length) * 100 : 0
        const avgWin = wins.length > 0 ? wins.reduce((s, e) => s + e.amount, 0) / wins.length : 0
        const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, e) => s + e.amount, 0)) / losses.length : 0
        const currentBal = events.length > 0 ? events[events.length - 1].balance : 0
        return { deposited, withdrawn, tradingPnL, wins: wins.length, losses: losses.length, total: tradeTxs.length, winRate, avgWin, avgLoss, currentBal }
    }, [events])

    const pieData = useMemo(() => [
        { name: "Trade Wins", value: metrics.wins, color: "#10b981" },
        { name: "Trade Losses", value: metrics.losses, color: "#f43f5e" },
        { name: "Deposits", value: events.filter(e => e.type === "deposit").length, color: "#3b82f6" },
        { name: "Withdrawals", value: events.filter(e => e.type === "withdrawal").length, color: "#f59e0b" },
    ].filter(d => d.value > 0), [metrics, events])

    const scorecards = [
        { label: "Total Deposited", value: `$${metrics.deposited.toFixed(2)}`, icon: <ArrowDownCircle className="h-5 w-5" />, color: "text-emerald-400", gradient: "from-emerald-700/30 to-emerald-900/10", border: "border-emerald-500/20" },
        { label: "Total Withdrawn", value: `$${metrics.withdrawn.toFixed(2)}`, icon: <ArrowUpCircle className="h-5 w-5" />, color: "text-rose-400", gradient: "from-rose-700/30 to-rose-900/10", border: "border-rose-500/20" },
        { label: "Net Trading P&L", value: `${metrics.tradingPnL >= 0 ? "+" : ""}$${metrics.tradingPnL.toFixed(2)}`, icon: <Activity className="h-5 w-5" />, color: metrics.tradingPnL >= 0 ? "text-blue-400" : "text-rose-400", gradient: "from-blue-700/30 to-blue-900/10", border: "border-blue-500/20" },
        { label: "Current Balance", value: `$${metrics.currentBal.toFixed(2)}`, icon: <Wallet className="h-5 w-5" />, color: "text-purple-400", gradient: "from-purple-700/30 to-purple-900/10", border: "border-purple-500/20" },
    ]

    const performanceMetrics = [
        { label: "Win Rate", value: `${metrics.winRate.toFixed(1)}%`, icon: <Trophy className="h-4 w-4 text-amber-400" />, color: metrics.winRate >= 50 ? "text-emerald-400" : "text-rose-400" },
        { label: "Total Trades", value: metrics.total, icon: <BarChart3 className="h-4 w-4 text-blue-400" />, color: "text-white" },
        { label: "Wins", value: metrics.wins, icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />, color: "text-emerald-400" },
        { label: "Losses", value: metrics.losses, icon: <XCircle className="h-4 w-4 text-rose-400" />, color: "text-rose-400" },
        { label: "Avg Win", value: `$${metrics.avgWin.toFixed(2)}`, icon: <TrendingUp className="h-4 w-4 text-emerald-400" />, color: "text-emerald-400" },
        { label: "Avg Loss", value: `$${metrics.avgLoss.toFixed(2)}`, icon: <TrendingDown className="h-4 w-4 text-rose-400" />, color: "text-rose-400" },
    ]

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Performance Journey</h3>
                    <p className="text-[10px] text-gray-600 mt-0.5">{events.length} account events loaded</p>
                </div>
                <button onClick={fetchJourneyData} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-xs font-bold text-gray-400 hover:bg-white/10 transition-all">
                    <RefreshCcw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh
                </button>
            </div>

            {/* Scorecards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {scorecards.map((s, i) => (
                    <div key={i} className={`relative overflow-hidden bg-gradient-to-br ${s.gradient} border ${s.border} rounded-2xl p-5`}>
                        <div className={`${s.color} mb-3`}>{s.icon}</div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1">{s.label}</p>
                        <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                        <div className="absolute -bottom-3 -right-3 w-14 h-14 rounded-full bg-white/5" />
                    </div>
                ))}
            </div>

            {isLoading ? (
                <div className="h-60 flex items-center justify-center">
                    <div className="relative w-12 h-12">
                        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    </div>
                </div>
            ) : events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pie Chart - Activity Breakdown */}
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6">
                        <div className="mb-4">
                            <p className="text-xs font-black uppercase tracking-widest text-white mb-0.5">Activity Breakdown</p>
                            <p className="text-[10px] text-gray-600">Distribution of all account events</p>
                        </div>
                        <div className="h-[240px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={90}
                                        innerRadius={50}
                                        paddingAngle={3}
                                        dataKey="value"
                                        labelLine={false}
                                        label={CustomLabel}
                                        strokeWidth={0}
                                    >
                                        {pieData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }}
                                    />
                                    <Legend
                                        formatter={(value) => <span className="text-[10px] font-bold text-gray-400">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Performance Metrics Grid */}
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6">
                        <div className="mb-4">
                            <p className="text-xs font-black uppercase tracking-widest text-white mb-0.5">Trading Scoreboard</p>
                            <p className="text-[10px] text-gray-600">Key performance metrics at a glance</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {performanceMetrics.map((m, i) => (
                                <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-start gap-3">
                                    {m.icon}
                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-0.5">{m.label}</p>
                                        <p className={`text-lg font-black ${m.color}`}>{m.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Win rate bar */}
                        <div className="mt-4">
                            <div className="flex justify-between text-[10px] font-bold text-gray-600 mb-1">
                                <span>Win Rate</span>
                                <span className={metrics.winRate >= 50 ? "text-emerald-400" : "text-rose-400"}>{metrics.winRate.toFixed(1)}%</span>
                            </div>
                            <div className="w-full h-2 bg-rose-500/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000"
                                    style={{ width: `${Math.min(metrics.winRate, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Journal — recent events */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden">
                <div className="px-6 py-5 border-b border-white/5 flex items-center gap-3">
                    <BookOpen className="h-4 w-4 text-purple-400" />
                    <p className="text-xs font-black uppercase tracking-widest text-white">Account Journal</p>
                    <span className="ml-auto text-[10px] text-gray-600">Recent {Math.min(events.length, 20)} events</span>
                </div>
                <div className="divide-y divide-white/[0.03] max-h-96 overflow-y-auto custom-scrollbar">
                    {[...events].reverse().slice(0, 20).map((event, idx) => (
                        <div key={idx} className="flex items-start gap-4 px-6 py-4 hover:bg-white/[0.015] transition-colors">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${event.type === "deposit" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                : event.type === "withdrawal" ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                                    : event.type === "trade_win" ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                        : event.type === "trade_loss" ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                                            : "bg-gray-500/10 border-gray-500/20 text-gray-400"}`}>
                                {event.type === "deposit" ? <ArrowDownCircle className="h-4 w-4" /> :
                                    event.type === "withdrawal" ? <ArrowUpCircle className="h-4 w-4" /> :
                                        event.type === "trade_win" ? <TrendingUp className="h-4 w-4" /> :
                                            event.type === "trade_loss" ? <TrendingDown className="h-4 w-4" /> :
                                                <Activity className="h-4 w-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{event.type.replace("_", " ")}</span>
                                    <span className="text-[9px] font-mono text-gray-700 shrink-0">{new Date(event.time * 1000).toLocaleDateString()}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{event.description}</p>
                                <p className={`text-sm font-black mt-0.5 ${event.amount >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                    {event.amount >= 0 ? "+" : ""}${Math.abs(event.amount).toFixed(2)}
                                    <span className="text-[10px] text-gray-600 font-medium ml-2">Bal: ${event.balance.toFixed(2)}</span>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
