import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
    try {
        const users = [
            { loginId: "VRTC1001", name: "Demo User", type: "Demo", currency: "USD", balance: 10000.0, status: "online", lastSeen: Date.now() / 1000 },
            { loginId: "CR6662024", name: "Real User", type: "Real", currency: "USD", balance: 450.75, status: "offline", lastSeen: (Date.now() / 1000) - 3600 }
        ]
        return NextResponse.json({ users })
    } catch (error) {
        console.error("[Admin API] Error fetching users:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
