"use client"

import { useState } from "react"
import { useDerivAPI } from "@/lib/deriv-api-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AccountDetails } from "@/components/account/account-details"
import { StatementList } from "@/components/account/statement-list"
import { ProfitReport } from "@/components/account/profit-report"
import { AccountAnalytics } from "@/components/account/account-analytics"
import { DerivAuth } from "@/components/deriv-auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, ReceiptText, BarChart3, PieChart, ShieldCheck, ArrowLeft, Home } from "lucide-react"
import Link from "next/link"

export default function AccountPage() {
    const { isLoggedIn, accountType, activeLoginId } = useDerivAPI()
    const [activeTab, setActiveTab] = useState("details")

    if (!isLoggedIn) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center">
                <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center mb-8 animate-pulse">
                    <User className="h-12 w-12 text-blue-500" />
                </div>
                <h1 className="text-4xl font-black mb-4 tracking-tighter">Account Dashboard</h1>
                <p className="text-slate-400 max-w-md mb-8 leading-relaxed">
                    Unlock your full trading potential. Log in with your Deriv account to access deep analytics, history, and real-time reports.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <DerivAuth theme="dark" />
                    <Link href="/">
                        <Button variant="ghost" className="text-slate-500 hover:text-white">
                            <Home className="mr-2 h-4 w-4" />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 min-h-screen">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800 pb-8">
                <div className="space-y-4">
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="pl-0 text-slate-500 hover:text-blue-400 font-bold transition-colors group">
                            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Trading Terminal
                        </Button>
                    </Link>

                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider">
                                Dashboard
                            </Badge>
                            <div className="h-1 w-1 rounded-full bg-slate-700"></div>
                            <span className="text-xs font-bold text-slate-500 font-mono tracking-wider">{activeLoginId}</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter flex items-center gap-3">
                            Account Hub
                            {accountType === "Real" ? (
                                <ShieldCheck className="h-8 w-8 text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                            ) : (
                                <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-black uppercase tracking-widest text-[10px]">Demo</Badge>
                            )}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-2xl border border-slate-800 shadow-xl">
                    <DerivAuth theme="dark" />
                </div>
            </header>

            <div className="bg-slate-950/30 rounded-3xl p-1 sm:p-2 border border-slate-800/50">
                <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex justify-center mb-8">
                        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full md:w-[640px] h-14 bg-slate-900/80 border border-slate-800/50 rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl">
                            <TabsTrigger value="details" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/20 font-bold text-xs gap-2 transition-all">
                                <User className="h-4 w-4" />
                                <span className="hidden sm:inline">User Details</span>
                                <span className="sm:hidden">Details</span>
                            </TabsTrigger>
                            <TabsTrigger value="statement" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/20 font-bold text-xs gap-2 transition-all">
                                <ReceiptText className="h-4 w-4" />
                                <span className="hidden sm:inline">Transaction Statement</span>
                                <span className="sm:hidden">Statements</span>
                            </TabsTrigger>
                            <TabsTrigger value="reports" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/20 font-bold text-xs gap-2 transition-all">
                                <BarChart3 className="h-4 w-4" />
                                <span className="hidden sm:inline">Profit Reports</span>
                                <span className="sm:hidden">Reports</span>
                            </TabsTrigger>
                            <TabsTrigger value="analytics" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/20 font-bold text-xs gap-2 transition-all">
                                <PieChart className="h-4 w-4" />
                                <span className="hidden sm:inline">Strategy Analytics</span>
                                <span className="sm:hidden">Analytics</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <TabsContent value="details" className="mt-0 focus-visible:outline-none">
                            <AccountDetails theme="dark" />
                        </TabsContent>

                        <TabsContent value="statement" className="mt-0 focus-visible:outline-none">
                            <StatementList theme="dark" />
                        </TabsContent>

                        <TabsContent value="reports" className="mt-0 focus-visible:outline-none">
                            <ProfitReport theme="dark" />
                        </TabsContent>

                        <TabsContent value="analytics" className="mt-0 focus-visible:outline-none">
                            <AccountAnalytics theme="dark" />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>

            <footer className="pt-20 pb-10 border-t border-slate-800/30 text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Live Secure Gateway</span>
                </div>
                <p className="text-[10px] text-slate-600 max-w-lg mx-auto leading-relaxed">
                    Flux Traders Advanced Analytics © 2026. All trading operations are executed directly via Deriv WebSockets.
                    Your private data remains on your device and is never stored on our servers.
                </p>
            </footer>
        </div>
    )
}
