import { type NextRequest, NextResponse } from "next/server"
import { getAllLiveUsers } from "@/lib/user-store"

export async function GET() {
    try {
        const users = getAllLiveUsers()
        return NextResponse.json({ users })
    } catch (error) {
        console.error("[Admin API] Error fetching users:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
