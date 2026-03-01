import { type NextRequest, NextResponse } from "next/server"
import { getPlatformOverview } from "@/lib/trading/db"

export async function GET() {
    try {
        const stats = getPlatformOverview()
        return NextResponse.json(stats)
    } catch (error) {
        console.error("[Admin API] Error fetching overview stats:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
