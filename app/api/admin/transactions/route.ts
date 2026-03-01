import { type NextRequest, NextResponse } from "next/server"
import { tradeStore } from "@/lib/user-store"

export async function GET() {
    try {
        const trades = tradeStore().slice(-100).reverse()
        const transactions = trades.map((t: any) => ({
            id: t.id,
            loginId: t.loginId,
            type: t.profit >= 0 ? "Deposit" : "Withdrawal", // Consistent casing for UI mapping
            amount: Math.abs(t.profit || t.stake),
            currency: "USD",
            method: t.market,
            status: "Completed", // Hardcoded for now as tradeStore only has closed trades
            strategy: t.strategy || "Unknown",
            stake: t.stake || 0,
            timestamp: t.ts
        }))
        return NextResponse.json({ transactions })
    } catch (error) {
        console.error("[Admin API] Error fetching transactions:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
