"use client"

import { useDerivAPI } from "@/lib/deriv-api-context"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Settings, LogIn, LogOut, UserPlus } from "lucide-react"

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

  const openDerivAccount = () => {
    window.open("https://app.deriv.com/account", "_blank", "noopener,noreferrer")
  }

  const createDerivAccount = () => {
    window.open("https://track.deriv.com/_1mHiO0UpCX6NhxmBqQyZL2Nd7ZgqdRLk/1/", "_blank", "noopener,noreferrer")
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
        <div className="flex items-center space-x-1 sm:space-x-2">
          {accounts.length > 0 ? (
            <Select value={activeLoginId || ""} onValueChange={switchAccount}>
              <SelectTrigger
                className={`flex items-center h-8 sm:h-9 px-2 sm:px-4 rounded-full border border-transparent shadow-none focus:ring-0 transition-all min-w-[140px] ${theme === "dark"
                  ? "bg-white/5 hover:bg-white/10 text-white"
                  : "bg-black/5 hover:bg-black/10 text-slate-900"
                  }`}
              >
                <div className="flex items-center gap-1.5 sm:gap-2 font-bold text-[10px] sm:text-xs">
                  {accountType === "Demo" || accountCode?.startsWith('VRTC') ? (
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-amber-400 text-black flex items-center justify-center text-[9px] sm:text-[10px] font-black shrink-0">
                      D
                    </div>
                  ) : balance?.currency === "USD" ? (
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] sm:text-xs overflow-hidden shrink-0 bg-blue-50/10">
                      <span className="scale-[1.2] -mt-[1px]">🇺🇸</span>
                    </div>
                  ) : (
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] sm:text-[10px] font-black shrink-0">
                      {balance?.currency?.charAt(0) || "R"}
                    </div>
                  )}
                  {balance ? (
                    <span className="min-w-[80px] text-left">
                      {Number(balance.amount).toFixed(2)} {balance.currency}
                    </span>
                  ) : (
                    <span className="animate-pulse opacity-50 min-w-[60px] text-left">Syncing...</span>
                  )}
                </div>
              </SelectTrigger>
              <SelectContent className={`min-w-[160px] ${theme === "dark" ? "bg-[#0a0e27] border-white/5 text-white" : "bg-white border-gray-200"}`}>
                {accounts.map((acc) => {
                  const isDemo = acc.type === "Demo" || acc.id.startsWith("VRTC")
                  const isUSD = acc.currency === "USD"
                  return (
                    <SelectItem key={acc.id} value={acc.id} className="cursor-pointer py-2">
                      <div className="flex items-center gap-2">
                        {isDemo ? (
                          <div className="w-5 h-5 rounded-full bg-amber-400 text-black flex items-center justify-center text-[10px] font-black shrink-0">
                            D
                          </div>
                        ) : isUSD ? (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[12px] overflow-hidden shrink-0 bg-blue-50/10">
                            <span className="scale-[1.2] -mt-[1px]">🇺🇸</span>
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                            {acc.currency?.charAt(0) || "R"}
                          </div>
                        )}
                        <div className="flex flex-col text-left">
                          <span className={`text-[9px] leading-tight ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{acc.id}</span>
                          <span className="text-xs font-bold">{acc.balance.toFixed(2)} {acc.currency}</span>
                        </div>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          ) : (
            <div className={`px-4 h-8 sm:h-9 flex items-center rounded-full text-xs font-bold animate-pulse ${theme === "dark" ? "bg-white/5 text-white" : "bg-black/5 text-slate-900"}`}>
              Fetching...
            </div>
          )}

          <Button
            onClick={logout}
            variant="ghost"
            size="icon"
            className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full transition-all ${theme === "dark"
              ? "text-rose-500 hover:text-white hover:bg-rose-500"
              : "text-rose-600 hover:text-white hover:bg-rose-500"
              }`}
            title="Secure Logout"
          >
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      )}
    </>
  )
}
