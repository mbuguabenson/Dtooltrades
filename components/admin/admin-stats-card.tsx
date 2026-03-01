"use client"

import React from "react"
import { LucideIcon } from "lucide-react"

interface AdminStatsCardProps {
    label: string
    value: string | number
    subValue?: string
    icon: LucideIcon
    trend?: {
        value: number
        label: string
        positive: boolean
    }
    color?: "blue" | "green" | "purple" | "orange" | "red"
}

export function AdminStatsCard({ label, value, subValue, icon: Icon, trend, color = "blue" }: AdminStatsCardProps) {
    const colorMap = {
        blue: "from-blue-500 to-blue-600 shadow-blue-500/20 text-blue-400 border-blue-500/20 bg-blue-500/5",
        green: "from-emerald-500 to-emerald-600 shadow-emerald-500/20 text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
        purple: "from-purple-500 to-purple-600 shadow-purple-500/20 text-purple-400 border-purple-500/20 bg-purple-500/5",
        orange: "from-orange-500 to-orange-600 shadow-orange-500/20 text-orange-400 border-orange-500/20 bg-orange-500/5",
        red: "from-red-500 to-red-600 shadow-red-500/20 text-red-400 border-red-500/20 bg-red-500/5",
    }

    return (
        <div className={`p-6 rounded-2xl border ${colorMap[color].split(' ').filter(c => c.startsWith('border-') || c.startsWith('bg-')).join(' ')} relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}>
            {/* Background Decor */}
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 group-hover:opacity-10 transition-opacity bg-gradient-to-br ${colorMap[color].split(' ').filter(c => c.startsWith('from-') || c.startsWith('to-')).join(' ')}`} />

            <div className="flex justify-between items-start mb-4 relative z-10 transition-transform duration-300 group-hover:scale-105">
                <div>
                    <p className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">{label}</p>
                    <h3 className="text-2xl font-black text-white tracking-tight">{value}</h3>
                    {subValue && (
                        <p className="text-[10px] text-gray-400 mt-1 font-mono uppercase tracking-widest">{subValue}</p>
                    )}
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${colorMap[color].split(' ').filter(c => c.startsWith('from-') || c.startsWith('to-')).join(' ')} shadow-lg`}>
                    <Icon className="h-5 w-5 text-white" />
                </div>
            </div>

            {trend && (
                <div className="flex items-center gap-2 mt-4 relative z-10">
                    <span className={`text-xs font-bold flex items-center gap-1 ${trend.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {trend.positive ? '+' : ''}{trend.value}%
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{trend.label}</span>
                </div>
            )}
        </div>
    )
}
