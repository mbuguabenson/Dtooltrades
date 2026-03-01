"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useDerivAPI } from "@/lib/deriv-api-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { RefreshCcw, TrendingUp, TrendingDown, BarChart3, Filter, Calendar, Target, ChevronDown } from "lucide-react"
import { format } from "date-fns"

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

export function ProfitReport({ theme = "dark" }: ProfitReportProps) {
    const { apiClient, isAuthorized, activeLoginId } = useDerivAPI()
    const [profitTable, setProfitTable] = useState<ProfitTableTransaction[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Filter states
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [durationFilter, setDurationFilter] = useState<string>("all")
    const [customRange, setCustomRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: undefined,
        to: undefined
    })

    const fetchProfitTable = useCallback(async () => {
        if (!apiClient || !isAuthorized) return

        setIsLoading(true)
        setError(null)
        try {
            const params: any = { limit: 100 }

            if (durationFilter === "custom" && customRange.from && customRange.to) {
                params.date_from = Math.floor(customRange.from.getTime() / 1000)
                params.date_to = Math.floor(customRange.to.getTime() / 1000) + 86399 // End of day
            } else if (durationFilter !== "all" && durationFilter !== "custom") {
                const now = Math.floor(Date.now() / 1000)
                const durations: Record<string, number> = {
                    "24h": 24 * 60 * 60,
                    "7d": 7 * 24 * 60 * 60,
                    "30d": 30 * 24 * 60 * 60
                }
                params.date_from = now - (durations[durationFilter] || 0)
            }

            const response = await apiClient.getProfitTable(params.limit, 0, params.date_from, params.date_to)
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
    }, [apiClient, isAuthorized, durationFilter, customRange])

    useEffect(() => {
        fetchProfitTable()
    }, [fetchProfitTable, activeLoginId])

    const filteredProfitTable = useMemo(() => {
        let filtered = [...profitTable]

        // Type filtering
        if (typeFilter !== "all") {
            filtered = filtered.filter(tx => tx.contract_type.toLowerCase().includes(typeFilter.toLowerCase()))
        }

        return filtered
    }, [profitTable, typeFilter])

    const totals = useMemo(() => {
        const profit = filteredProfitTable.reduce((acc, tx) => acc + (tx.profit_loss || 0), 0)
        const wins = filteredProfitTable.filter(tx => (tx.profit_loss || 0) > 0).length
        const total = filteredProfitTable.length

        return {
            profit,
            wins,
            total,
            winRate: total > 0 ? (wins / total) * 100 : 0,
            avg: total > 0 ? profit / total : 0
        }
    }, [filteredProfitTable])

    const formatDate = (timestamp: number) => {
        if (!timestamp) return "N/A"
        return new Date(timestamp * 1000).toLocaleString()
    }

    const getContractTypeBadge = (type: string) => {
        if (!type) return "bg-slate-700/20 text-slate-400 border-slate-700/30"
        const t = type.toUpperCase()
        if (t.includes("CALL")) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
        if (t.includes("PUT")) return "bg-rose-500/20 text-rose-400 border-rose-500/30"
        if (t.includes("DIGIT")) return "bg-blue-500/20 text-blue-400 border-blue-500/30"
        return "bg-slate-700/20 text-slate-400 border-slate-700/30"
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-500" />
                    <h3 className="text-lg font-bold">Trading Profit Report</h3>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-700/50">
                        <Filter className="h-3.5 w-3.5 text-slate-400" />
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="h-7 border-none bg-transparent focus:ring-0 text-xs font-bold">
                                <SelectValue placeholder="All Contracts" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800">
                                <SelectItem value="all">All Contracts</SelectItem>
                                <SelectItem value="CALL">Rise (Call)</SelectItem>
                                <SelectItem value="PUT">Fall (Put)</SelectItem>
                                <SelectItem value="DIGIT">Digits</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-700/50">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <Select value={durationFilter} onValueChange={setDurationFilter}>
                            <SelectTrigger className="h-7 border-none bg-transparent focus:ring-0 text-xs font-bold">
                                <SelectValue placeholder="Duration" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800">
                                <SelectItem value="all">All Time</SelectItem>
                                <SelectItem value="24h">Last 24 Hours</SelectItem>
                                <SelectItem value="7d">Last 7 Days</SelectItem>
                                <SelectItem value="30d">Last 30 Days</SelectItem>
                                <SelectItem value="custom">Custom Range</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {durationFilter === "custom" && (
                        <div className="flex items-center gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9 px-3 bg-slate-800/50 border-slate-700/50 text-xs gap-2 rounded-xl">
                                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                        {customRange.from ? format(customRange.from, "PP") : "Start Date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-800" align="start">
                                    <CalendarComponent
                                        mode="single"
                                        selected={customRange.from}
                                        onSelect={(date) => setCustomRange(prev => ({ ...prev, from: date }))}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <span className="text-slate-600">to</span>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9 px-3 bg-slate-800/50 border-slate-700/50 text-xs gap-2 rounded-xl">
                                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                        {customRange.to ? format(customRange.to, "PP") : "End Date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-800" align="start">
                                    <CalendarComponent
                                        mode="single"
                                        selected={customRange.to}
                                        onSelect={(date) => setCustomRange(prev => ({ ...prev, to: date }))}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchProfitTable}
                        disabled={isLoading}
                        className="h-8 gap-2 text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                        <RefreshCcw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Total Trades</p>
                    <div className="text-2xl font-black text-slate-200">{totals.total}</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Total Profit</p>
                    <div className={`text-2xl font-black ${totals.profit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {totals.profit >= 0 ? "+" : ""}{totals.profit.toFixed(2)}
                    </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Win Rate</p>
                    <div className="text-2xl font-black text-blue-400">{totals.winRate.toFixed(1)}%</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Avg per Trade</p>
                    <div className="text-2xl font-black text-slate-200">{totals.avg.toFixed(2)}</div>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                    {error}
                </div>
            )}

            <div className="rounded-2xl border border-slate-800 overflow-hidden shadow-2xl bg-slate-950/20">
                <Table>
                    <TableHeader className="bg-slate-900/80">
                        <TableRow className="hover:bg-transparent border-slate-800 h-12">
                            <TableHead className="w-[180px] text-xs font-bold uppercase tracking-wider text-slate-500">Exit Time</TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Market / Contract</TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Type</TableHead>
                            <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-slate-500">Purchase</TableHead>
                            <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-slate-500">Sale</TableHead>
                            <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-slate-500">Profit/Loss</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i} className="border-slate-800/50 h-16">
                                    <TableCell><Skeleton className="h-4 w-32 bg-slate-800" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32 bg-slate-800" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16 mx-auto bg-slate-800" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20 ml-auto bg-slate-800" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20 ml-auto bg-slate-800" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20 ml-auto bg-slate-800" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredProfitTable.length > 0 ? (
                            filteredProfitTable.map((tx) => (
                                <TableRow key={tx.contract_id} className="border-slate-800/50 hover:bg-slate-800/30 transition-colors h-16">
                                    <TableCell className="text-[11px] text-slate-400 font-mono">
                                        {formatDate(tx.sell_time)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-200">{tx.display_name}</span>
                                            <span className="text-[10px] text-slate-500 font-mono">{tx.contract_id}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className={`text-[10px] px-2 py-0 h-5 font-black whitespace-nowrap uppercase tracking-tighter ${getContractTypeBadge(tx.contract_type)}`}>
                                            {(tx.contract_type || "UNKNOWN").replace(/_/g, " ")}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right text-[11px] font-mono text-slate-400">
                                        {(tx.buy_price || 0).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right text-[11px] font-mono text-slate-400">
                                        {(tx.sell_price || 0).toFixed(2)}
                                    </TableCell>
                                    <TableCell className={`text-right font-black ${(tx.profit_loss || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                        <div className="flex items-center justify-end gap-1.5">
                                            {tx.profit_loss >= 0 ? (
                                                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                    <TrendingUp className="h-3 w-3" />
                                                </div>
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-rose-500/10 flex items-center justify-center">
                                                    <TrendingDown className="h-3 w-3" />
                                                </div>
                                            )}
                                            {(tx.profit_loss || 0).toFixed(2)}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center bg-slate-900/20">
                                    <div className="flex flex-col items-center justify-center gap-2 opacity-40">
                                        <Target className="h-8 w-8 text-slate-500" />
                                        <p className="text-sm font-bold">
                                            {isAuthorized ? "No matching profit history found" : "Authorize your account to view reports"}
                                        </p>
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
