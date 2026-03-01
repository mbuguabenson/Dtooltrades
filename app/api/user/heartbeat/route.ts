import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
    try {
        const data = await request.json()
        const { loginId, name, type, currency, balance, status } = data

        if (!loginId) {
            return NextResponse.json({ error: "loginId is required" }, { status: 400 })
        }

        // Bypassing SQLite for Vercel deployment to prevent global 500 crashes
        console.log(`[Heartbeat API] Mock update for User: ${loginId} | Status: ${status}`)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[User API] Heartbeat error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
