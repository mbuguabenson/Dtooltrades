"use client"

import { useState, useEffect, useCallback } from "react"
import { useDerivAPI } from "@/lib/deriv-api-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCcw, TrendingUp, TrendingDown, BarChart3 } from "lucide-react"

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

    const fetchProfitTable = useCallback(async () => {
        if (!apiClient || !isAuthorized) return

        setIsLoading(true)
        setError(null)
        try {
            const response = await apiClient.getProfitTable(50)
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

    useEffect(() => {
        fetchProfitTable()
    }, [fetchProfitTable, activeLoginId])

    const formatDate = (timestamp: number) => {
        if (!timestamp) return "N/A"
        return new Date(timestamp * 1000).toLocaleString()
    }

    const getContractTypeBadge = (type: string) => {
        if (!type) return "bg-slate-700/20 text-slate-400 border-slate-700/30"
        if (type.includes("CALL")) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
        if (type.includes("PUT")) return "bg-rose-500/20 text-rose-400 border-rose-500/30"
        if (type.includes("DIGIT")) return "bg-blue-500/20 text-blue-400 border-blue-500/30"
        return "bg-slate-700/20 text-slate-400 border-slate-700/30"
    }

    const totalProfit = profitTable.reduce((acc, tx) => acc + (tx.profit_loss || 0), 0)

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-500" />
                    <h3 className="text-lg font-bold">Trading Profit Report</h3>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchProfitTable}
                    disabled={isLoading}
                    className="h-8 gap-2 border-slate-700/50 hover:bg-slate-800"
                >
                    <RefreshCcw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Total Trades</div>
                    <div className="text-xl font-black">{profitTable.length}</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Total Profit</div>
                    <div className={`text-xl font-black ${totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {totalProfit.toFixed(2)}
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Win Rate</div>
                    <div className="text-xl font-black text-blue-400">
                        {profitTable.length > 0
                            ? `${((profitTable.filter(tx => (tx.profit_loss || 0) > 0).length / profitTable.length) * 100).toFixed(1)}%`
                            : "0%"}
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Average Profit</div>
                    <div className="text-xl font-black">
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

            <div className="rounded-xl border border-slate-800 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-900/80">
                        <TableRow className="hover:bg-transparent border-slate-800">
                            <TableHead className="w-[180px]">Exit Time</TableHead>
                            <TableHead>Contract</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Purchase</TableHead>
                            <TableHead className="text-right">Sale</TableHead>
                            <TableHead className="text-right">Profit/Loss</TableHead>
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
                                <TableRow key={tx.contract_id} className="border-slate-800/50 hover:bg-slate-800/30">
                                    <TableCell className="text-xs text-slate-400 font-mono">
                                        {formatDate(tx.sell_time)}
                                    </TableCell>
                                    <TableCell className="text-xs font-bold text-slate-200">
                                        {tx.display_name}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`text-[10px] px-2 py-0 h-5 font-bold whitespace-nowrap ${getContractTypeBadge(tx.contract_type)}`}>
                                            {(tx.contract_type || "UNKNOWN").replace(/_/g, " ")}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right text-xs font-mono text-slate-400">
                                        {(tx.buy_price || 0).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right text-xs font-mono text-slate-400">
                                        {(tx.sell_price || 0).toFixed(2)}
                                    </TableCell>
                                    <TableCell className={`text-right font-black ${(tx.profit_loss || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                        <div className="flex items-center justify-end gap-1">
                                            {(tx.profit_loss || 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                            {(tx.profit_loss || 0).toFixed(2)}
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
