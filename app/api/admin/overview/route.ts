import { type NextRequest, NextResponse } from "next/server"
import { getPlatformStats } from "@/lib/user-store"

export async function GET() {
    try {
        const stats = getPlatformStats()
        return NextResponse.json(stats)
    } catch (error) {
        console.error("[Admin API] Error fetching overview stats:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
