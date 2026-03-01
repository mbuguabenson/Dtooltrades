import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
    try {
        const transactions = [
            { id: "tx_1", loginId: "VRTC1001", type: "deposit", amount: 1000, currency: "USD", method: "bitcoin", status: "completed", timestamp: Date.now() / 1000 },
            { id: "tx_2", loginId: "CR6662024", type: "withdrawal", amount: 250, currency: "USD", method: "bank_transfer", status: "pending", timestamp: Date.now() / 1000 }
        ]
        return NextResponse.json({ transactions })
    } catch (error) {
        console.error("[Admin API] Error fetching transactions:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
