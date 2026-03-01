"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useDerivAPI } from "@/lib/deriv-api-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCcw, ArrowUpRight, ArrowDownLeft, ReceiptText, Calendar } from "lucide-react"
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

export function StatementList({ theme = "dark" }: StatementListProps) {
    const { apiClient, isAuthorized, activeLoginId } = useDerivAPI()
    const [statement, setStatement] = useState<StatementTransaction[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [activePreset, setActivePreset] = useState("30 Days")
    const [customFrom, setCustomFrom] = useState("")
    const [customTo, setCustomTo] = useState("")
    const [showCustom, setShowCustom] = useState(false)

    const fetchStatement = useCallback(async (dateFrom?: number, dateTo?: number) => {
        if (!apiClient || !isAuthorized) return

        setIsLoading(true)
        setError(null)
        try {
            const response = await apiClient.getStatement(50, 0, dateFrom, dateTo)
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
        const from = subDays(new Date(), 30)
        fetchStatement(Math.floor(from.getTime() / 1000))
    }, [fetchStatement, activeLoginId])

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString()
    }

    const getActionColor = (action: string) => {
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
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <div className="flex items-center gap-2">
                    <ReceiptText className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-bold">Transaction Statement</h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {QUICK_PRESETS.map(p => (
                        <Button
                            key={p.label}
                            variant={activePreset === p.label ? "default" : "outline"}
                            size="sm"
                            onClick={() => applyPreset(p)}
                            className={`h-8 text-[10px] uppercase font-bold tracking-wider ${activePreset === p.label ? "bg-blue-600 hover:bg-blue-700 font-bold" : "border-slate-700/50 hover:bg-slate-800"}`}
                        >
                            {p.label}
                        </Button>
                    ))}
                    <Button
                        variant={showCustom ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowCustom(!showCustom)}
                        className={`h-8 gap-2 text-[10px] uppercase font-bold tracking-wider ${showCustom ? "bg-blue-600 hover:bg-blue-700" : "border-slate-700/50 hover:bg-slate-800"}`}
                    >
                        <Calendar className="h-3 w-3" />
                        Custom
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { const p = QUICK_PRESETS.find(p => p.label === activePreset); if (p) applyPreset(p) }}
                        disabled={isLoading}
                        className="h-8 gap-2 border-slate-700/50 hover:bg-slate-800"
                    >
                        <RefreshCcw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {showCustom && (
                <div className="flex flex-wrap items-end gap-3 p-4 bg-slate-900/50 border border-slate-800 rounded-xl mb-4">
                    <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">From</p>
                        <input
                            type="date"
                            value={customFrom}
                            onChange={e => setCustomFrom(e.target.value)}
                            max={new Date().toISOString().split("T")[0]}
                            min={format(subYears(new Date(), 2), "yyyy-MM-dd")}
                            className="bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/50"
                        />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">To</p>
                        <input
                            type="date"
                            value={customTo}
                            onChange={e => setCustomTo(e.target.value)}
                            max={new Date().toISOString().split("T")[0]}
                            min={customFrom || format(subYears(new Date(), 2), "yyyy-MM-dd")}
                            className="bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/50"
                        />
                    </div>
                    <Button
                        size="sm"
                        onClick={applyCustom}
                        disabled={!customFrom || !customTo}
                        className="bg-blue-600 hover:bg-blue-700 h-8 px-4"
                    >
                        Apply
                    </Button>
                </div>
            )}

            {error && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                    {error}
                </div>
            )}

            <div className="rounded-xl border border-slate-800 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-900/80">
                        <TableRow className="hover:bg-transparent border-slate-800">
                            <TableHead className="w-[180px]">Date</TableHead>
                            <TableHead>Ref ID</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead className="text-right">Transaction ID</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i} className="border-slate-800/50">
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : statement.length > 0 ? (
                            statement.map((tx) => (
                                <TableRow key={tx.transaction_id} className="border-slate-800/50 hover:bg-slate-800/30">
                                    <TableCell className="text-xs text-slate-400 font-mono">
                                        {formatDate(tx.transaction_time)}
                                    </TableCell>
                                    <TableCell className="text-xs font-mono text-slate-500">
                                        {tx.reference_id}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {tx.amount > 0 ? (
                                                <ArrowDownLeft className="h-3 w-3 text-emerald-400" />
                                            ) : (
                                                <ArrowUpRight className="h-3 w-3 text-blue-400" />
                                            )}
                                            <span className={`text-xs font-bold uppercase tracking-wider ${getActionColor(tx.action_type)}`}>
                                                {tx.action_type}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right text-xs font-mono text-slate-400">
                                        {tx.transaction_id}
                                    </TableCell>
                                    <TableCell className={`text-right font-bold ${getAmountColor(tx.amount)}`}>
                                        {tx.amount > 0 ? "+" : ""}{tx.amount.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-slate-200">
                                        {tx.balance_after.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                                    {isAuthorized ? "No transactions found" : "Authorize your account to view statements"}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
