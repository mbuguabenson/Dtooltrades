"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useDerivAPI } from "@/lib/deriv-api-context"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCcw, TrendingUp, TrendingDown, Target, BarChart3, Calendar, Filter, Trophy } from "lucide-react"
import { format, subDays, subMonths, subYears } from "date-fns"

interface ProfitTableTransaction {
    app_id: number
    buy_price: number
    contract_id: number
    contract_type: string
    display_name: string
    longcode: string
    payout: number
    profit_loss: number
    purchase_time: number
    sell_price: number
    sell_time: number
    shortcode: string
    transaction_id: number
}

interface ProfitReportProps { theme?: "light" | "dark" }

const QUICK_PRESETS = [
    { label: "Today", getRange: () => ({ from: new Date(new Date().setHours(0, 0, 0, 0)), to: new Date() }) },
    { label: "7 Days", getRange: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
    { label: "30 Days", getRange: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
    { label: "3 Months", getRange: () => ({ from: subMonths(new Date(), 3), to: new Date() }) },
    { label: "6 Months", getRange: () => ({ from: subMonths(new Date(), 6), to: new Date() }) },
    { label: "1 Year", getRange: () => ({ from: subYears(new Date(), 1), to: new Date() }) },
    { label: "2 Years", getRange: () => ({ from: subYears(new Date(), 2), to: new Date() }) },
]

function parseContractLabel(contractType: string): { label: string; color: string } {
    const ct = (contractType || "").toUpperCase()
    if (ct === "DIGITEVEN") return { label: "Even", color: "bg-blue-500/15 text-blue-400 border-blue-500/25" }
    if (ct === "DIGITODD") return { label: "Odd", color: "bg-indigo-500/15 text-indigo-400 border-indigo-500/25" }
    if (ct.startsWith("DIGITOVER")) return { label: "Over", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" }
    if (ct.startsWith("DIGITUNDER")) return { label: "Under", color: "bg-orange-500/15 text-orange-400 border-orange-500/25" }
    if (ct === "DIGITDIFF") return { label: "Differs", color: "bg-purple-500/15 text-purple-400 border-purple-500/25" }
    if (ct === "DIGITMATCH") return { label: "Matches", color: "bg-teal-500/15 text-teal-400 border-teal-500/25" }
    if (ct === "CALL" || ct === "CALLE") return { label: "Rise", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" }
    if (ct === "PUT" || ct === "PUTE") return { label: "Fall", color: "bg-rose-500/15 text-rose-400 border-rose-500/25" }
    if (ct.includes("TOUCH")) return { label: "Touch", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25" }
    if (ct.includes("ACCUMULATOR")) return { label: "Accum.", color: "bg-amber-500/15 text-amber-400 border-amber-500/25" }
    if (ct.includes("MULTIPLIER")) return { label: "Multi.", color: "bg-violet-500/15 text-violet-400 border-violet-500/25" }
    return { label: ct.slice(0, 8) || "—", color: "bg-gray-500/15 text-gray-400 border-gray-500/25" }
}

export function ProfitReport({ theme = "dark" }: ProfitReportProps) {
    const { apiClient, isAuthorized, activeLoginId } = useDerivAPI()
    const [profitTable, setProfitTable] = useState<ProfitTableTransaction[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [typeFilter, setTypeFilter] = useState("all")
    const [activePreset, setActivePreset] = useState("30 Days")
    const [customFrom, setCustomFrom] = useState("")
    const [customTo, setCustomTo] = useState("")
    const [showCustom, setShowCustom] = useState(false)

    const fetchProfitTable = useCallback(async (dateFrom?: number, dateTo?: number) => {
        if (!apiClient || !isAuthorized) return
        setIsLoading(true)
        setError(null)
        try {
            const response = await apiClient.getProfitTable(500, 0, dateFrom, dateTo)
            setProfitTable(response?.transactions ?? [])
        } catch (err: any) {
            setError(err?.message || "Failed to fetch profit table")
        } finally {
            setIsLoading(false)
        }
    }, [apiClient, isAuthorized])

    const applyPreset = (preset: typeof QUICK_PRESETS[0]) => {
        setActivePreset(preset.label)
        setShowCustom(false)
        const { from, to } = preset.getRange()
        fetchProfitTable(Math.floor(from.getTime() / 1000), Math.floor(to.getTime() / 1000))
    }

    const applyCustom = () => {
        if (!customFrom || !customTo) return
        const from = new Date(customFrom)
        const to = new Date(customTo)
        to.setHours(23, 59, 59, 999)
        fetchProfitTable(Math.floor(from.getTime() / 1000), Math.floor(to.getTime() / 1000))
        setActivePreset("Custom")
        setShowCustom(false)
    }

    useEffect(() => {
        const from = subDays(new Date(), 30)
        fetchProfitTable(Math.floor(from.getTime() / 1000))
    }, [fetchProfitTable, activeLoginId])

    const filtered = useMemo(() => {
        if (typeFilter === "all") return profitTable
        return profitTable.filter(tx => {
            const ct = (tx.contract_type || "").toUpperCase()
            if (typeFilter === "even_odd") return ct === "DIGITEVEN" || ct === "DIGITODD"
            if (typeFilter === "over_under") return ct.startsWith("DIGITOVER") || ct.startsWith("DIGITUNDER")
            if (typeFilter === "differs") return ct === "DIGITDIFF" || ct === "DIGITMATCH"
            if (typeFilter === "rise_fall") return ct === "CALL" || ct === "PUT" || ct === "CALLE" || ct === "PUTE"
            if (typeFilter === "win") return (tx.profit_loss || 0) > 0
            if (typeFilter === "loss") return (tx.profit_loss || 0) <= 0
            return true
        })
    }, [profitTable, typeFilter])

    const totals = useMemo(() => {
        const profit = filtered.reduce((acc, tx) => acc + (tx.profit_loss || 0), 0)
        const wins = filtered.filter(tx => (tx.profit_loss || 0) > 0)
        const losses = filtered.filter(tx => (tx.profit_loss || 0) <= 0)
        const winPnl = wins.reduce((s, t) => s + (t.profit_loss || 0), 0)
        const lossPnl = Math.abs(losses.reduce((s, t) => s + (t.profit_loss || 0), 0))
        return {
            profit, total: filtered.length,
            wins: wins.length, losses: losses.length,
            winRate: filtered.length > 0 ? (wins.length / filtered.length) * 100 : 0,
            avgPnl: filtered.length > 0 ? profit / filtered.length : 0,
            profitFactor: lossPnl > 0 ? winPnl / lossPnl : wins.length > 0 ? Infinity : 0,
        }
    }, [filtered])

    const formatDate = (ts: number) => ts ? new Date(ts * 1000).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }) : "—"

    const FILTERS = [
        { value: "all", label: "All" },
        { value: "even_odd", label: "Even/Odd" },
        { value: "over_under", label: "Over/Under" },
        { value: "differs", label: "Differs" },
        { value: "rise_fall", label: "Rise/Fall" },
        { value: "win", label: "Wins Only" },
        { value: "loss", label: "Losses Only" },
    ]

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header + Filters */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
                            <BarChart3 className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white">Trade Journal</h3>
                            <p className="text-[10px] text-gray-600 mt-0.5">{filtered.length} of {profitTable.length} trades shown</p>
                        </div>
                    </div>
                    <button onClick={() => { const p = QUICK_PRESETS.find(p => p.label === activePreset); if (p) applyPreset(p) }} disabled={isLoading}
                        className="w-9 h-9 flex items-center justify-center bg-white/5 border border-white/5 rounded-xl text-gray-500 hover:text-purple-400 transition-all">
                        <RefreshCcw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                    </button>
                </div>

                {/* Quick date presets */}
                <div className="flex flex-wrap gap-2 mb-3">
                    {QUICK_PRESETS.map(p => (
                        <button key={p.label} onClick={() => applyPreset(p)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${activePreset === p.label ? "bg-purple-500/15 border-purple-500/30 text-purple-400" : "bg-white/[0.02] border-white/5 text-gray-600 hover:text-gray-400"}`}>
                            {p.label}
                        </button>
                    ))}
                    <button onClick={() => setShowCustom(!showCustom)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${showCustom ? "bg-blue-500/15 border-blue-500/30 text-blue-400" : "bg-white/[0.02] border-white/5 text-gray-600 hover:text-gray-400"}`}>
                        <Calendar className="h-3 w-3 inline mr-1" /> Custom
                    </button>
                </div>

                {showCustom && (
                    <div className="flex flex-wrap items-end gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl mb-3">
                        <div>
                            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-1">From</p>
                            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                                max={new Date().toISOString().split("T")[0]} min={format(subYears(new Date(), 2), "yyyy-MM-dd")}
                                className="bg-[#0d0d0d] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-1">To</p>
                            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                                max={new Date().toISOString().split("T")[0]} min={customFrom || format(subYears(new Date(), 2), "yyyy-MM-dd")}
                                className="bg-[#0d0d0d] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50" />
                        </div>
                        <button onClick={applyCustom} disabled={!customFrom || !customTo}
                            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black rounded-xl disabled:opacity-40 transition-all">Apply</button>
                    </div>
                )}

                {/* Type filter pills */}
                <div className="flex flex-wrap gap-2">
                    {FILTERS.map(f => (
                        <button key={f.value} onClick={() => setTypeFilter(f.value)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${typeFilter === f.value ? "bg-purple-600 text-white border-purple-600" : "bg-white/[0.02] border-white/5 text-gray-600 hover:text-gray-300"}`}>
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Trades", value: totals.total, color: "text-indigo-400", grad: "from-indigo-600/20 to-indigo-900/10", border: "border-indigo-500/20", icon: <BarChart3 className="h-4 w-4" /> },
                    { label: "Win Rate", value: `${totals.winRate.toFixed(1)}%`, color: "text-emerald-400", grad: "from-emerald-600/20 to-emerald-900/10", border: "border-emerald-500/20", icon: <Trophy className="h-4 w-4" /> },
                    { label: "Net P&L", value: `${totals.profit >= 0 ? "+" : ""}$${totals.profit.toFixed(2)}`, color: totals.profit >= 0 ? "text-emerald-400" : "text-rose-400", grad: totals.profit >= 0 ? "from-emerald-700/20 to-emerald-900/10" : "from-rose-700/20 to-rose-900/10", border: totals.profit >= 0 ? "border-emerald-500/20" : "border-rose-500/20", icon: totals.profit >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" /> },
                    { label: "Profit Factor", value: totals.profitFactor === Infinity ? "∞" : totals.profitFactor.toFixed(2), color: "text-purple-400", grad: "from-purple-600/20 to-purple-900/10", border: "border-purple-500/20", icon: <Target className="h-4 w-4" /> },
                ].map((s, i) => (
                    <div key={i} className={`relative overflow-hidden bg-gradient-to-br ${s.grad} border ${s.border} rounded-2xl p-5`}>
                        <div className={`${s.color} mb-3`}>{s.icon}</div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1">{s.label}</p>
                        <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                        <div className="absolute -bottom-3 -right-3 w-14 h-14 rounded-full bg-white/5" />
                    </div>
                ))}
            </div>

            {error && <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">{error}</div>}

            {/* Trade Journal Table */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] grid grid-cols-[140px_160px_80px_80px_80px_80px_100px] gap-3 text-[10px] font-black uppercase tracking-widest text-gray-600">
                    <span>Opened</span>
                    <span>Market / Contract</span>
                    <span className="text-center">Type</span>
                    <span className="text-right">Stake</span>
                    <span className="text-right">Payout</span>
                    <span className="text-right">Sale</span>
                    <span className="text-right">P / L</span>
                </div>
                <div className="divide-y divide-white/[0.03]">
                    {isLoading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="grid grid-cols-[140px_160px_80px_80px_80px_80px_100px] gap-3 px-6 py-4">
                                {Array.from({ length: 7 }).map((_, j) => <Skeleton key={j} className="h-4 bg-white/5 rounded-lg" />)}
                            </div>
                        ))
                    ) : filtered.length > 0 ? (
                        filtered.map(tx => {
                            const { label, color } = parseContractLabel(tx.contract_type)
                            const isWin = (tx.profit_loss || 0) > 0
                            return (
                                <div key={tx.contract_id} className="grid grid-cols-[140px_160px_80px_80px_80px_80px_100px] gap-3 px-6 py-4 hover:bg-white/[0.015] transition-colors items-center">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-mono">{formatDate(tx.purchase_time)}</p>
                                        <p className="text-[9px] text-gray-700 font-mono mt-0.5">→ {formatDate(tx.sell_time)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white truncate">{tx.display_name}</p>
                                        <p className="text-[9px] text-gray-700 font-mono">{tx.contract_id}</p>
                                    </div>
                                    <div className="flex justify-center">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${color}`}>{label}</span>
                                    </div>
                                    <p className="text-right text-[11px] font-mono text-gray-400">{(tx.buy_price || 0).toFixed(2)}</p>
                                    <p className="text-right text-[11px] font-mono text-gray-400">{(tx.payout || 0).toFixed(2)}</p>
                                    <p className="text-right text-[11px] font-mono text-gray-400">{(tx.sell_price || 0).toFixed(2)}</p>
                                    <div className="flex items-center justify-end gap-1.5">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isWin ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
                                            {isWin ? <TrendingUp className="h-3 w-3 text-emerald-400" /> : <TrendingDown className="h-3 w-3 text-rose-400" />}
                                        </div>
                                        <span className={`text-sm font-black ${isWin ? "text-emerald-400" : "text-rose-400"}`}>
                                            {isWin ? "+" : ""}{(tx.profit_loss || 0).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 gap-2 opacity-30">
                            <Target className="h-8 w-8 text-gray-500" />
                            <p className="text-sm font-bold">{isAuthorized ? "No trades found for this filter/range" : "Authorize your account to view reports"}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
