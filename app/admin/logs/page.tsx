"use client"

import React, { useState, useEffect } from "react"
import {
    Terminal,
    Activity,
    ShieldAlert,
    ShieldCheck,
    Search,
    Download,
    Trash2,
    Bug,
    Cpu,
    Database,
    Wifi,
    BarChart4
} from "lucide-react"

interface LogEntry {
    id: string
    level: "info" | "warn" | "error" | "critical"
    category: "auth" | "trading" | "api" | "system"
    message: string
    timestamp: Date
}

export default function AdminLogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [filter, setFilter] = useState("all")
    const [loading, setLoading] = useState(true)

    const perfMetrics = [
        { label: "Active Streams", value: logs.length > 0 ? "Active" : "Idle", icon: Wifi, status: "healthy" },
        { label: "Event Queue", value: "Optimal", icon: Cpu, status: "healthy" },
        { label: "DB Health", value: "Stable", icon: Database, status: "healthy" },
        { label: "Log Retention", value: "30 Days", icon: BarChart4, status: "optimal" },
    ]

    useEffect(() => {
        async function fetchLogs() {
            try {
                const res = await fetch("/api/admin/trades")
                const data = await res.json()
                const formatted = (data.trades || []).map((t: any) => ({
                    id: t.id.toString(),
                    level: t.profitLoss >= 0 ? "info" : "warn",
                    category: "trading",
                    message: `Trade ${t.status}: ${t.loginId} on ${t.market} (${t.stake} USD)`,
                    timestamp: new Date(t.createdAt * 1000)
                }))
                setLogs(formatted)
            } catch (err) {
                console.error("Failed to fetch logs:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchLogs()
        const interval = setInterval(fetchLogs, 15000)
        return () => clearInterval(interval)
    }, [])

    const getLevelColor = (level: string) => {
        switch (level) {
            case "info": return "text-blue-400 bg-blue-500/10 border-blue-500/20"
            case "warn": return "text-amber-400 bg-amber-500/10 border-amber-500/20"
            case "error": return "text-rose-400 bg-rose-500/10 border-rose-500/20"
            case "critical": return "text-white bg-rose-600 border-rose-700 font-black shadow-[0_0_15px_rgba(225,29,72,0.4)]"
            default: return "text-gray-400"
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">System Logs & Health</h2>
                    <p className="text-sm text-gray-500 mt-1">Real-time technical heartbeat and oversight.</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all">
                        <Download className="h-4 w-4" />
                        Export
                    </button>
                    <button className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 px-4 py-2 rounded-xl text-sm font-bold transition-all">
                        <Trash2 className="h-4 w-4" />
                        Clear Logs
                    </button>
                </div>
            </div>

            {/* Health Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {perfMetrics.map((metric, idx) => (
                    <div key={idx} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.02] rounded-bl-3xl -z-10 group-hover:bg-blue-500/10 transition-colors" />
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 rounded-xl bg-white/[0.03] text-gray-400 group-hover:text-blue-400 transition-colors">
                                <metric.icon className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{metric.label}</span>
                        </div>
                        <div className="flex items-end justify-between">
                            <p className="text-xl font-black text-white">{metric.value}</p>
                            <span className="text-[9px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">{metric.status}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Logs Interface */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden flex flex-col h-[600px]">
                <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between gap-4">
                    <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
                        {["all", "auth", "trading", "system"].map(c => (
                            <button key={c} onClick={() => setFilter(c)} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${filter === c ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-gray-500 hover:text-white"}`}>{c}</button>
                        ))}
                    </div>
                    <div className="relative group flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-blue-500 transition-colors" />
                        <input type="text" placeholder="Search logs..." className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-blue-500/30" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 font-mono text-xs">
                    {logs.map((log) => (
                        <div key={log.id} className="group flex items-start gap-4 p-3 rounded-lg hover:bg-white/[0.03] border border-transparent hover:border-white/5 transition-all">
                            <span className="text-gray-600 w-44 shrink-0">[{log.timestamp.toLocaleString()}]</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border shrink-0 ${getLevelColor(log.level)}`}>{log.level}</span>
                            <span className="text-gray-500 w-16 uppercase tracking-wider font-bold">[{log.category}]</span>
                            <p className="text-gray-300 group-hover:text-white transition-colors">{log.message}</p>
                        </div>
                    ))}
                    <div className="p-4 flex items-center gap-3 text-gray-600 animate-pulse">
                        <Terminal className="h-4 w-4" />
                        <span>Listening for incoming system events...</span>
                    </div>
                </div>

                <div className="p-4 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mainstream: Nominal</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Worker A: Operational</span>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Build v2.4.0-admin</span>
                </div>
            </div>

            <div className="p-8 rounded-3xl bg-amber-500/5 border border-amber-500/10 flex flex-col md:flex-row items-center justify-between gap-6 pb-20">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-amber-600/10 flex items-center justify-center text-amber-500 shrink-0">
                        <ShieldAlert className="h-7 w-7" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold tracking-tight text-lg">System Maintenance Scheduled</h3>
                        <p className="text-sm text-gray-500 max-w-sm">Global cleanup of archived logs and temporary session data is scheduled in 4 hours.</p>
                    </div>
                </div>
                <button className="w-full md:w-auto px-8 py-3 bg-amber-600/20 text-amber-400 border border-amber-600/30 rounded-2xl font-black hover:bg-amber-600/30 transition-all active:scale-95 uppercase tracking-wider text-sm">Reschedule</button>
            </div>
        </div>
    )
}
