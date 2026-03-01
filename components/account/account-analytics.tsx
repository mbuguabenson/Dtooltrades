"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useDerivAPI } from "@/lib/deriv-api-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from "recharts"
import { BarChart3, TrendingUp, TrendingDown, Target, Zap, ArrowRightLeft } from "lucide-react"

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

export function AccountAnalytics({ theme = "dark" }: AccountAnalyticsProps) {
    const { apiClient, isAuthorized, activeLoginId, accountType, accounts, switchAccount } = useDerivAPI()
    const [data, setData] = useState<AnalyticsData | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [viewType, setViewType] = useState<"Demo" | "Real">(accountType || "Demo")

    const fetchData = useCallback(async () => {
        if (!apiClient || !isAuthorized) return

        // Only fetch if the current authorized account matches the viewed type
        // (In a more advanced version, we'd handle background auth for the other type)
        if (accountType !== viewType) return

        setIsLoading(true)
        try {
            const response = await apiClient.getProfitTable(100)
            if (response && response.transactions) {
                const txs = response.transactions
                const wins = txs.filter(t => t.profit_loss > 0)
                const losses = txs.filter(t => t.profit_loss <= 0)

                let currentEquity = 0
                const curve = txs.reverse().map((t, i) => {
                    currentEquity += t.profit_loss
                    return { name: `T${i + 1}`, value: Number(currentEquity.toFixed(2)) }
                })

                setData({
                    totalTrades: txs.length,
                    wins: wins.length,
                    losses: losses.length,
                    winRate: txs.length > 0 ? (wins.length / txs.length) * 100 : 0,
                    totalProfit: txs.reduce((acc, t) => acc + t.profit_loss, 0),
                    avgProfit: txs.length > 0 ? txs.reduce((acc, t) => acc + t.profit_loss, 0) / txs.length : 0,
                    maxWin: Math.max(...txs.map(t => t.profit_loss), 0),
                    maxLoss: Math.min(...txs.map(t => t.profit_loss), 0),
                    equityCurve: curve,
                    distribution: [
                        { name: "Wins", value: wins.length, color: "#10b981" },
                        { name: "Losses", value: losses.length, color: "#f43f5e" }
                    ]
                })
            }
        } catch (err) {
            console.error("[v0] Analytics fetch error:", err)
        } finally {
            setIsLoading(false)
        }
    }, [apiClient, isAuthorized, accountType, viewType])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleSwitchAndLoad = (type: "Demo" | "Real") => {
        setViewType(type)
        const targetAccount = accounts.find(acc => acc.type === type)
        if (targetAccount && targetAccount.id !== activeLoginId) {
            switchAccount(targetAccount.id)
        }
    }

    const isViewMatch = accountType === viewType

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/40 p-1 rounded-2xl border border-slate-800">
                <div className="flex p-1 gap-1">
                    <Button
                        variant={viewType === "Real" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handleSwitchAndLoad("Real")}
                        className={`rounded-xl px-6 ${viewType === "Real" ? "bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20" : "text-slate-400"}`}
                    >
                        Real Account
                    </Button>
                    <Button
                        variant={viewType === "Demo" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handleSwitchAndLoad("Demo")}
                        className={`rounded-xl px-6 ${viewType === "Demo" ? "bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20 text-white" : "text-slate-400"}`}
                    >
                        Demo Account
                    </Button>
                </div>
                {!isViewMatch && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] font-bold text-blue-400 animate-pulse mr-2">
                        <ArrowRightLeft className="h-3 w-3" />
                        Switching account to load data...
                    </div>
                )}
            </div>

            {data ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-slate-900/50 border-slate-800 md:col-span-2">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                                    Equity Growth
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[250px] w-full mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={data.equityCurve}>
                                            <defs>
                                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                            <XAxis dataKey="name" hide />
                                            <YAxis stroke="#475569" fontSize={10} tickFormatter={(value) => `$${value}`} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }}
                                                itemStyle={{ color: "#3b82f6" }}
                                            />
                                            <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-900/50 border-slate-800">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <Target className="h-4 w-4 text-blue-400" />
                                    Performance Split
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center">
                                <div className="h-[200px] w-full mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data.distribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {data.distribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex gap-4 mt-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <span className="text-xs text-slate-400">Wins: {data.wins}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                        <span className="text-xs text-slate-400">Losses: {data.losses}</span>
                                    </div>
                                </div>
                                <div className="mt-6 text-center">
                                    <div className="text-3xl font-black text-blue-400">{data.winRate.toFixed(1)}%</div>
                                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-tighter">Overall Win Rate</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 group hover:border-blue-500/30 transition-all">
                            <Zap className="h-4 w-4 text-yellow-400 mb-2" />
                            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Max Win</div>
                            <div className="text-lg font-black text-emerald-400">${data.maxWin.toFixed(2)}</div>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 group hover:border-blue-500/30 transition-all">
                            <TrendingDown className="h-4 w-4 text-rose-400 mb-2" />
                            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Max Loss</div>
                            <div className="text-lg font-black text-rose-400">${data.maxLoss.toFixed(2)}</div>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 group hover:border-blue-500/30 transition-all">
                            <BarChart3 className="h-4 w-4 text-purple-400 mb-2" />
                            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Avg Profit</div>
                            <div className="text-lg font-black text-blue-400">${data.avgProfit.toFixed(2)}</div>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 group hover:border-blue-500/30 transition-all">
                            <TrendingUp className="h-4 w-4 text-blue-400 mb-2" />
                            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Total Net</div>
                            <div className={`text-lg font-black ${data.totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                ${data.totalProfit.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="h-[400px] flex flex-col items-center justify-center bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl">
                    {isLoading ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                            <p className="text-slate-400 animate-pulse">Analyzing trading history...</p>
                        </div>
                    ) : (
                        <p className="text-slate-500">No trading data available for this account type.</p>
                    )}
                </div>
            )}
        </div>
    )
}
