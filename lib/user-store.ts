/**
 * In-memory store for Vercel Serverless Functions.
 * Persists within a single server process; resets on cold start/redeploy.
 */

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────

export type UserStatus = "online" | "offline"
export type UserFlag = "none" | "whitelisted" | "blacklisted" | "blocked"

export interface UserRecord {
    loginId: string
    name: string
    type: "Real" | "Demo"
    currency: string
    balance: number
    balanceHistory: { ts: number; balance: number }[]
    status: UserStatus
    flag: UserFlag
    lastSeen: number
    firstSeen: number
}

export interface SiteConfig {
    maintenanceMode: boolean
    maintenanceMessage: string
    headerHidden: boolean
    footerHidden: boolean
    hiddenTabs: string[]  // tab ids to hide e.g. ["smart", "signals"]
}

export interface TradeResult {
    id: string
    loginId: string
    strategy: string
    market: string
    profit: number   // positive = win, negative = loss
    stake: number
    ts: number
}

export interface ChatMessage {
    id: string
    fromUser: string  // loginId or "visitor_<random>"
    name: string
    message: string
    ts: number
    read: boolean
    replies: { adminMsg: string; ts: number }[]
}

export interface Notification {
    id: string
    title: string
    body: string
    ts: number
    type: "info" | "warning" | "update"
}

// ──────────────────────────────────────────────
// SINGLETON GLOBAL STORE
// ──────────────────────────────────────────────

const G = globalThis as typeof globalThis & {
    _dtoolUsers?: Map<string, UserRecord>
    _dtoolSiteConfig?: SiteConfig
    _dtoolTrades?: TradeResult[]
    _dtoolChats?: Map<string, ChatMessage>
    _dtoolNotifications?: Notification[]
}

function userStore(): Map<string, UserRecord> {
    if (!G._dtoolUsers) G._dtoolUsers = new Map()
    return G._dtoolUsers
}

function chatStore(): Map<string, ChatMessage> {
    if (!G._dtoolChats) G._dtoolChats = new Map()
    return G._dtoolChats
}

function tradeStore(): TradeResult[] {
    if (!G._dtoolTrades) G._dtoolTrades = []
    return G._dtoolTrades
}

function notificationStore(): Notification[] {
    if (!G._dtoolNotifications) G._dtoolNotifications = []
    return G._dtoolNotifications
}

export function getSiteConfig(): SiteConfig {
    if (!G._dtoolSiteConfig) {
        G._dtoolSiteConfig = {
            maintenanceMode: false,
            maintenanceMessage: "We are performing scheduled maintenance. We'll be back shortly.",
            headerHidden: false,
            footerHidden: false,
            hiddenTabs: [],
        }
    }
    return G._dtoolSiteConfig
}

export function updateSiteConfig(patch: Partial<SiteConfig>): SiteConfig {
    G._dtoolSiteConfig = { ...getSiteConfig(), ...patch }
    return G._dtoolSiteConfig
}

// ──────────────────────────────────────────────
// USER MANAGEMENT
// ──────────────────────────────────────────────

export function upsertLiveUser(data: Omit<UserRecord, "firstSeen" | "flag" | "balanceHistory"> & { firstSeen?: number }): void {
    const store = userStore()
    const existing = store.get(data.loginId)
    const balanceHistory = existing?.balanceHistory ?? []
    // Record balance every heartbeat (keep last 100 readings)
    balanceHistory.push({ ts: data.lastSeen, balance: data.balance })
    if (balanceHistory.length > 100) balanceHistory.shift()

    store.set(data.loginId, {
        ...data,
        flag: existing?.flag ?? "none",
        balanceHistory,
        firstSeen: existing?.firstSeen ?? data.firstSeen ?? Math.floor(Date.now() / 1000),
    })
}

export function setUserOffline(loginId: string): void {
    const store = userStore()
    const user = store.get(loginId)
    if (user) store.set(loginId, { ...user, status: "offline", lastSeen: Math.floor(Date.now() / 1000) })
}

export function setUserFlag(loginId: string, flag: UserFlag): void {
    const store = userStore()
    const user = store.get(loginId)
    if (user) store.set(loginId, { ...user, flag })
}

export function getAllLiveUsers(): UserRecord[] {
    return Array.from(userStore().values()).sort((a, b) => b.lastSeen - a.lastSeen)
}

export function getUser(loginId: string): UserRecord | undefined {
    return userStore().get(loginId)
}

export function isUserBlocked(loginId: string): boolean {
    return userStore().get(loginId)?.flag === "blocked"
}

export function getPlatformStats() {
    const now = Math.floor(Date.now() / 1000)
    // Auto-mark stale as offline
    userStore().forEach((u, id) => {
        if (u.status === "online" && now - u.lastSeen > 90) setUserOffline(id)
    })
    const users = getAllLiveUsers()
    return {
        totalUsers: users.length,
        onlineUsers: users.filter(u => u.status === "online").length,
        totalRealBalance: users.filter(u => u.type === "Real").reduce((s, u) => s + u.balance, 0),
        totalDemoBalance: users.filter(u => u.type === "Demo").reduce((s, u) => s + u.balance, 0),
        totalTrades: tradeStore().length,
        netPerformance: tradeStore().reduce((s, t) => s + t.profit, 0),
        totalVolume: tradeStore().reduce((s, t) => s + t.stake, 0),
    }
}

// ──────────────────────────────────────────────
// TRADE ANALYTICS
// ──────────────────────────────────────────────

export function recordTrade(trade: Omit<TradeResult, "id">): void {
    const store = tradeStore()
    store.push({ ...trade, id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` })
    // Keep at most 10000 trades in memory
    if (store.length > 10000) store.splice(0, store.length - 10000)
}

export function getTradesByFilter(since: number): TradeResult[] {
    return tradeStore().filter(t => t.ts >= since)
}

// ──────────────────────────────────────────────
// CHAT
// ──────────────────────────────────────────────

export function addChatMessage(msg: Omit<ChatMessage, "id" | "replies" | "read">): ChatMessage {
    const store = chatStore()
    const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const full: ChatMessage = { ...msg, id, read: false, replies: [] }
    store.set(id, full)
    return full
}

export function getAllChatMessages(): ChatMessage[] {
    return Array.from(chatStore().values()).sort((a, b) => b.ts - a.ts)
}

export function addChatReply(msgId: string, adminMsg: string): boolean {
    const store = chatStore()
    const msg = store.get(msgId)
    if (!msg) return false
    msg.replies.push({ adminMsg, ts: Math.floor(Date.now() / 1000) })
    msg.read = true
    store.set(msgId, msg)
    return true
}

export function getUnreadChatCount(): number {
    return Array.from(chatStore().values()).filter(m => !m.read).length
}

export function getRepliesForUser(fromUser: string): ChatMessage[] {
    return Array.from(chatStore().values()).filter(m => m.fromUser === fromUser)
}

// ──────────────────────────────────────────────
// NOTIFICATIONS
// ──────────────────────────────────────────────

export function addNotification(n: Omit<Notification, "id" | "ts">): Notification {
    const store = notificationStore()
    const full: Notification = { ...n, id: `notif_${Date.now()}`, ts: Math.floor(Date.now() / 1000) }
    store.push(full)
    if (store.length > 50) store.shift()
    return full
}

export function getNotifications(): Notification[] {
    return notificationStore().slice().reverse()
}
