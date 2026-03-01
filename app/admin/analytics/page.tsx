"use client"

import React from "react"
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Calendar,
    ArrowUpRight,
    PieChart,
    Activity,
    Zap,
    Target
} from "lucide-react"

export default function AdminAnalyticsPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Advanced Analytics</h2>
                    <p className="text-sm text-gray-500 mt-1">Granular breakdown of platform-wide trading performance.</p>
                </div>
                <div className="flex gap-2 bg-white/5 p-1 rounded-2xl border border-white/5">
                    {["7D", "30D", "90D", "All"].map(p => (
                        <button key={p} className={`px-5 py-2 text-[10px] font-black rounded-xl transition-all ${p === "30D" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-gray-500 hover:text-white"}`}>{p}</button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 space-y-8">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-500" />
                        Profit/Loss Distribution
                    </h3>
                    <div className="h-64 flex items-center justify-center border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                        <div className="text-center px-6">
                            <Activity className="h-10 w-10 text-gray-700 mx-auto mb-3" />
                            <p className="text-xs text-gray-500 font-medium">Aggregated P/L over time would render here using Recharts.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                            <p className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest mb-1">Peak Daily Profit</p>
                            <p className="text-lg font-black text-white">$1,842.20</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                            <p className="text-[10px] font-bold text-rose-500/70 uppercase tracking-widest mb-1">Peak Daily Loss</p>
                            <p className="text-lg font-black text-white">$420.50</p>
                        </div>
                    </div>
                </div>

                <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 space-y-8">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-purple-500" />
                        Strategy Performance
                    </h3>
                    <div className="space-y-4">
                        {[
                            { name: "Matches/Differs", winRate: 92, count: 1240, color: "bg-blue-500" },
                            { name: "Rise/Fall", winRate: 84, count: 850, color: "bg-emerald-500" },
                            { name: "Over/Under", winRate: 78, count: 2100, color: "bg-purple-500" },
                            { name: "Even/Odd", winRate: 81, count: 1560, color: "bg-orange-500" },
                        ].map((s, i) => (
                            <div key={i} className="group">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-xs font-bold text-gray-400">{s.name}</span>
                                    <span className="text-[10px] font-black text-white">{s.winRate}% <span className="text-gray-600 font-medium">WR</span></span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className={`h-full ${s.color} transition-all duration-1000 group-hover:opacity-80`} style={{ width: `${s.winRate}%` }} />
                                    </div>
                                    <span className="text-[9px] text-gray-600 font-mono w-10 text-right">{s.count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Zap className="h-5 w-5 text-orange-500" />
                        Volume Heatmap
                    </h3>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Global Activity</span>
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 28 }).map((_, i) => (
                        <div
                            key={i}
                            className={`h-12 rounded-lg border border-white/5 transition-all hover:scale-105 cursor-pointer ${i % 7 === 0 ? 'bg-blue-500/40 text-blue-200' :
                                    i % 5 === 0 ? 'bg-blue-500/20 text-blue-300' : 'bg-white/[0.02] text-gray-700'
                                } flex items-center justify-center text-[10px] font-black`}
                        >
                            {i + 1}
                        </div>
                    ))}
                </div>
                <div className="mt-8 flex items-center gap-6 justify-center">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-white/[0.02] border border-white/5" />
                        <span className="text-[10px] text-gray-500 font-bold uppercase">Low</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-blue-500/50" />
                        <span className="text-[10px] text-gray-500 font-bold uppercase">High</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
