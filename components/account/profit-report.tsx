"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useDerivAPI } from "@/lib/deriv-api-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCcw, TrendingUp, TrendingDown, BarChart3, Calendar } from "lucide-react"
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

interface ProfitReportProps {
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

export function ProfitReport({ theme = "dark" }: ProfitReportProps) {
    const { apiClient, isAuthorized, activeLoginId } = useDerivAPI()
    const [profitTable, setProfitTable] = useState<ProfitTableTransaction[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [activePreset, setActivePreset] = useState("30 Days")
    const [customFrom, setCustomFrom] = useState("")
    const [customTo, setCustomTo] = useState("")
    const [showCustom, setShowCustom] = useState(false)

    const fetchProfitTable = useCallback(async (dateFrom?: number, dateTo?: number) => {
        if (!apiClient || !isAuthorized) return

        setIsLoading(true)
        setError(null)
        try {
            const response = await apiClient.getProfitTable(50, 0, dateFrom, dateTo)
            if (response && response.transactions) {
                setProfitTable(response.transactions)
            } else {
                setProfitTable([])
            }
        } catch (err: any) {
            console.error("[v0] Error fetching profit table:", err)
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

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString()
    }

    const getContractTypeBadge = (type: string) => {
        if (type.includes("CALL")) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
        if (type.includes("PUT")) return "bg-rose-500/20 text-rose-400 border-rose-500/30"
        if (type.includes("DIGIT")) return "bg-blue-500/20 text-blue-400 border-blue-500/30"
        return "bg-slate-700/20 text-slate-400 border-slate-700/30"
    }

    const totalProfit = useMemo(() => profitTable.reduce((acc, tx) => acc + tx.profit_loss, 0), [profitTable])

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                       <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-widest text-white">Profit Intelligence</h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {QUICK_PRESETS.map(p => (
                        <Button
                            key={p.label}
                            variant={activePreset === p.label ? "default" : "outline"}
                            size="sm"
                            onClick={() => applyPreset(p)}
                            className={`h-9 px-4 text-[10px] uppercase font-black tracking-widest transition-all ${activePreset === p.label 
                                ? "bg-primary hover:bg-primary/80 shadow-[0_0_15px_rgba(99,102,241,0.4)]" 
                                : "border-white/10 bg-white/5 hover:bg-white/10 text-slate-400"}`}
                        >
                            {p.label}
                        </Button>
                    ))}
                    <Button
                        variant={showCustom ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowCustom(!showCustom)}
                        className={`h-9 px-4 gap-2 text-[10px] uppercase font-black tracking-widest transition-all ${showCustom 
                            ? "bg-primary hover:bg-primary/80" 
                            : "border-white/10 bg-white/5 hover:bg-white/10 text-slate-400"}`}
                    >
                        <Calendar className="h-3 w-3" />
                        Custom
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { const p = QUICK_PRESETS.find(p => p.label === activePreset); if (p) applyPreset(p) }}
                        disabled={isLoading}
                        className="h-9 px-4 gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-slate-400"
                    >
                        <RefreshCcw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {showCustom && (
                <div className="flex flex-wrap items-end gap-3 p-4 soft-card border-white/5 rounded-xl mb-4 animate-in fade-in zoom-in duration-300">
                    <div>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5 ml-1">From Range</p>
                        <input
                            type="date"
                            value={customFrom}
                            onChange={e => setCustomFrom(e.target.value)}
                            max={new Date().toISOString().split("T")[0]}
                            min={format(subYears(new Date(), 2), "yyyy-MM-dd")}
                            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-primary/50 font-bold"
                        />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5 ml-1">To Range</p>
                        <input
                            type="date"
                            value={customTo}
                            onChange={e => setCustomTo(e.target.value)}
                            max={new Date().toISOString().split("T")[0]}
                            min={customFrom || format(subYears(new Date(), 2), "yyyy-MM-dd")}
                            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-primary/50 font-bold"
                        />
                    </div>
                    <Button
                        size="sm"
                        onClick={applyCustom}
                        disabled={!customFrom || !customTo}
                        className="bg-primary hover:bg-primary/80 h-9 px-6 font-black uppercase tracking-widest"
                    >
                        Apply Filter
                    </Button>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="p-4 rounded-xl soft-card border-white/5 group hover:border-primary/20 transition-all">
                    <div className="text-[10px] underline decoration-primary/30 underline-offset-4 uppercase font-black text-slate-500 tracking-[0.15em] mb-2">Total Executions</div>
                    <div className="text-2xl font-black text-white">{profitTable.length}</div>
                </div>
                <div className="p-4 rounded-xl soft-card border-white/5 group hover:border-primary/20 transition-all">
                    <div className="text-[10px] underline decoration-primary/30 underline-offset-4 uppercase font-black text-slate-500 tracking-[0.15em] mb-2">Net Financials</div>
                    <div className={`text-2xl font-black ${totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {totalProfit >= 0 ? "+" : ""}{totalProfit.toFixed(2)}
                    </div>
                </div>
                <div className="p-4 rounded-xl soft-card border-white/5 group hover:border-primary/20 transition-all">
                    <div className="text-[10px] underline decoration-primary/30 underline-offset-4 uppercase font-black text-slate-500 tracking-[0.15em] mb-2">Success Rate</div>
                    <div className="text-2xl font-black text-primary shadow-primary/20">
                        {profitTable.length > 0
                            ? `${((profitTable.filter(tx => tx.profit_loss > 0).length / profitTable.length) * 100).toFixed(1)}%`
                            : "0.0%"}
                    </div>
                </div>
                <div className="p-4 rounded-xl soft-card border-white/5 group hover:border-primary/20 transition-all">
                    <div className="text-[10px] underline decoration-primary/30 underline-offset-4 uppercase font-black text-slate-500 tracking-[0.15em] mb-2">Avg. Performance</div>
                    <div className="text-2xl font-black text-white">
                        {profitTable.length > 0
                            ? (totalProfit / profitTable.length).toFixed(2)
                            : "0.00"}
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                    {error}
                </div>
            )}

            <div className="rounded-xl border border-white/5 soft-card overflow-hidden">
                <Table>
                    <TableHeader className="bg-white/[0.03]">
                        <TableRow className="hover:bg-transparent border-white/5">
                            <TableHead className="w-[180px] text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 py-4">Exit Timeline</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Asset Class</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Contract Type</TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Purchase</TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Settlement</TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Net Profit/Loss</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i} className="border-slate-800/50">
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : profitTable.length > 0 ? (
                            profitTable.map((tx) => (
                                <TableRow key={tx.contract_id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                                    <TableCell className="text-[11px] text-slate-400 font-bold tracking-tight py-4">
                                        {formatDate(tx.sell_time)}
                                    </TableCell>
                                    <TableCell className="text-xs font-black text-white uppercase tracking-wider">
                                        {tx.display_name}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`text-[10px] px-2 py-0.5 h-auto font-black uppercase tracking-wider ${getContractTypeBadge(tx.contract_type)}`}>
                                            {tx.contract_type.replace(/_/g, " ")}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right text-xs font-mono text-slate-500">
                                        {tx.buy_price.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right text-xs font-mono text-slate-500">
                                        {tx.sell_price.toFixed(2)}
                                    </TableCell>
                                    <TableCell className={`text-right font-black text-sm ${tx.profit_loss >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                        <div className="flex items-center justify-end gap-1.5">
                                            {tx.profit_loss >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                                            {tx.profit_loss.toFixed(2)}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                                    {isAuthorized ? "No trading history found" : "Authorize your account to view reports"}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
