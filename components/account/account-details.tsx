import { useState, useEffect } from "react"
import { useDerivAPI } from "@/lib/deriv-api-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { User, CreditCard, ShieldCheck, Camera, Edit2, Check, X } from "lucide-react"

interface AccountDetailsProps {
    theme?: "light" | "dark"
}

export function AccountDetails({ theme = "dark" }: AccountDetailsProps) {
    const { activeLoginId, accountType, balance, accounts } = useDerivAPI()
    const [username, setUsername] = useState("")
    const [profileImage, setProfileImage] = useState("")
    const [isEditingUsername, setIsEditingUsername] = useState(false)
    const [tempUsername, setTempUsername] = useState("")

    useEffect(() => {
        // Load custom profile from localStorage
        const savedUsername = localStorage.getItem(`dtool_username_${activeLoginId}`)
        const savedImage = localStorage.getItem(`dtool_avatar_${activeLoginId}`)
        if (savedUsername) setUsername(savedUsername)
        if (savedImage) setProfileImage(savedImage)
    }, [activeLoginId])

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

    const currentAccount = accounts.find(acc => acc.id === activeLoginId)

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className={`${theme === "dark" ? "bg-slate-900/50 border-slate-800" : "bg-white"} overflow-hidden`}>
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <Avatar className="h-20 w-20 border-2 border-blue-500/20 shadow-lg">
                                    <AvatarImage src={profileImage} className="object-cover" />
                                    <AvatarFallback className="bg-slate-800 text-blue-400 text-2xl font-black">
                                        {(username || activeLoginId || "U").charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                                    <Camera className="h-6 w-6 text-white" />
                                    <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                                </label>
                            </div>
                            <div className="space-y-1 flex-1">
                                {isEditingUsername ? (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={tempUsername}
                                            onChange={(e) => setTempUsername(e.target.value)}
                                            className="h-8 bg-slate-950 border-slate-700 text-sm"
                                            placeholder="Enter username"
                                            autoFocus
                                        />
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-400" onClick={saveUsername}><Check className="h-4 w-4" /></Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-400" onClick={() => setIsEditingUsername(false)}><X className="h-4 w-4" /></Button>
                                    </div>
                                ) : (
                                    <CardTitle className="flex items-center gap-2 text-xl font-black group">
                                        {username || "Trader Profile"}
                                        <button
                                            onClick={() => { setTempUsername(username); setIsEditingUsername(true); }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                        >
                                            <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                                        </button>
                                    </CardTitle>
                                )}
                                <CardDescription className="text-xs font-mono text-slate-500">{activeLoginId || "Deriv Member"}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4 border-t border-slate-800/50">
                        <div className="flex justify-between items-center py-1">
                            <span className="text-slate-400 text-sm">Account Status</span>
                            <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-lg">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Verified
                            </div>
                        </div>
                        <div className="flex justify-between items-center py-1">
                            <span className="text-slate-400 text-sm">Account Type</span>
                            <Badge variant={accountType === "Real" ? "default" : "secondary"} className={accountType === "Real" ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                                {accountType || "Unknown"}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center py-1">
                            <span className="text-slate-400 text-sm">Main Currency</span>
                            <span className="font-bold text-slate-200">{balance?.currency || "N/A"}</span>
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
