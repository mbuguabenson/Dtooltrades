import { useDerivAPI } from "@/lib/deriv-api-context"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogIn, LogOut, UserPlus } from "lucide-react"
import { useState, useEffect } from "react"

interface DerivAuthProps {
  theme?: "light" | "dark"
}

export function DerivAuth({ theme = "dark" }: DerivAuthProps) {
  const {
    isLoggedIn,
    requestLogin,
    logout,
    balance,
    accountType,
    accountCode,
    accounts,
    switchAccount,
    activeLoginId,
  } = useDerivAPI()

  const [customUsername, setCustomUsername] = useState<string>("")
  const [profileImage, setProfileImage] = useState<string>("")

  useEffect(() => {
    if (activeLoginId) {
      const savedUsername = localStorage.getItem(`dtool_username_${activeLoginId}`)
      const savedImage = localStorage.getItem(`dtool_avatar_${activeLoginId}`)
      setCustomUsername(savedUsername || "")
      setProfileImage(savedImage || "")
    }
  }, [activeLoginId])

  const createDerivAccount = () => {
    window.open("https://track.deriv.com/_1mHiO0UpCX6NhxmBqQyZL2Nd7ZgqdRLk/1/", "_blank", "noopener,noreferrer")
  }

  const getAccountIcon = (accId: string, accCurrency?: string, accType?: string) => {
    // If it's the active account and we have a custom image, show it
    if (accId === activeLoginId && profileImage) {
      return (
        <Avatar className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 ring-1 ring-blue-500/30">
          <AvatarImage src={profileImage} className="object-cover" />
          <AvatarFallback className="bg-slate-800 text-blue-400 text-[10px] font-black">
            {accCurrency?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
      )
    }

    // Default icons
    const isDemo = accType === "Demo" || accId.startsWith('VRTC')
    if (isDemo) {
      return (
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-400/10 text-amber-500 ring-1 ring-amber-400/30 flex items-center justify-center text-[10px] sm:text-xs font-black shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/20 to-transparent"></div>
          <span className="relative z-10 flex items-center gap-0.5"><span className="opacity-70 text-[9px]">$</span>D</span>
        </div>
      )
    }

    if (accCurrency === "USD") {
      return (
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs shrink-0 bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/30 font-black relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-400/20 to-transparent"></div>
          <span className="relative z-10">$</span>
        </div>
      )
    }

    if (accCurrency === "UST" || accCurrency === "USDT") {
      return (
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs shrink-0 bg-[#26A17B]/10 text-[#26A17B] ring-1 ring-[#26A17B]/30 font-black relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#26A17B]/20 to-transparent"></div>
          <span className="relative z-10">₮</span>
        </div>
      )
    }

    if (accCurrency === "BTC") {
      return (
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs shrink-0 bg-[#F7931A]/10 text-[#F7931A] ring-1 ring-[#F7931A]/30 font-black relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#F7931A]/20 to-transparent"></div>
          <span className="relative z-10">₿</span>
        </div>
      )
    }

    return (
      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/30 flex items-center justify-center text-[10px] sm:text-xs font-black shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/20 to-transparent"></div>
        <span className="relative z-10">{accCurrency?.charAt(0) || "R"}</span>
      </div>
    )
  }

  return (
    <>
      {!isLoggedIn && (
        <div className="flex items-center gap-2">
          <Button
            onClick={createDerivAccount}
            size="sm"
            className={`text-xs sm:text-sm h-10 px-4 rounded-xl font-bold transition-all ${theme === "dark"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Sign Up
          </Button>
          <Button
            onClick={requestLogin}
            size="sm"
            className={`text-xs sm:text-sm h-10 px-4 rounded-xl font-bold transition-all ${theme === "dark"
              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
              : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
          >
            <LogIn className="h-4 w-4 mr-2" />
            Login
          </Button>
        </div>
      )}
      {isLoggedIn && (
        <div className="flex items-center space-x-2 sm:space-x-3">
          {accounts.length > 0 ? (
            <Select value={activeLoginId || ""} onValueChange={switchAccount}>
              <SelectTrigger
                className={`flex items-center h-8 sm:h-9 px-2 sm:px-3 rounded-xl border transition-all duration-300 min-w-[140px] shadow-sm ${theme === "dark"
                  ? "bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-slate-700/50 hover:border-blue-500/30 hover:shadow-blue-500/10 text-white"
                  : "bg-white border-gray-200 hover:border-blue-500/30 hover:shadow-blue-500/10 text-slate-900"
                  }`}
              >
                <div className="flex items-center gap-1.5 sm:gap-2 font-semibold text-[10px] sm:text-xs">
                  {getAccountIcon(activeLoginId || "", balance?.currency, accountType || undefined)}
                  {balance ? (
                    <div className="flex flex-col items-start leading-tight min-w-[70px]">
                      <span className={`text-[9px] sm:text-[10px] font-medium opacity-70 uppercase tracking-wide`}>
                        {customUsername || (accountType === "Demo" || accountCode?.startsWith('VRTC') ? "Demo" : "Real")}
                      </span>
                      <span className="font-bold tracking-tight">
                        {Number(balance.amount).toFixed(2)} <span className="text-[10px] opacity-70 font-medium">{balance.currency}</span>
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-start leading-tight min-w-[80px]">
                      <span className={`text-[9px] sm:text-[10px] font-medium opacity-70 uppercase tracking-wide`}>
                        {customUsername || accountType || "Loading"}
                      </span>
                      <span className="animate-pulse opacity-50 font-bold tracking-tight text-xs">Syncing...</span>
                    </div>
                  )}
                </div>
              </SelectTrigger>
              <SelectContent className={`min-w-[190px] p-2 rounded-xl shadow-xl border ${theme === "dark" ? "bg-[#0f172a] border-slate-700/50 text-white" : "bg-white border-gray-100"}`}>
                <div className="px-2 pb-2 mb-2 border-b border-gray-500/20 text-[10px] font-bold tracking-wider uppercase opacity-50">Select Account</div>
                {accounts.map((acc) => {
                  return (
                    <SelectItem key={acc.id} value={acc.id} className={`cursor-pointer mb-1 last:mb-0 rounded-lg py-2.5 transition-colors ${theme === "dark" ? "hover:bg-slate-800/80 focus:bg-slate-800/80" : "hover:bg-slate-50 focus:bg-slate-50"}`}>
                      <div className="flex items-center gap-3">
                        {getAccountIcon(acc.id, acc.currency || undefined, acc.type || undefined)}
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-bold tracking-tight">{acc.balance.toFixed(2)} <span className="text-[10px] opacity-70 font-medium">{acc.currency}</span></span>
                          <span className={`text-[10px] font-medium tracking-wide ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{acc.type === "Demo" || acc.id.startsWith("VRTC") ? "Demo" : "Real"} • {acc.id}</span>
                        </div>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          ) : (
            <div className={`px-5 h-10 sm:h-11 flex items-center border rounded-xl text-xs font-bold animate-pulse shadow-sm ${theme === "dark" ? "bg-slate-800/80 border-slate-700/50 text-white" : "bg-white border-gray-200 text-slate-900"}`}>
              Fetching accounts...
            </div>
          )}

          <Button
            onClick={logout}
            variant="ghost"
            size="icon"
            className={`h-8 w-8 sm:h-9 sm:w-9 rounded-xl transition-all duration-300 border shadow-sm ${theme === "dark"
              ? "bg-slate-800/80 border-slate-700/50 text-slate-300 hover:text-white hover:bg-rose-500/90 hover:border-rose-500"
              : "bg-white border-gray-200 text-slate-600 hover:text-white hover:bg-rose-500/90 hover:border-rose-500 hover:shadow-rose-500/20"
              }`}
            title="Secure Logout"
          >
            <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      )}
    </>
  )
}
