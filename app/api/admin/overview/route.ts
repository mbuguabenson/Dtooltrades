import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
    try {
        // Return mock stats to avoid SQLite breaking on Vercel deployment
        const stats = {
            totalUsers: 142,
            onlineUsers: 38,
            totalRealBalance: 42105.50,
            totalDemoBalance: 154200.00,
            totalTrades: 1542,
            netPerformance: 8430.75,
            totalVolume: 894500.25
        }
        return NextResponse.json(stats)
    } catch (error) {
        console.error("[Admin API] Error fetching overview stats:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
