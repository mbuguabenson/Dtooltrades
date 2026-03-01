import { type NextRequest, NextResponse } from "next/server"
import { getTrades } from "@/lib/trading/db"

export async function GET() {
    try {
        const trades = getTrades(50)
        return NextResponse.json({ trades })
    } catch (error) {
        console.error("[Admin API] Error fetching trades:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
