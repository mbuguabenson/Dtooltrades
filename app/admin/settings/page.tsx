"use client"

import React, { useState } from "react"
import {
    Settings,
    Shield,
    Globe,
    Bell,
    Database,
    Terminal,
    Cpu,
    Save,
    Lock,
    Eye,
    EyeOff,
    CloudLightning,
    RefreshCcw
} from "lucide-react"

export default function AdminSettingsPage() {
    const [showApiKey, setShowApiKey] = useState(false)

    const settingsSections = [
        { id: "general", label: "General", icon: Globe },
        { id: "security", label: "Security & Access", icon: Shield },
        { id: "trading", label: "Trading Engine", icon: CloudLightning },
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "advanced", label: "Advanced API", icon: Terminal },
    ]

    const [activeSection, setActiveSection] = useState("general")

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">System Settings</h2>
                    <p className="text-sm text-gray-500 mt-1">Configure platform-wide parameters and global rules.</p>
                </div>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black transition-all shadow-xl shadow-blue-500/20 active:scale-95 group">
                    <Save className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                    Save All Changes
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Col: Menu */}
                <div className="space-y-2">
                    {settingsSections.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setActiveSection(s.id)}
                            className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all duration-300 ${activeSection === s.id
                                    ? "bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-600/20"
                                    : "bg-white/[0.02] border-white/5 text-gray-400 hover:text-white hover:bg-white/[0.05]"
                                }`}
                        >
                            <s.icon className={`h-5 w-5 ${activeSection === s.id ? "text-white" : "text-gray-500"}`} />
                            <span className="text-sm font-bold">{s.label}</span>
                        </button>
                    ))}
                </div>

                {/* Right Col: Content Area */}
                <div className="lg:col-span-3">
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 space-y-10 min-h-[600px]">
                        {activeSection === "general" && (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2">Platform Branding</h3>
                                    <p className="text-xs text-gray-500">Customize the appearance and identity of Profit Hub.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Site Title</label>
                                        <input type="text" defaultValue="Profit Hub" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-blue-500/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Support Email</label>
                                        <input type="email" defaultValue="support@profithub.com" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-blue-500/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Maintenance Mode</label>
                                        <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-3">
                                            <div className="w-12 h-6 bg-gray-800 rounded-full relative cursor-pointer group">
                                                <div className="absolute left-1 top-1 w-4 h-4 bg-gray-500 rounded-full transition-all group-hover:scale-110" />
                                            </div>
                                            <span className="text-xs font-bold text-gray-500">Deactivated</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Region Locking</label>
                                        <div className="flex items-center gap-4 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                                            <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-lg" />
                                            </div>
                                            <span className="text-xs font-bold text-blue-400">Restricted Mode Active</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === "security" && (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2">Access Control</h3>
                                    <p className="text-xs text-gray-500">Manage security protocols and administrator access.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                                <Lock className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">Two-Factor Authentication</h4>
                                                <p className="text-[10px] text-gray-500">Require 2FA for all administrative logins.</p>
                                            </div>
                                        </div>
                                        <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                                            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                                                <Shield className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">Auto-Logout</h4>
                                                <p className="text-[10px] text-gray-500">Inactivity period before requiring re-auth (min).</p>
                                            </div>
                                        </div>
                                        <input type="number" defaultValue="15" className="w-20 bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-sm text-center font-black text-blue-400 focus:outline-none" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === "advanced" && (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-2">API Infrastructure</h3>
                                        <p className="text-xs text-gray-500">Sensitive integration keys and endpoint configuration.</p>
                                    </div>
                                    <button className="flex items-center gap-2 text-xs font-black text-blue-400 hover:text-blue-300 transition-colors">
                                        <RefreshCcw className="h-3.5 w-3.5" />
                                        Rotate Keys
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Master Deriv App ID</label>
                                        <div className="relative group">
                                            <input
                                                type={showApiKey ? "text" : "password"}
                                                defaultValue="1053248924924729"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 pr-12 text-sm text-white focus:outline-none font-mono tracking-widest"
                                            />
                                            <button
                                                onClick={() => setShowApiKey(!showApiKey)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                            >
                                                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex items-center gap-4">
                                        <Database className="h-8 w-8 text-rose-500 shrink-0" />
                                        <div>
                                            <h4 className="text-rose-400 font-bold text-sm">Clear System Cache</h4>
                                            <p className="text-[10px] text-gray-500 leading-normal">Flushes all temporary analysis data and session states. Use this only during troubleshooting or updates.</p>
                                        </div>
                                        <button className="ml-auto px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all">Flush Now</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
