import { type NextRequest, NextResponse } from "next/server"
import { tradeStore } from "@/lib/user-store"

export async function GET() {
    try {
        const trades = tradeStore().slice(-50).reverse() // Last 50 trades
        return NextResponse.json({ trades })
    } catch (error) {
        console.error("[Admin API] Error fetching trades:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
