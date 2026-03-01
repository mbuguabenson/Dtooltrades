import { type NextRequest, NextResponse } from "next/server"
import { setUserFlag, getUser, UserFlag } from "@/lib/user-store"

export async function PATCH(
    request: NextRequest,
    { params }: { params: { loginId: string } }
) {
    try {
        const { loginId } = params
        const { action } = await request.json()

        const validActions: UserFlag[] = ["none", "whitelisted", "blacklisted", "blocked"]
        if (!validActions.includes(action)) {
            return NextResponse.json({ error: "Invalid action. Use: none, whitelisted, blacklisted, blocked" }, { status: 400 })
        }

        const user = getUser(loginId)
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        setUserFlag(loginId, action as UserFlag)
        return NextResponse.json({ success: true, loginId, flag: action })
    } catch (error) {
        console.error("[Admin API] Error updating user:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { loginId: string } }
) {
    try {
        const user = getUser(params.loginId)
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
        return NextResponse.json({ user })
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
