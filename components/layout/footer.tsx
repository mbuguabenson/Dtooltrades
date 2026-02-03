"use client"

import { Separator } from "@/components/ui/separator"

interface FooterProps {
    theme: "light" | "dark"
}

export function Footer({ theme }: FooterProps) {
    return (
        <footer className={`w-full py-6 mt-12 mb-6 px-4 md:px-8 border-t transition-colors duration-300 ${theme === 'dark'
                ? 'border-slate-800 bg-[#0a0e17]'
                : 'border-slate-200 bg-white'
            }`}>
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-4">
                    <span className={`font-bold tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>
                        PROFIT HUB
                    </span>
                    <div className={`h-3 w-px ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-300'}`}></div>
                    <span className={`${theme === 'dark' ? 'text-slate-600' : 'text-slate-500'}`}>
                        © 2026 All Rights Reserved
                    </span>
                </div>

                <div className={`flex items-center gap-6 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-500'}`}>
                    <a href="#" className="hover:text-blue-500 transition-colors">Terms</a>
                    <a href="#" className="hover:text-blue-500 transition-colors">Privacy</a>
                    <a href="#" className="hover:text-blue-500 transition-colors">Status</a>
                    <span className="opacity-50">v2.4.0</span>
                </div>
            </div>
        </footer>
    )
}
