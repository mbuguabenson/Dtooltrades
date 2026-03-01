"use client"

import { useState, useEffect, useCallback } from "react"
import { useDerivAPI } from "@/lib/deriv-api-context"
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from "recharts"
import {
    TrendingUp, TrendingDown, Target, Zap, BarChart3, ArrowRightLeft, RefreshCw,
    Trophy, AlertTriangle
} from "lucide-react"

interface AnalyticsData {
    totalTrades: number
    wins: number
    losses: number
    winRate: number
    totalProfit: number
    avgProfit: number
    maxWin: number
    maxLoss: number
    equityCurve: { name: string; value: number }[]
    distribution: { name: string; value: number; color: string }[]
}

interface AccountAnalyticsProps {
    theme?: "light" | "dark"
}

const AREA_GRADIENT_ID = "acAnalyticsGrad"

function StatCard({ icon, label, value, subValue, color, gradient }: {
    icon: React.ReactNode
    label: string
    value: string | number
    subValue?: string
    color: string
    gradient: string
}) {
    return (
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5`}>
            <div className="flex items-start justify-between mb-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-white/10`}>{icon}</div>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">{label}</p>
            <p className={`text-2xl font-black text-white leading-none`}>{value}</p>
            {subValue && <p className="text-[10px] text-white/40 mt-1">{subValue}</p>}
            {/* decorative */}
            <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/5" />
            <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/5" />
        </div>
    )
}

const CustomDot = (props: any) => {
    const { cx, cy, value } = props
    if (value === undefined) return null
    return <circle cx={cx} cy={cy} r={3} fill="#818cf8" stroke="#0a0a0a" strokeWidth={2} />
}

export function AccountAnalytics({ theme = "dark" }: AccountAnalyticsProps) {
    const { apiClient, isAuthorized, accountType, accounts, switchAccount, activeLoginId } = useDerivAPI()
    const [data, setData] = useState<AnalyticsData | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [viewType, setViewType] = useState<"Demo" | "Real">(accountType || "Demo")

    const fetchData = useCallback(async () => {
        if (!apiClient || !isAuthorized) return
        if (accountType !== viewType) return

        setIsLoading(true)
        try {
            const response = await apiClient.getProfitTable(100)
            if (response?.transactions) {
                const txs = [...response.transactions]
                const wins = txs.filter(t => (t.profit_loss || 0) > 0)
                const losses = txs.filter(t => (t.profit_loss || 0) <= 0)

                let running = 0
                const curve = txs.reverse().map((t, i) => {
                    running += (t.profit_loss || 0)
                    return { name: `T${i + 1}`, value: Number(running.toFixed(2)) }
                })

                const totalProfitSum = txs.reduce((acc, t) => acc + (t.profit_loss || 0), 0)

                setData({
                    totalTrades: txs.length,
                    wins: wins.length,
                    losses: losses.length,
                    winRate: txs.length > 0 ? (wins.length / txs.length) * 100 : 0,
                    totalProfit: totalProfitSum,
                    avgProfit: txs.length > 0 ? totalProfitSum / txs.length : 0,
                    maxWin: Math.max(...txs.map(t => (t.profit_loss || 0)), 0),
                    maxLoss: Math.min(...txs.map(t => (t.profit_loss || 0)), 0),
                    equityCurve: curve,
                    distribution: [
                        { name: "Wins", value: wins.length, color: "#10b981" },
                        { name: "Losses", value: losses.length, color: "#f43f5e" }
                    ]
                })
            } else {
                setData(null)
            }
        } catch (err) {
            console.error("[v0] Analytics fetch error:", err)
            setData(null)
        } finally {
            setIsLoading(false)
        }
    }, [apiClient, isAuthorized, accountType, viewType])

    useEffect(() => { fetchData() }, [fetchData])

    const handleSwitchAndLoad = (type: "Demo" | "Real") => {
        setViewType(type)
        const target = accounts.find(acc => acc.type === type)
        if (target && target.id !== activeLoginId) switchAccount(target.id)
    }

    const isViewMatch = accountType === viewType
    const netColor = (data?.totalProfit || 0) >= 0 ? "text-emerald-400" : "text-rose-400"

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* ─── Account Type Toggle ─── */}
            <div className="flex items-center justify-between">
                <div className="flex p-1 gap-1 bg-white/[0.03] border border-white/5 rounded-2xl">
                    {(["Real", "Demo"] as const).map(type => (
                        <button
                            key={type}
                            onClick={() => handleSwitchAndLoad(type)}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewType === type
                                ? type === "Real"
                                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                                    : "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
                                : "text-gray-500 hover:text-gray-300"
                                }`}
                        >
                            {type} Account
                        </button>
                    ))}
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:bg-white/10 transition-all"
                >
                    <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {!isViewMatch && (
                <div className="flex items-center gap-2 px-4 py-3 bg-blue-500/5 border border-blue-500/20 rounded-2xl text-xs font-bold text-blue-400">
                    <ArrowRightLeft className="h-3.5 w-3.5 animate-pulse" />
                    Switching account to load {viewType} data…
                </div>
            )}

            {data ? (
                <>
                    {/* ─── Top Stat Gradient Cards ─── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            icon={<BarChart3 className="h-5 w-5 text-white" />}
                            label="Total Trades"
                            value={data.totalTrades}
                            subValue="Last 100"
                            color="text-indigo-400"
                            gradient="from-indigo-600 to-indigo-800"
                        />
                        <StatCard
                            icon={<Trophy className="h-5 w-5 text-white" />}
                            label="Win Rate"
                            value={`${data.winRate.toFixed(1)}%`}
                            subValue={`${data.wins}W / ${data.losses}L`}
                            color="text-emerald-400"
                            gradient="from-emerald-600 to-teal-700"
                        />
                        <StatCard
                            icon={<Zap className="h-5 w-5 text-white" />}
                            label="Max Win"
                            value={`$${data.maxWin.toFixed(2)}`}
                            subValue="Single trade"
                            color="text-amber-400"
                            gradient="from-amber-500 to-orange-600"
                        />
                        <StatCard
                            icon={data.totalProfit >= 0
                                ? <TrendingUp className="h-5 w-5 text-white" />
                                : <TrendingDown className="h-5 w-5 text-white" />}
                            label="Net P&L"
                            value={`${data.totalProfit >= 0 ? "+" : ""}$${data.totalProfit.toFixed(2)}`}
                            subValue={`Avg $${data.avgProfit.toFixed(2)}/trade`}
                            color={netColor}
                            gradient={data.totalProfit >= 0 ? "from-emerald-700 to-green-900" : "from-rose-700 to-red-900"}
                        />
                    </div>

                    {/* ─── Charts Row ─── */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Equity Curve (spans 2 cols) */}
                        <div className="md:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-3xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-white mb-0.5">Equity Curve</p>
                                    <p className="text-[10px] text-gray-600">Cumulative P&amp;L over {data.totalTrades} trades</p>
                                </div>
                                <span className={`text-lg font-black ${netColor}`}>
                                    {data.totalProfit >= 0 ? "+" : ""}${data.totalProfit.toFixed(2)}
                                </span>
                            </div>
                            <div className="h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data.equityCurve} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                                        <defs>
                                            <linearGradient id={AREA_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                                                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                        <XAxis dataKey="name" hide />
                                        <YAxis
                                            stroke="transparent"
                                            tick={{ fill: "#4b5563", fontSize: 10 }}
                                            tickFormatter={v => `$${v}`}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }}
                                            itemStyle={{ color: "#818cf8" }}
                                            formatter={(v: number) => [`$${v.toFixed(2)}`, "Equity"]}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#6366f1"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill={`url(#${AREA_GRADIENT_ID})`}
                                            dot={false}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Win/Loss Donut */}
                        <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 flex flex-col">
                            <div className="mb-4">
                                <p className="text-xs font-black uppercase tracking-widest text-white mb-0.5">Performance Split</p>
                                <p className="text-[10px] text-gray-600">Win/Loss distribution</p>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <div className="relative h-[160px] w-[160px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data.distribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={70}
                                                paddingAngle={4}
                                                dataKey="value"
                                                strokeWidth={0}
                                            >
                                                {data.distribution.map((entry, i) => (
                                                    <Cell key={i} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {/* Center label */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-2xl font-black text-white">{data.winRate.toFixed(0)}%</span>
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600">Win</span>
                                    </div>
                                </div>
                                <div className="flex gap-6 mt-4">
                                    {data.distribution.map((d, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                                            <span className="text-[10px] font-bold text-gray-500">{d.name}: <span className="text-white">{d.value}</span></span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── Extra Stats Row ─── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Max Win", value: `$${data.maxWin.toFixed(2)}`, color: "text-emerald-400", icon: <TrendingUp className="h-4 w-4 text-emerald-500" /> },
                            { label: "Max Loss", value: `$${Math.abs(data.maxLoss).toFixed(2)}`, color: "text-rose-400", icon: <AlertTriangle className="h-4 w-4 text-rose-500" /> },
                            { label: "Avg Profit", value: `$${data.avgProfit.toFixed(2)}`, color: "text-blue-400", icon: <Target className="h-4 w-4 text-blue-500" /> },
                            { label: "Profit Factor", value: data.losses > 0 ? (data.wins / data.losses).toFixed(2) : "∞", color: "text-purple-400", icon: <Zap className="h-4 w-4 text-purple-500" /> },
                        ].map((s, i) => (
                            <div key={i} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
                                <div className="flex items-center gap-2 mb-3">{s.icon}</div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1">{s.label}</p>
                                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="h-[360px] flex flex-col items-center justify-center bg-[#0a0a0a] border border-white/5 border-dashed rounded-3xl">
                    {isLoading ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative w-14 h-14">
                                <div className="w-14 h-14 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                <div className="absolute inset-2 border-4 border-purple-500/20 border-b-purple-500 rounded-full animate-spin [animation-direction:reverse] [animation-duration:600ms]" />
                            </div>
                            <p className="text-gray-500 font-bold animate-pulse">Analyzing trading history…</p>
                        </div>
                    ) : (
                        <div className="text-center">
                            <BarChart3 className="h-12 w-12 text-gray-700 mx-auto mb-3" />
                            <p className="text-gray-500 font-bold text-sm">No trading data available</p>
                            <p className="text-gray-700 text-xs mt-1 max-w-xs">Start trading on this account to see your analytics dashboard here.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
