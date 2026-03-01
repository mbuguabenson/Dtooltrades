import { type NextRequest, NextResponse } from "next/server"
import { getPlatformTransactions } from "@/lib/trading/db"

export async function GET() {
    try {
        const transactions = getPlatformTransactions()
        return NextResponse.json({ transactions })
    } catch (error) {
        console.error("[Admin API] Error fetching transactions:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
