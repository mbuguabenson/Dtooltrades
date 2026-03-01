import { type NextRequest, NextResponse } from "next/server"
import { tradeStore } from "@/lib/user-store"

export async function GET() {
    try {
        const trades = tradeStore().slice(-100).reverse()
        const transactions = trades.map((t: any) => ({
            id: t.id,
            loginId: t.loginId,
            type: t.profit >= 0 ? "deposit" : "withdrawal", // Represent P/L as movements
            amount: Math.abs(t.profit),
            currency: "USD",
            method: t.market,
            status: "completed",
            timestamp: t.ts
        }))
        return NextResponse.json({ transactions })
    } catch (error) {
        console.error("[Admin API] Error fetching transactions:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
