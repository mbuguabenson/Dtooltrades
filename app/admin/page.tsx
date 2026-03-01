"use client"

import React, { useState, useEffect } from "react"
import {
  Users,
  Wallet,
  TrendingUp,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  UserCheck,
  Zap,
  DollarSign
} from "lucide-react"
import { AdminStatsCard } from "@/components/admin/admin-stats-card"
import { AdminLiveFeed } from "@/components/admin/admin-live-feed"

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/overview")
        const data = await res.json()
        setStats(data)
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
    const interval = setInterval(fetchStats, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Header */}
      <div>
        <h2 className="text-3xl font-black text-white tracking-tight">Good Morning, Admin</h2>
        <p className="text-sm text-gray-500 mt-1">Real-time platform performance overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatsCard
          label="Total Active Users"
          value={loading ? "..." : (stats?.totalUsers || 0).toString()}
          subValue={loading ? "Loading..." : `${stats?.onlineUsers || 0} Online now`}
          icon={UserCheck}
          trend={{ value: 12, label: "this month", positive: true }}
          color="blue"
        />
        <AdminStatsCard
          label="Real Balance Total"
          value={loading ? "..." : `$${(stats?.totalRealBalance || 0).toLocaleString()}`}
          subValue={loading ? "Loading..." : "Live platform reserve"}
          icon={Wallet}
          trend={{ value: 5.2, label: "vs last week", positive: true }}
          color="green"
        />
        <AdminStatsCard
          label="Net Performance"
          value={loading ? "..." : `$${(stats?.netPerformance || 0).toFixed(2)}`}
          subValue={loading ? "Loading..." : "Total Platform P/L"}
          icon={TrendingUp}
          trend={{ value: stats?.netPerformance >= 0 ? 10 : -10, label: "All time", positive: stats?.netPerformance >= 0 }}
          color="purple"
        />
        <AdminStatsCard
          label="Trading Volume"
          value={loading ? "..." : `$${(stats?.totalVolume || 0).toLocaleString()}`}
          subValue={loading ? "Loading..." : "Total stake processed"}
          icon={Zap}
          trend={{ value: 2.1, label: "System load", positive: true }}
          color="orange"
        />
      </div>

      {/* Middle Section: Portfolio & Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Area (Portfolio Placeholder) */}
        <div className="lg:col-span-2 bg-[#0a0a0a] rounded-3xl border border-white/5 p-8 relative overflow-hidden flex flex-col min-h-[450px]">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-white">Platform Performance</h3>
              <p className="text-xs text-gray-500">Global trading activity overview</p>
            </div>
            <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
              {["1D", "1W", "1M", "1Y"].map(t => (
                <button key={t} className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${t === "1Y" ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-white"}`}>{t}</button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
            {/* This would be the real Recharts/Chart.js container */}
            <div className="text-center group cursor-pointer">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-gray-400 font-bold tracking-tight">Real-time Analytics Engine</p>
              <p className="text-gray-600 text-xs mt-1 lowercase font-mono">connecting to websocket stream...</p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-white/5">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Profits</p>
              <h4 className="text-xl font-black text-white">{loading ? "..." : (stats?.netPerformance >= 0 ? "+" : "") + (stats?.netPerformance || 0).toFixed(2)}</h4>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold mt-1">
                <ArrowUpRight className="h-3 w-3" />
                Aggregated P/L
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Online Users</p>
              <h4 className="text-xl font-black text-white">{loading ? "..." : (stats?.onlineUsers || 0)}</h4>
              <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium mt-1 uppercase">
                Active connections
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Platform Volume</p>
              <h4 className="text-xl font-black text-white">${loading ? "..." : (stats?.totalVolume || 0).toLocaleString()}</h4>
              <div className="flex items-center gap-1 text-[10px] text-blue-400 font-bold mt-1 uppercase tracking-tighter">
                Processed Stakes
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar for Live Feed */}
        <AdminLiveFeed />
      </div>

      {/* Bottom Section: Top Traders & Wallet Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-8">
        <div className="bg-[#0a0a0a] rounded-3xl border border-white/5 p-6 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-white mb-6">Top Traders</h3>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center font-bold">
                    {["AW", "SJ", "MK"][i - 1]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{["Alex_Wolf", "Sarah_Jones", "Mark_Knight"][i - 1]}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Real Account • USD</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-400">+${[4200, 3100, 2800][i - 1]}</p>
                  <p className="text-[10px] text-gray-500 font-medium uppercase">{[92, 88, 85][i - 1]}% Win Rate</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0a0a0a] rounded-3xl border border-white/5 p-6 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-white mb-6">Asset Allocation</h3>
          <div className="space-y-6">
            {[
              { label: "Equities", value: 42, color: "bg-blue-500", amount: "$44,590.16" },
              { label: "USDT / Stable", value: 28, color: "bg-emerald-500", amount: "$12,131.11" },
              { label: "Bitcoin / ETH", value: 15, color: "bg-orange-500", amount: "$9,836.07" },
              { label: "Others", value: 15, color: "bg-purple-500", amount: "$8,750.00" },
            ].map((asset, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-400 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${asset.color}`} />
                    {asset.label}
                  </span>
                  <span className="text-xs font-black text-white">{asset.amount} <span className="text-gray-500 font-medium font-mono text-[10px]">({asset.value}%)</span></span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${asset.color} shadow-[0_0_10px_rgba(37,99,235,0.2)]`}
                    style={{ width: `${asset.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
