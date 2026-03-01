"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useDerivAPI } from "@/lib/deriv-api-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCcw, ArrowUpRight, ArrowDownLeft, ReceiptText, Filter, Calendar, Calculator } from "lucide-react"

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

export function StatementList({ theme = "dark" }: StatementListProps) {
    const { apiClient, isAuthorized, activeLoginId } = useDerivAPI()
    const [statement, setStatement] = useState<StatementTransaction[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Filter states
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [durationFilter, setDurationFilter] = useState<string>("all")

    const fetchStatement = useCallback(async () => {
        if (!apiClient || !isAuthorized) return

        setIsLoading(true)
        setError(null)
        try {
            const params: any = { limit: 100 }

            if (durationFilter !== "all") {
                const now = Math.floor(Date.now() / 1000)
                const durations: Record<string, number> = {
                    "24h": 24 * 60 * 60,
                    "7d": 7 * 24 * 60 * 60,
                    "30d": 30 * 24 * 60 * 60
                }
                const secs = durations[durationFilter]
                if (secs) {
                    params.date_from = now - secs
                }
            }

            const response = await apiClient.getStatement(params.limit, 0, params.date_from, params.date_to)
            if (response && response.transactions) {
                setStatement(response.transactions)
            } else {
                setStatement([])
            }
        } catch (err: any) {
            console.error("[v0] Error fetching statement:", err)
            setError(err?.message || "Failed to fetch statement")
        } finally {
            setIsLoading(false)
        }
    }, [apiClient, isAuthorized, durationFilter])

    useEffect(() => {
        fetchStatement()
    }, [fetchStatement, activeLoginId])

    const formatDate = (timestamp: number) => {
        if (!timestamp) return "N/A"
        return new Date(timestamp * 1000).toLocaleString()
    }

    const filteredStatement = useMemo(() => {
        let filtered = [...statement]

        // Type filtering
        if (typeFilter !== "all") {
            filtered = filtered.filter(tx => (tx.action_type || "").toLowerCase() === typeFilter.toLowerCase())
        }

        return filtered
    }, [statement, typeFilter])

    const totals = useMemo(() => {
        const credit = filteredStatement.filter(tx => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0)
        const debit = filteredStatement.filter(tx => tx.amount < 0).reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
        return {
            credit,
            debit,
            net: credit - debit
        }
    }, [filteredStatement])

    const getActionColor = (action: string) => {
        if (!action) return "text-slate-300"
        switch (action.toLowerCase()) {
            case "buy": return "text-blue-400"
            case "sell": return "text-emerald-400"
            case "deposit": return "text-emerald-500"
            case "withdrawal": return "text-rose-400"
            default: return "text-slate-300"
        }
    }

    const getAmountColor = (amount: number) => {
        if (amount > 0) return "text-emerald-400"
        if (amount < 0) return "text-rose-400"
        return "text-slate-300"
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2">
                    <ReceiptText className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-bold">Transaction Statement</h3>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-700/50">
                        <Filter className="h-3.5 w-3.5 text-slate-400" />
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="h-7 border-none bg-transparent focus:ring-0 text-xs font-bold">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800">
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="buy">Buy</SelectItem>
                                <SelectItem value="sell">Sell</SelectItem>
                                <SelectItem value="deposit">Deposit</SelectItem>
                                <SelectItem value="withdrawal">Withdrawal</SelectItem>
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
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchStatement}
                        disabled={isLoading}
                        className="h-8 gap-2 text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                        <RefreshCcw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Credit</p>
                        <p className="text-xl font-black text-emerald-400">+{totals.credit.toFixed(2)}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <ArrowDownLeft className="h-5 w-5 text-emerald-500" />
                    </div>
                </div>
                <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Debit</p>
                        <p className="text-xl font-black text-rose-400">-{totals.debit.toFixed(2)}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
                        <ArrowUpRight className="h-5 w-5 text-rose-500" />
                    </div>
                </div>
                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Net Movement</p>
                        <p className={`text-xl font-black ${totals.net >= 0 ? "text-blue-400" : "text-rose-400"}`}>
                            {totals.net >= 0 ? "+" : ""}{totals.net.toFixed(2)}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Calculator className="h-5 w-5 text-blue-500" />
                    </div>
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
                            <TableHead className="w-[180px] text-xs font-bold uppercase tracking-wider text-slate-500">Date</TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Reference</TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Action</TableHead>
                            <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Transaction ID</TableHead>
                            <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-slate-500">Amount</TableHead>
                            <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-slate-500">Balance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i} className="border-slate-800/50 h-16">
                                    <TableCell><Skeleton className="h-4 w-32 bg-slate-800" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20 mx-auto bg-slate-800" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16 bg-slate-800" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24 ml-auto bg-slate-800" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20 ml-auto bg-slate-800" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24 ml-auto bg-slate-800" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredStatement.length > 0 ? (
                            filteredStatement.map((tx) => (
                                <TableRow key={tx.transaction_id} className="border-slate-800/50 hover:bg-slate-800/30 transition-colors h-16">
                                    <TableCell className="text-[11px] text-slate-400 font-mono">
                                        {formatDate(tx.transaction_time)}
                                    </TableCell>
                                    <TableCell className="text-[11px] font-mono text-slate-500 text-center">
                                        {tx.reference_id}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {tx.amount > 0 ? (
                                                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                    <ArrowDownLeft className="h-3 w-3 text-emerald-400" />
                                                </div>
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                    <ArrowUpRight className="h-3 w-3 text-blue-400" />
                                                </div>
                                            )}
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${getActionColor(tx.action_type)}`}>
                                                {tx.action_type}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right text-[11px] font-mono text-slate-500">
                                        {tx.transaction_id}
                                    </TableCell>
                                    <TableCell className={`text-right font-black ${getAmountColor(tx.amount)}`}>
                                        {tx.amount > 0 ? "+" : ""}{(tx.amount || 0).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-slate-200">
                                        {(tx.balance_after || 0).toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center bg-slate-900/20">
                                    <div className="flex flex-col items-center justify-center gap-2 opacity-40">
                                        <ReceiptText className="h-8 w-8 text-slate-500" />
                                        <p className="text-sm font-bold">
                                            {isAuthorized ? "No matching transactions found" : "Authorize your account to view statements"}
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
