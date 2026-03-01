import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
    try {
        const trades = [
            { id: 101, loginId: "VRTC1001", market: "R_100", contractType: "CALL", stake: 10.5, status: "closed", profitLoss: 8.4 },
            { id: 102, loginId: "CR6662024", market: "R_50", contractType: "PUT", stake: 25.0, status: "open", profitLoss: 0 }
        ]
        return NextResponse.json({ trades })
    } catch (error) {
        console.error("[Admin API] Error fetching trades:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
