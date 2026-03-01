"use client"

import React, { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Wrench, ShieldAlert } from "lucide-react"

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
    const [maintenance, setMaintenance] = useState<{ active: boolean; message: string } | null>(null)
    const pathname = usePathname()

    useEffect(() => {
        // If we are on the admin path, we ignore maintenance mode
        if (pathname.startsWith("/admin")) {
            setMaintenance({ active: false, message: "" })
            return
        }

        const checkMaintenance = async () => {
            try {
                const res = await fetch("/api/admin/site-config")
                const data = await res.json()
                setMaintenance({
                    active: data.maintenanceMode,
                    message: data.maintenanceMessage || "We are performing scheduled maintenance. We'll be back shortly."
                })
            } catch (err) {
                console.error("Failed to check maintenance mode:", err)
            }
        }

        checkMaintenance()
        const interval = setInterval(checkMaintenance, 60000) // Check every minute
        return () => clearInterval(interval)
    }, [pathname])

    if (maintenance?.active && !pathname.startsWith("/admin")) {
        return (
            <div className="fixed inset-0 z-[9999] bg-[#050505] flex items-center justify-center p-6 text-center">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full -z-10"></div>
                <div className="max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/10">
                        <Wrench className="h-12 w-12 text-amber-500" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight mb-4">Under Maintenance</h1>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            {maintenance.message}
                        </p>
                    </div>
                    <div className="pt-8 border-t border-white/5 flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            <ShieldAlert className="h-3 w-3 text-blue-500" />
                            Platform Integrity Guard
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
