import { type NextRequest, NextResponse } from "next/server"
import { upsertLiveUser, setUserOffline } from "@/lib/user-store"

export async function POST(request: NextRequest) {
    try {
        const data = await request.json()
        const { loginId, name, type, currency, balance, status } = data

        if (!loginId) {
            return NextResponse.json({ error: "loginId is required" }, { status: 400 })
        }

        const now = Math.floor(Date.now() / 1000)

        if (status === "offline") {
            setUserOffline(loginId)
        } else {
            upsertLiveUser({
                loginId,
                name: name || "Deriv User",
                type: type as "Real" | "Demo",
                currency: currency || "USD",
                balance: balance || 0,
                status: "online",
                lastSeen: now,
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[User API] Heartbeat error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
