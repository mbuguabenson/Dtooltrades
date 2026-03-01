"use client"

import React from "react"
import { Activity, TrendingUp, TrendingDown, Target, Zap, Waves, BarChart2 } from "lucide-react"

export default function AdminMarketPage() {
    const markets = [
        { name: "Volatility 100 (1s)", index: "100.24", bias: "Bullish", power: 84, color: "blue" },
        { name: "Volatility 75 (1s)", index: "75.12", bias: "Bearish", power: 72, color: "rose" },
        { name: "Volatility 50 (1s)", index: "50.05", bias: "Neutral", power: 45, color: "amber" },
        { name: "Volatility 25 (1s)", index: "25.18", bias: "Bullish", power: 61, color: "emerald" },
        { name: "Volatility 10 (1s)", index: "10.02", bias: "Bearish", power: 58, color: "rose" },
    ]

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <div>
                <h2 className="text-3xl font-black text-white tracking-tight">Market Intelligence</h2>
                <p className="text-sm text-gray-500 mt-1">Real-time status of connected asset streams.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {markets.map((m, i) => (
                    <div key={i} className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 relative group overflow-hidden hover:border-white/10 transition-all">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-white font-bold">{m.name}</h3>
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">Ref: {m.index}</p>
                            </div>
                            <div className={`p-2 rounded-xl scale-75 ${m.bias === 'Bullish' ? 'bg-emerald-500/20 text-emerald-500' : m.bias === 'Bearish' ? 'bg-rose-500/20 text-rose-500' : 'bg-amber-500/20 text-amber-500'}`}>
                                {m.bias === 'Bullish' ? <TrendingUp className="h-5 w-5" /> : m.bias === 'Bearish' ? <TrendingDown className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tighter">
                                <span className="text-gray-500">Market Power</span>
                                <span className="text-white">{m.power}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className={`h-full bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.4)]`} style={{ width: `${m.power}%` }} />
                            </div>
                        </div>

                        <div className="mt-6 flex gap-2">
                            <button className="flex-1 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 py-2 rounded-xl text-[10px] font-bold text-gray-400 hover:text-white transition-all uppercase tracking-widest">Connect</button>
                            <button className="px-3 bg-blue-600/10 text-blue-500 border border-blue-500/20 rounded-xl hover:bg-blue-600/20 transition-all">
                                <Zap className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-500 relative">
                        <Waves className="h-8 w-8 animate-pulse" />
                        <div className="absolute inset-0 rounded-full border border-blue-500/20 animate-ping" />
                    </div>
                    <div>
                        <h3 className="text-white font-black tracking-tight text-xl leading-none">WebSocket Stream Optimizer</h3>
                        <p className="text-sm text-gray-500 mt-2">Currently aggregating 842 data points per second with 12ms latency.</p>
                    </div>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <button className="flex-1 md:flex-none px-8 py-3 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm text-gray-400 hover:text-white transition-all">Re-Sync All</button>
                    <button className="flex-1 md:flex-none px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 active:scale-95 transition-all">Turbo Mode</button>
                </div>
            </div>
        </div>
    )
}
