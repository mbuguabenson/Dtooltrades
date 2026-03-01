/**
 * In-memory user store - works on Vercel Serverless Functions.
 * Persists within a single server process (survives between requests, resets on cold start/redeploy).
 * This is the replacement for SQLite which doesn't work on Vercel.
 */

export interface UserRecord {
    loginId: string
    name: string
    type: "Real" | "Demo"
    currency: string
    balance: number
    status: "online" | "offline"
    lastSeen: number // Unix timestamp
    firstSeen: number // Unix timestamp
}

// Global singleton store - shared across all API route calls in the same process
const globalUserStore = globalThis as typeof globalThis & {
    _dtoolUsers?: Map<string, UserRecord>
}

function getStore(): Map<string, UserRecord> {
    if (!globalUserStore._dtoolUsers) {
        globalUserStore._dtoolUsers = new Map()
    }
    return globalUserStore._dtoolUsers
}

export function upsertLiveUser(data: Omit<UserRecord, "firstSeen"> & { firstSeen?: number }): void {
    const store = getStore()
    const existing = store.get(data.loginId)
    store.set(data.loginId, {
        ...data,
        firstSeen: existing?.firstSeen ?? data.firstSeen ?? Math.floor(Date.now() / 1000),
    })
}

export function setUserOffline(loginId: string): void {
    const store = getStore()
    const user = store.get(loginId)
    if (user) {
        store.set(loginId, { ...user, status: "offline", lastSeen: Math.floor(Date.now() / 1000) })
    }
}

export function getAllLiveUsers(): UserRecord[] {
    return Array.from(getStore().values()).sort((a, b) => b.lastSeen - a.lastSeen)
}

export function getPlatformStats() {
    const users = getAllLiveUsers()
    const now = Math.floor(Date.now() / 1000)
    // Mark users as offline if not seen in 90 seconds
    users.forEach(u => {
        if (u.status === "online" && now - u.lastSeen > 90) {
            setUserOffline(u.loginId)
        }
    })
    const fresh = getAllLiveUsers()
    return {
        totalUsers: fresh.length,
        onlineUsers: fresh.filter(u => u.status === "online").length,
        totalRealBalance: fresh.filter(u => u.type === "Real").reduce((s, u) => s + u.balance, 0),
        totalDemoBalance: fresh.filter(u => u.type === "Demo").reduce((s, u) => s + u.balance, 0),
        totalTrades: 0, // No trade data available without DB
        netPerformance: 0,
        totalVolume: 0,
    }
}
