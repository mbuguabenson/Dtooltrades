"use client"

import React, { useState } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { useTheme } from "@/lib/theme-provider-advanced"
import { Bell, Search, User } from "lucide-react"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { currentTheme } = useTheme()
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)

    return (
        <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans">
            {/* Sidebar */}
            <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Top Header */}
                <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#050505]/50 backdrop-blur-xl z-20">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span>Main Menu</span>
                            <span>/</span>
                            <span className="text-white font-medium capitalize">Dashboard</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative group hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Quick Search... (Ctrl+K)"
                                className="bg-white/5 border border-white/10 rounded-lg py-1.5 pl-10 pr-4 text-sm w-64 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                            />
                        </div>

                        <button className="relative group p-2 hover:bg-white/5 rounded-lg transition-colors">
                            <Bell className="h-5 w-5 text-gray-400 group-hover:text-white" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#050505]"></span>
                        </button>

                        <div className="flex items-center gap-3 pl-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border border-white/10">
                                <User className="h-4 w-4 text-white" />
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-xs font-bold leading-none">Admin Panel</p>
                                <p className="text-[10px] text-gray-400 leading-tight">Master Root</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Scrollable Area */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 custom-scrollbar relative">
                    {/* Background Glows */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

                    {children}
                </main>
            </div>
        </div>
    )
}
