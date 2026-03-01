"use client"

import React, { useState } from "react"
import {
    Search,
    Filter,
    MoreVertical,
    ExternalLink,
    UserPlus,
    ArrowUpRight,
    ArrowDownRight,
    ShieldCheck,
    ShieldX
} from "lucide-react"

interface UserPortfolio {
    id: string
    name: string
    email: string
    status: "online" | "offline"
    balance: {
        real: number
        demo: number
        currency: string
    }
    performance: {
        winRate: number
        totalTrades: number
        netProfit: number
    }
    avatar?: string
}

export default function AdminPortfolioPage() {
    const [searchTerm, setSearchTerm] = useState("")

    const users: UserPortfolio[] = [
        {
            id: "CR100521",
            name: "Alex Wolf",
            email: "alex.wolf@example.com",
            status: "online",
            balance: { real: 4200.50, demo: 10000, currency: "USD" },
            performance: { winRate: 92, totalTrades: 842, netProfit: 15680 }
        },
        {
            id: "CR200843",
            name: "Sarah Jones",
            email: "sarah.j@example.com",
            status: "offline",
            balance: { real: 1250.75, demo: 5000, currency: "USDT" },
            performance: { winRate: 88, totalTrades: 512, netProfit: 8400 }
        },
        {
            id: "CR300291",
            name: "Mark Knight",
            email: "mark.knight@example.com",
            status: "online",
            balance: { real: 8500.20, demo: 25000, currency: "BTC" },
            performance: { winRate: 85, totalTrades: 1205, netProfit: 22100 }
        },
        {
            id: "CR400511",
            name: "Elena Rodriguez",
            email: "elena.r@example.com",
            status: "online",
            balance: { real: 320.00, demo: 1000, currency: "USD" },
            performance: { winRate: 72, totalTrades: 156, netProfit: -450 }
        },
        {
            id: "CR500922",
            name: "David Wang",
            email: "d.wang@example.com",
            status: "offline",
            balance: { real: 15400.00, demo: 50000, currency: "USD" },
            performance: { winRate: 78, totalTrades: 2100, netProfit: 45000 }
        }
    ]

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">User Portfolios</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage and monitor platform participants.</p>
                </div>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                    <UserPlus className="h-4 w-4" />
                    Add New Trader
                </button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by name, ID or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium"
                    />
                </div>
                <button className="flex items-center justify-center gap-2 bg-[#0a0a0a] border border-white/5 px-6 py-3 rounded-2xl text-gray-400 hover:text-white hover:border-white/10 transition-all">
                    <Filter className="h-4 w-4" />
                    More Filters
                </button>
            </div>

            {/* Users Table */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Trader / ID</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Real Balance</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Demo Balance</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Win Rate</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Net Profit</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-gray-950 border border-white/10 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                                                {user.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white mb-0.5">{user.name}</p>
                                                <p className="text-[10px] text-gray-500 font-mono">{user.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${user.status === "online" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-gray-500/10 text-gray-500 border border-gray-500/20"
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${user.status === "online" ? "bg-emerald-500 animate-pulse" : "bg-gray-500"}`} />
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-sm font-black text-white">
                                        {user.balance.real.toLocaleString()} <span className="text-[10px] text-gray-500 font-medium">{user.balance.currency}</span>
                                    </td>
                                    <td className="px-6 py-5 text-sm font-bold text-gray-400">
                                        {user.balance.demo.toLocaleString()} <span className="text-[10px] text-gray-600 font-medium">USD</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex justify-between items-center text-[10px]">
                                                <span className="text-gray-500 font-bold">{user.performance.winRate}%</span>
                                            </div>
                                            <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500" style={{ width: `${user.performance.winRate}%` }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-black ${user.performance.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                                {user.performance.netProfit >= 0 ? "+" : ""}${Math.abs(user.performance.netProfit).toLocaleString()}
                                            </span>
                                            <span className="text-[10px] text-gray-500 uppercase tracking-widest">{user.performance.totalTrades} trades</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-1">
                                            <button className="p-2 hover:bg-blue-500/10 text-gray-400 hover:text-blue-400 rounded-lg transition-all" title="View Portfolio">
                                                <ExternalLink className="h-4 w-4" />
                                            </button>
                                            <button className="p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-all">
                                                <MoreVertical className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bottom Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
                <div className="p-6 rounded-3xl bg-blue-600/5 border border-blue-500/10 flex items-center justify-between group cursor-pointer hover:bg-blue-600/10 transition-all">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <h4 className="text-white font-bold tracking-tight">System Health Check</h4>
                            <p className="text-xs text-gray-500">All user sessions are currently stable and authorized.</p>
                        </div>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-gray-600 group-hover:text-blue-500 transition-colors" />
                </div>

                <div className="p-6 rounded-3xl bg-purple-600/5 border border-purple-500/10 flex items-center justify-between group cursor-pointer hover:bg-purple-600/10 transition-all">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                            <ShieldX className="h-6 w-6" />
                        </div>
                        <div>
                            <h4 className="text-white font-bold tracking-tight">Risk Mitigation Mode</h4>
                            <p className="text-xs text-gray-500">Monitoring for anomalies in trading patterns.</p>
                        </div>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-gray-600 group-hover:text-purple-500 transition-colors" />
                </div>
            </div>
        </div>
    )
}
