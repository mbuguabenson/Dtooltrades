"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Users, RefreshCw, Wifi, WifiOff, Search, Coins } from "lucide-react"

interface UserRecord {
    loginId: string
    name: string
    type: "Real" | "Demo"
    currency: string
    balance: number
    status: "online" | "offline"
    lastSeen: number
    firstSeen: number
}

function timeAgo(ts: number) {
    const diff = Math.floor(Date.now() / 1000) - ts
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [search, setSearch] = useState("")
    const [filter, setFilter] = useState<"all" | "online" | "real" | "demo">("all")

    const fetchUsers = useCallback(async (silent = false) => {
        if (!silent) setLoading(true)
        else setRefreshing(true)
        try {
            const res = await fetch("/api/admin/users")
            const data = await res.json()
            setUsers(data.users || [])
        } catch (err) {
            console.error("Failed to fetch users:", err)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => {
        fetchUsers()
        // Auto-refresh every 15 seconds
        const interval = setInterval(() => fetchUsers(true), 15000)
        return () => clearInterval(interval)
    }, [fetchUsers])

    const filtered = users.filter(u => {
        const matchesSearch = u.loginId.toLowerCase().includes(search.toLowerCase()) ||
            (u.name || "").toLowerCase().includes(search.toLowerCase())
        if (filter === "online") return matchesSearch && u.status === "online"
        if (filter === "real") return matchesSearch && u.type === "Real"
        if (filter === "demo") return matchesSearch && u.type === "Demo"
        return matchesSearch
    })

    const online = users.filter(u => u.status === "online").length
    const real = users.filter(u => u.type === "Real").length
    const demo = users.filter(u => u.type === "Demo").length

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Authorized Users</h2>
                    <p className="text-sm text-gray-500 mt-1">All accounts that have authenticated your app. Auto-refreshes every 15s.</p>
                </div>
                <button
                    onClick={() => fetchUsers(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-gray-300 hover:bg-white/10 transition-all disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {/* Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: "Total Users", value: users.length, color: "blue" },
                    { label: "Online Now", value: online, color: "emerald" },
                    { label: "Real Accounts", value: real, color: "green" },
                    { label: "Demo Accounts", value: demo, color: "amber" },
                ].map(stat => (
                    <div key={stat.label} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5">
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{stat.label}</p>
                        <p className={`text-3xl font-black mt-1 text-${stat.color}-400`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search by Account ID or Name..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    {(["all", "online", "real", "demo"] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === f ? "bg-blue-600 text-white" : "bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10"}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-xs font-bold text-white uppercase tracking-widest">Authorized App Users</span>
                    <span className="ml-auto text-[10px] text-gray-500 font-bold">{filtered.length} accounts</span>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                        <Users className="h-8 w-8 text-gray-700 mb-3" />
                        <p className="text-sm font-bold text-gray-500">No authorized users yet</p>
                        <p className="text-xs text-gray-600 mt-1">Users will appear here once they authorize and connect to the app.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/5 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                                    <th className="px-6 py-3">Account ID</th>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3">Balance</th>
                                    <th className="px-6 py-3">Currency</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Last Seen</th>
                                    <th className="px-6 py-3">First Seen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {filtered.map(user => (
                                    <tr key={user.loginId} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs font-bold text-blue-400">{user.loginId}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${user.type === "Real"
                                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                }`}>
                                                <Coins className="h-3 w-3" />
                                                {user.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono font-bold text-white text-sm">
                                                {Number(user.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{user.currency}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${user.status === "online" ? "text-emerald-400" : "text-gray-600"}`}>
                                                {user.status === "online"
                                                    ? <Wifi className="h-3 w-3 text-emerald-400" />
                                                    : <WifiOff className="h-3 w-3" />}
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs text-gray-500">{timeAgo(user.lastSeen)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs text-gray-600">{new Date(user.firstSeen * 1000).toLocaleDateString()}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
