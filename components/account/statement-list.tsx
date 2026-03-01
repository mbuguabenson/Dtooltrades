"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useDerivAPI } from "@/lib/deriv-api-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCcw, ArrowUpRight, ArrowDownLeft, ReceiptText, Filter, Calendar, Calculator } from "lucide-react"
import { format, subDays, subMonths, subYears } from "date-fns"

interface StatementTransaction {
    action_type: string
    amount: number
    balance_after: number
    contract_id?: number
    display_name: string
    longcode: string
    transaction_id: number
    transaction_time: number
    reference_id: number
}

interface StatementListProps {
    theme?: "light" | "dark"
}

const QUICK_PRESETS = [
    { label: "Today", getRange: () => ({ from: new Date(new Date().setHours(0, 0, 0, 0)), to: new Date() }) },
    { label: "7 Days", getRange: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
    { label: "30 Days", getRange: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
    { label: "3 Months", getRange: () => ({ from: subMonths(new Date(), 3), to: new Date() }) },
    { label: "6 Months", getRange: () => ({ from: subMonths(new Date(), 6), to: new Date() }) },
    { label: "1 Year", getRange: () => ({ from: subYears(new Date(), 1), to: new Date() }) },
    { label: "2 Years", getRange: () => ({ from: subYears(new Date(), 2), to: new Date() }) },
]

const ACTION_COLORS: Record<string, string> = {
    buy: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    sell: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    deposit: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    withdrawal: "text-rose-400 bg-rose-500/10 border-rose-500/20",
}

export function StatementList({ theme = "dark" }: StatementListProps) {
    const { apiClient, isAuthorized, activeLoginId } = useDerivAPI()
    const [statement, setStatement] = useState<StatementTransaction[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [activePreset, setActivePreset] = useState<string>("30 Days")
    const [customFrom, setCustomFrom] = useState("")
    const [customTo, setCustomTo] = useState("")
    const [showCustom, setShowCustom] = useState(false)

    const fetchStatement = useCallback(async (dateFrom?: number, dateTo?: number) => {
        if (!apiClient || !isAuthorized) return
        setIsLoading(true)
        setError(null)
        try {
            const response = await apiClient.getStatement(500, 0, dateFrom, dateTo)
            setStatement(response?.transactions ?? [])
        } catch (err: any) {
            setError(err?.message || "Failed to fetch statement")
        } finally {
            setIsLoading(false)
        }
    }, [apiClient, isAuthorized])

    const applyPreset = (preset: typeof QUICK_PRESETS[0]) => {
        setActivePreset(preset.label)
        setShowCustom(false)
        const { from, to } = preset.getRange()
        fetchStatement(Math.floor(from.getTime() / 1000), Math.floor(to.getTime() / 1000))
    }

    const applyCustom = () => {
        if (!customFrom || !customTo) return
        const from = new Date(customFrom)
        const to = new Date(customTo)
        to.setHours(23, 59, 59, 999)
        fetchStatement(Math.floor(from.getTime() / 1000), Math.floor(to.getTime() / 1000))
        setActivePreset("Custom")
        setShowCustom(false)
    }

    useEffect(() => {
        // Default: last 30 days
        const from = subDays(new Date(), 30)
        fetchStatement(Math.floor(from.getTime() / 1000))
    }, [fetchStatement, activeLoginId])

    const filtered = useMemo(() => {
        if (typeFilter === "all") return statement
        return statement.filter(tx => (tx.action_type || "").toLowerCase() === typeFilter)
    }, [statement, typeFilter])

    const totals = useMemo(() => {
        const credit = filtered.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
        const debit = filtered.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
        return { credit, debit, net: credit - debit }
    }, [filtered])

    const formatDate = (ts: number) => ts ? new Date(ts * 1000).toLocaleString() : "N/A"
    const actionColor = (a: string) => ACTION_COLORS[a?.toLowerCase()] || "text-gray-400 bg-white/5 border-white/10"

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <ReceiptText className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white">Transaction Statement</h3>
                            <p className="text-[10px] text-gray-600 mt-0.5">{filtered.length} of {statement.length} records</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Type filter */}
                        <div className="flex items-center gap-1 bg-white/[0.03] border border-white/5 rounded-xl p-1">
                            {["all", "buy", "sell", "deposit", "withdrawal"].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setTypeFilter(t)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${typeFilter === t ? "bg-blue-500 text-white" : "text-gray-500 hover:text-gray-300"}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => { const p = QUICK_PRESETS.find(p => p.label === activePreset); if (p) applyPreset(p) }}
                            disabled={isLoading}
                            className="w-9 h-9 flex items-center justify-center bg-white/5 border border-white/5 rounded-xl text-gray-500 hover:text-blue-400 transition-all"
                        >
                            <RefreshCcw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                        </button>
                    </div>
                </div>

                {/* Date presets */}
                <div className="flex flex-wrap gap-2">
                    {QUICK_PRESETS.map(p => (
                        <button
                            key={p.label}
                            onClick={() => applyPreset(p)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${activePreset === p.label
                                ? "bg-blue-500/15 border-blue-500/30 text-blue-400"
                                : "bg-white/[0.02] border-white/5 text-gray-600 hover:text-gray-400 hover:border-white/10"
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                    <button
                        onClick={() => setShowCustom(!showCustom)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${showCustom
                            ? "bg-purple-500/15 border-purple-500/30 text-purple-400"
                            : "bg-white/[0.02] border-white/5 text-gray-600 hover:text-gray-400"
                            }`}
                    >
                        <Calendar className="h-3 w-3 inline mr-1" />
                        Custom Range
                    </button>
                </div>

                {/* Custom date range */}
                {showCustom && (
                    <div className="mt-4 flex flex-wrap items-end gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <div>
                            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-1">From</p>
                            <input
                                type="date"
                                value={customFrom}
                                onChange={e => setCustomFrom(e.target.value)}
                                max={new Date().toISOString().split("T")[0]}
                                min={format(subYears(new Date(), 2), "yyyy-MM-dd")}
                                className="bg-[#0a0a0a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                            />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-1">To</p>
                            <input
                                type="date"
                                value={customTo}
                                onChange={e => setCustomTo(e.target.value)}
                                max={new Date().toISOString().split("T")[0]}
                                min={customFrom || format(subYears(new Date(), 2), "yyyy-MM-dd")}
                                className="bg-[#0a0a0a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                            />
                        </div>
                        <button
                            onClick={applyCustom}
                            disabled={!customFrom || !customTo}
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl disabled:opacity-40 transition-all"
                        >
                            Apply
                        </button>
                    </div>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Total Credit", value: `+${totals.credit.toFixed(2)}`, color: "text-emerald-400", bg: "from-emerald-600/20 to-emerald-800/10", icon: <ArrowDownLeft className="h-5 w-5 text-emerald-400" /> },
                    { label: "Total Debit", value: `-${totals.debit.toFixed(2)}`, color: "text-rose-400", bg: "from-rose-600/20 to-rose-800/10", icon: <ArrowUpRight className="h-5 w-5 text-rose-400" /> },
                    { label: "Net Movement", value: `${totals.net >= 0 ? "+" : ""}${totals.net.toFixed(2)}`, color: totals.net >= 0 ? "text-blue-400" : "text-rose-400", bg: "from-blue-600/20 to-blue-800/10", icon: <Calculator className="h-5 w-5 text-blue-400" /> },
                ].map((s, i) => (
                    <div key={i} className={`relative overflow-hidden bg-gradient-to-br ${s.bg} border border-white/5 rounded-2xl p-5`}>
                        <div className="flex items-center justify-between mb-2">{s.icon}</div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1">{s.label}</p>
                        <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {error && <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">{error}</div>}

            {/* Table */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-white/5">
                            {["Date & Time", "Reference", "Type", "Transaction ID", "Amount", "Balance After"].map(h => (
                                <TableHead key={h} className="text-[10px] font-black uppercase tracking-widest text-gray-600 bg-white/[0.02] border-b border-white/5 py-4">
                                    {h}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <TableRow key={i} className="border-white/[0.03]">
                                    {Array.from({ length: 6 }).map((_, j) => (
                                        <TableCell key={j}><Skeleton className="h-4 w-24 bg-white/5 rounded-lg" /></TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : filtered.length > 0 ? (
                            filtered.map(tx => (
                                <TableRow key={tx.transaction_id} className="border-white/[0.03] hover:bg-white/[0.015] transition-colors">
                                    <TableCell className="text-[11px] text-gray-500 font-mono whitespace-nowrap py-4">
                                        {formatDate(tx.transaction_time)}
                                    </TableCell>
                                    <TableCell className="text-[11px] font-mono text-gray-600">{tx.reference_id}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${actionColor(tx.action_type)}`}>
                                            {tx.action_type}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-[11px] font-mono text-gray-600">{tx.transaction_id}</TableCell>
                                    <TableCell className={`font-black text-sm ${tx.amount > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                        {tx.amount > 0 ? "+" : ""}{(tx.amount || 0).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="font-bold text-white text-sm">
                                        {(tx.balance_after || 0).toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2 opacity-30">
                                        <ReceiptText className="h-8 w-8 text-gray-500" />
                                        <p className="text-sm font-bold">{isAuthorized ? "No transactions found for this range" : "Authorize your account to view statements"}</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
