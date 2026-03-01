import { type NextRequest, NextResponse } from "next/server"
import { getPlatformStats } from "@/lib/user-store"

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get("type") as any
        const pnl = searchParams.get("pnl") as any

        const stats = getPlatformStats({
            type: (type === "All" || !type) ? undefined : type,
            pnl: (pnl === "All" || !pnl) ? undefined : pnl
        })
        return NextResponse.json(stats)
    } catch (error) {
        console.error("[Admin API] Error fetching overview stats:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
