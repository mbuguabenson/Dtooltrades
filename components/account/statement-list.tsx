"use client"

import { useState, useEffect, useCallback } from "react"
import { useDerivAPI } from "@/lib/deriv-api-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCcw, ArrowUpRight, ArrowDownLeft, ReceiptText } from "lucide-react"

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

    const fetchStatement = useCallback(async () => {
        if (!apiClient || !isAuthorized) return

        setIsLoading(true)
        setError(null)
        try {
            const response = await apiClient.getStatement(50)
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

    useEffect(() => {
        fetchStatement()
    }, [fetchStatement, activeLoginId])

    const formatDate = (timestamp: number) => {
        if (!timestamp) return "N/A"
        return new Date(timestamp * 1000).toLocaleString()
    }

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
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    <ReceiptText className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-bold">Transaction Statement</h3>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchStatement}
                    disabled={isLoading}
                    className="h-8 gap-2 border-slate-700/50 hover:bg-slate-800"
                >
                    <RefreshCcw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
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
                                        {tx.amount > 0 ? "+" : ""}{(tx.amount || 0).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-slate-200">
                                        {(tx.balance_after || 0).toFixed(2)}
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
