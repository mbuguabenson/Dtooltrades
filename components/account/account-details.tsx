"use client"

import { useDerivAPI } from "@/lib/deriv-api-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, CreditCard, ShieldCheck } from "lucide-react"

interface AccountDetailsProps {
    theme?: "light" | "dark"
}

export function AccountDetails({ theme = "dark" }: AccountDetailsProps) {
    const { activeLoginId, accountType, balance, accounts } = useDerivAPI()

    const currentAccount = accounts.find(acc => acc.id === activeLoginId)

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className={`${theme === "dark" ? "bg-slate-900/50 border-slate-800" : "bg-white"}`}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <User className="h-5 w-5 text-blue-500" />
                            Profile Information
                        </CardTitle>
                        <CardDescription>Your account identification details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                            <span className="text-slate-400 text-sm">Login ID</span>
                            <span className="font-mono font-bold">{activeLoginId || "N/A"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                            <span className="text-slate-400 text-sm">Account Type</span>
                            <Badge variant={accountType === "Real" ? "default" : "secondary"} className={accountType === "Real" ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                                {accountType || "Unknown"}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                            <span className="text-slate-400 text-sm">Currency</span>
                            <span className="font-bold">{balance?.currency || "N/A"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-slate-400 text-sm">Status</span>
                            <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                                <ShieldCheck className="h-4 w-4" />
                                Verified
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`${theme === "dark" ? "bg-slate-900/50 border-slate-800" : "bg-white"}`}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <CreditCard className="h-5 w-5 text-purple-500" />
                            Balance Summary
                        </CardTitle>
                        <CardDescription>Current funds available for trading</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-6">
                        <div className="text-4xl font-black tracking-tighter mb-1">
                            {balance ? `${Number(balance.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "0.00"}
                            <span className="ml-2 text-xl text-slate-500 font-medium">{balance?.currency}</span>
                        </div>
                        <p className="text-slate-400 text-sm">Total Equity</p>

                        <div className="mt-8 w-full grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 text-center">
                                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Accounts</div>
                                <div className="text-lg font-bold">{accounts?.length || 0}</div>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 text-center">
                                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Active Trading</div>
                                <div className="text-lg font-bold text-emerald-400">Yes</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className={`${theme === "dark" ? "bg-slate-900/50 border-slate-800" : "bg-white"}`}>
                <CardHeader>
                    <CardTitle>Linked Accounts</CardTitle>
                    <CardDescription>All your Deriv accounts associated with this profile</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {accounts?.map((acc) => (
                            <div
                                key={acc.id}
                                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${acc.id === activeLoginId
                                    ? "bg-blue-500/10 border-blue-500/50 ring-1 ring-blue-500/20"
                                    : "bg-slate-800/20 border-slate-800 hover:border-slate-700"
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${acc.type === "Demo" ? "bg-amber-400/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
                                        }`}>
                                        {acc.type === "Demo" ? "D" : "R"}
                                    </div>
                                    <div>
                                        <div className="font-bold flex items-center gap-2">
                                            {acc.id}
                                            {acc.id === activeLoginId && (
                                                <Badge variant="outline" className="text-[10px] h-4 bg-blue-500/20 text-blue-400 border-blue-500/30">Active</Badge>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-400">{acc.type} Account • {acc.currency}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold">{(acc.balance || 0).toFixed(2)} {acc.currency}</div>
                                </div>
                            </div>
                        )) || <div className="text-center py-8 text-slate-500">No accounts found</div>}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
