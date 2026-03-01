"use client"

import { useState, useEffect, useRef } from "react"
import { useDerivAPI } from "@/lib/deriv-api-context"
import {
    User, CreditCard, ShieldCheck, Camera, Edit2, Check, X,
    TrendingUp, TrendingDown, Wallet, Copy, CheckCheck, Star,
    ArrowUpRight, Zap, BarChart3, RefreshCw
} from "lucide-react"

interface AccountDetailsProps {
    theme?: "light" | "dark"
}

function CopyBadge({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)
    return (
        <button
            onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            className="ml-1 p-0.5 text-gray-500 hover:text-blue-400 transition-colors"
        >
            {copied ? <CheckCheck className="h-3 w-3 text-blue-400" /> : <Copy className="h-3 w-3" />}
        </button>
    )
}

const ACCOUNT_GRADIENTS: Record<string, string> = {
    "Real-USD": "from-emerald-600 to-teal-700",
    "Real-EUR": "from-blue-600 to-indigo-700",
    "Real-BTC": "from-orange-500 to-amber-600",
    "Real-ETH": "from-purple-600 to-violet-700",
    "Demo": "from-slate-600 to-slate-700",
}

function getGradient(type: string, currency: string) {
    if (type === "Demo") return ACCOUNT_GRADIENTS["Demo"]
    return ACCOUNT_GRADIENTS[`Real-${currency}`] || "from-blue-600 to-blue-800"
}

export function AccountDetails({ theme = "dark" }: AccountDetailsProps) {
    const { activeLoginId, accountType, balance, accounts, apiClient, isAuthorized } = useDerivAPI()
    const [username, setUsername] = useState("")
    const [profileImage, setProfileImage] = useState("")
    const [isEditingUsername, setIsEditingUsername] = useState(false)
    const [tempUsername, setTempUsername] = useState("")
    const fileRef = useRef<HTMLInputElement>(null)
    // Per-account balances fetched from Deriv, keyed by loginId
    const [accountBalances, setAccountBalances] = useState<Record<string, number>>({})
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        const savedUsername = localStorage.getItem(`dtool_username_${activeLoginId}`)
        const savedImage = localStorage.getItem(`dtool_avatar_${activeLoginId}`)
        if (savedUsername) setUsername(savedUsername)
        if (savedImage) setProfileImage(savedImage)
    }, [activeLoginId])

    // Fetch balance for every account via Deriv API
    const fetchAllBalances = async () => {
        if (!apiClient || !isAuthorized || accounts.length === 0) return
        setRefreshing(true)
        try {
            // Deriv `balance` with `account: all` returns all accounts
            const resp = await (apiClient as any).send?.({ balance: 1, account: "all" })
            if (resp?.balance?.accounts) {
                const map: Record<string, number> = {}
                Object.entries(resp.balance.accounts).forEach(([id, data]: [string, any]) => {
                    map[id] = data.balance ?? 0
                })
                setAccountBalances(map)
            } else if (resp?.balance?.balance !== undefined) {
                // fallback: only active account returned
                setAccountBalances({ [activeLoginId!]: resp.balance.balance })
            }
        } catch {
            // Fall back to context balances (via `accounts` array)
        }
        setRefreshing(false)
    }

    useEffect(() => { fetchAllBalances() }, [apiClient, isAuthorized, activeLoginId])

    const saveUsername = () => {
        setUsername(tempUsername)
        localStorage.setItem(`dtool_username_${activeLoginId}`, tempUsername)
        setIsEditingUsername(false)
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                const base64 = reader.result as string
                setProfileImage(base64)
                localStorage.setItem(`dtool_avatar_${activeLoginId}`, base64)
            }
            reader.readAsDataURL(file)
        }
    }

    const totalBalance = accounts.reduce((s, a) => {
        const fetched = accountBalances[a.id]
        const bal = fetched !== undefined ? fetched : (a.id === activeLoginId ? (balance?.amount ?? a.balance ?? 0) : (a.balance ?? 0))
        return s + bal
    }, 0)
    const realAccounts = accounts.filter(a => a.type === "Real")
    const demoAccounts = accounts.filter(a => a.type === "Demo")
    const initials = (username || activeLoginId || "U").slice(0, 2).toUpperCase()
    const currentGradient = getGradient(accountType || "Demo", balance?.currency || "USD")

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

            {/* ─── Hero Profile Card ─── */}
            <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${currentGradient} p-7 shadow-2xl`}>
                {/* Decorative circles */}
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
                <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
                <div className="absolute top-4 right-20 w-8 h-8 rounded-full bg-white/10" />

                <div className="relative flex items-start gap-5">
                    {/* Avatar */}
                    <div className="relative group cursor-pointer shrink-0" onClick={() => fileRef.current?.click()}>
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/30 shadow-xl bg-white/10 flex items-center justify-center">
                            {profileImage ? (
                                <img src={profileImage} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl font-black text-white">{initials}</span>
                            )}
                        </div>
                        <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="h-5 w-5 text-white" />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            {isEditingUsername ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        value={tempUsername}
                                        onChange={e => setTempUsername(e.target.value)}
                                        autoFocus
                                        placeholder="Enter display name"
                                        className="bg-white/20 border-0 rounded-lg px-3 py-1.5 text-sm font-bold text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 w-40"
                                        onKeyDown={e => e.key === "Enter" && saveUsername()}
                                    />
                                    <button onClick={saveUsername} className="p-1 bg-white/20 rounded-lg hover:bg-white/30"><Check className="h-4 w-4 text-white" /></button>
                                    <button onClick={() => setIsEditingUsername(false)} className="p-1 bg-white/10 rounded-lg hover:bg-white/20"><X className="h-4 w-4 text-white/70" /></button>
                                </div>
                            ) : (
                                <button onClick={() => { setTempUsername(username); setIsEditingUsername(true) }} className="group/edit flex items-center gap-2">
                                    <h2 className="text-xl font-black text-white">{username || "Trader Profile"}</h2>
                                    <Edit2 className="h-3.5 w-3.5 text-white/40 group-hover/edit:text-white/80 transition-colors" />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-1 text-white/60 text-xs font-mono">
                            {activeLoginId || "—"}
                            {activeLoginId && <CopyBadge text={activeLoginId} />}
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-white/20 text-white px-2.5 py-1 rounded-full">
                                <ShieldCheck className="h-3 w-3" /> Verified
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${accountType === "Real" ? "bg-emerald-400/20 text-emerald-300" : "bg-amber-400/20 text-amber-300"}`}>
                                <Star className="h-3 w-3" /> {accountType || "Deriv"}
                            </span>
                        </div>
                    </div>

                    {/* Big balance */}
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Active Balance</p>
                        <p className="text-3xl font-black text-white leading-none">
                            {balance ? Number(balance.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                        </p>
                        <p className="text-sm text-white/60 mt-0.5">{balance?.currency || "—"}</p>
                    </div>
                </div>

                {/* Balance (mobile) */}
                <div className="sm:hidden mt-4 pt-4 border-t border-white/10">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Active Balance</p>
                    <p className="text-3xl font-black text-white">
                        {balance ? Number(balance.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                        <span className="text-base font-medium text-white/60 ml-2">{balance?.currency}</span>
                    </p>
                </div>
            </div>

            {/* ─── Stat Cards Row ─── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    {
                        icon: <Wallet className="h-5 w-5" />,
                        label: "Total Accounts",
                        value: accounts.length,
                        color: "text-blue-400",
                        bg: "bg-blue-500/10",
                        border: "border-blue-500/20",
                    },
                    {
                        icon: <TrendingUp className="h-5 w-5" />,
                        label: "Real Accounts",
                        value: realAccounts.length,
                        color: "text-emerald-400",
                        bg: "bg-emerald-500/10",
                        border: "border-emerald-500/20",
                    },
                    {
                        icon: <Zap className="h-5 w-5" />,
                        label: "Demo Accounts",
                        value: demoAccounts.length,
                        color: "text-amber-400",
                        bg: "bg-amber-500/10",
                        border: "border-amber-500/20",
                    },
                    {
                        icon: <BarChart3 className="h-5 w-5" />,
                        label: "Trading Active",
                        value: "Yes",
                        color: "text-purple-400",
                        bg: "bg-purple-500/10",
                        border: "border-purple-500/20",
                    },
                ].map((s, i) => (
                    <div key={i} className={`relative overflow-hidden rounded-2xl border ${s.border} ${s.bg} p-5 group hover:scale-[1.02] transition-transform`}>
                        <div className={`${s.color} mb-3`}>{s.icon}</div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">{s.label}</p>
                        <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                        <div className="absolute -bottom-3 -right-3 w-12 h-12 rounded-full opacity-10" style={{ background: "currentColor" }} />
                    </div>
                ))}
            </div>

            {/* ─── Linked Accounts List ─── */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden">
                <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Linked Accounts</h3>
                        <p className="text-[10px] text-gray-600 mt-0.5">All Deriv accounts associated with your profile</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-500 bg-white/5 px-3 py-1 rounded-full">{accounts.length} accounts</span>
                        <button
                            onClick={fetchAllBalances}
                            disabled={refreshing}
                            className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-gray-500 hover:text-blue-400 hover:border-blue-500/30 transition-all disabled:opacity-40"
                            title="Refresh balances"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                        </button>
                    </div>
                </div>
                <div className="divide-y divide-white/[0.03]">
                    {accounts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14 text-center">
                            <CreditCard className="h-10 w-10 text-gray-700 mb-3" />
                            <p className="text-gray-500 font-bold text-sm">No accounts linked</p>
                            <p className="text-gray-700 text-xs mt-1">Connect your Deriv account to see your linked accounts here</p>
                        </div>
                    ) : accounts.map(acc => {
                        const grad = getGradient(acc.type, acc.currency ?? "USD")
                        const isActive = acc.id === activeLoginId
                        return (
                            <div key={acc.id} className={`flex items-center justify-between px-6 py-4 transition-all ${isActive ? "bg-blue-500/5" : "hover:bg-white/[0.015]"}`}>
                                <div className="flex items-center gap-4">
                                    {/* Gradient icon */}
                                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-lg`}>
                                        <span className="text-xs font-black text-white">{acc.currency?.slice(0, 3) || (acc.type === "Demo" ? "D" : "R")}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-white font-mono">{acc.id}</span>
                                            {isActive && (
                                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-blue-500/15 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                                                    <span className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" /> Active
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${acc.type === "Demo"
                                                ? "bg-amber-500/10 text-amber-400"
                                                : "bg-emerald-500/10 text-emerald-400"
                                                }`}>{acc.type}</span>
                                            <span className="text-[10px] text-gray-600">{acc.currency}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {refreshing ? (
                                        <div className="w-16 h-4 bg-white/5 rounded animate-pulse ml-auto" />
                                    ) : (
                                        <p className="text-base font-black text-white tabular-nums">
                                            {(() => {
                                                const fetched = accountBalances[acc.id]
                                                const bal = fetched !== undefined ? fetched
                                                    : (acc.id === activeLoginId ? (balance?.amount ?? acc.balance ?? 0) : (acc.balance ?? 0))
                                                return bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                            })()}
                                        </p>
                                    )}
                                    <p className="text-[10px] text-gray-600">{acc.currency}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Total */}
                {accounts.length > 0 && (
                    <div className="px-6 py-4 bg-white/[0.015] border-t border-white/5 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Portfolio Total</span>
                        <div className="text-right">
                            <span className="text-lg font-black text-white">${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
