import { type NextRequest, NextResponse } from "next/server"
import { upsertUser, updateUserStatus } from "@/lib/trading/db"

export async function POST(request: NextRequest) {
    try {
        const data = await request.json()
        const { loginId, name, type, currency, balance, status } = data

        if (!loginId) {
            return NextResponse.json({ error: "loginId is required" }, { status: 400 })
        }

        if (status === "offline") {
            updateUserStatus(loginId, "offline")
        } else {
            upsertUser({ loginId, name, type, currency, balance })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[User API] Heartbeat error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
