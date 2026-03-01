import { type NextRequest, NextResponse } from "next/server"
import { getAllUsers } from "@/lib/trading/db"

export async function GET() {
    try {
        const users = getAllUsers()
        return NextResponse.json({ users })
    } catch (error) {
        console.error("[Admin API] Error fetching users:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
