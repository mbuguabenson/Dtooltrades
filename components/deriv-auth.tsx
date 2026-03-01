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
        <div className="flex items-center space-x-2 sm:space-x-3">
          {accounts.length > 0 ? (
            <Select value={activeLoginId || ""} onValueChange={switchAccount}>
              <SelectTrigger
                className={`flex items-center h-10 sm:h-11 px-3 sm:px-4 rounded-xl border transition-all duration-300 min-w-[160px] shadow-sm ${theme === "dark"
                  ? "bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-slate-700/50 hover:border-blue-500/30 hover:shadow-blue-500/10 text-white"
                  : "bg-white border-gray-200 hover:border-blue-500/30 hover:shadow-blue-500/10 text-slate-900"
                  }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 font-semibold text-xs sm:text-sm">
                  {accountType === "Demo" || accountCode?.startsWith('VRTC') ? (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-400/10 text-amber-500 ring-1 ring-amber-400/30 flex items-center justify-center text-[10px] sm:text-xs font-black shrink-0 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/20 to-transparent"></div>
                      <span className="relative z-10 flex items-center gap-0.5"><span className="opacity-70 text-[9px]">$</span>D</span>
                    </div>
                  ) : balance?.currency === "USD" ? (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs shrink-0 bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/30 font-black relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-400/20 to-transparent"></div>
                      <span className="relative z-10">$</span>
                    </div>
                  ) : balance?.currency === "UST" || balance?.currency === "USDT" ? (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs shrink-0 bg-[#26A17B]/10 text-[#26A17B] ring-1 ring-[#26A17B]/30 font-black relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#26A17B]/20 to-transparent"></div>
                      <span className="relative z-10">₮</span>
                    </div>
                  ) : balance?.currency === "BTC" ? (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs shrink-0 bg-[#F7931A]/10 text-[#F7931A] ring-1 ring-[#F7931A]/30 font-black relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#F7931A]/20 to-transparent"></div>
                      <span className="relative z-10">₿</span>
                    </div>
                  ) : (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/30 flex items-center justify-center text-[10px] sm:text-xs font-black shrink-0 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/20 to-transparent"></div>
                      <span className="relative z-10">{balance?.currency?.charAt(0) || "R"}</span>
                    </div>
                  )}
                  {balance ? (
                    <div className="flex flex-col items-start leading-tight min-w-[80px]">
                      <span className={`text-[9px] sm:text-[10px] font-medium opacity-70 uppercase tracking-wide`}>
                        {accountType === "Demo" || accountCode?.startsWith('VRTC') ? "Demo" : "Real"}
                      </span>
                      <span className="font-bold tracking-tight">
                        {Number(balance.amount).toFixed(2)} <span className="text-[10px] opacity-70 font-medium">{balance.currency}</span>
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-start leading-tight min-w-[80px]">
                      <span className={`text-[9px] sm:text-[10px] font-medium opacity-70 uppercase tracking-wide`}>
                        {accountType || "Loading"}
                      </span>
                      <span className="animate-pulse opacity-50 font-bold tracking-tight text-xs">Syncing...</span>
                    </div>
                  )}
                </div>
              </SelectTrigger>
              <SelectContent className={`min-w-[190px] p-2 rounded-xl shadow-xl border ${theme === "dark" ? "bg-[#0f172a] border-slate-700/50 text-white" : "bg-white border-gray-100"}`}>
                <div className="px-2 pb-2 mb-2 border-b border-gray-500/20 text-[10px] font-bold tracking-wider uppercase opacity-50">Select Account</div>
                {accounts.map((acc) => {
                  const isDemo = acc.type === "Demo" || acc.id.startsWith("VRTC")
                  const isUSD = acc.currency === "USD"
                  const isUSDT = acc.currency === "UST" || acc.currency === "USDT"
                  const isBTC = acc.currency === "BTC"
                  return (
                    <SelectItem key={acc.id} value={acc.id} className={`cursor-pointer mb-1 last:mb-0 rounded-lg py-2.5 transition-colors ${theme === "dark" ? "hover:bg-slate-800/80 focus:bg-slate-800/80" : "hover:bg-slate-50 focus:bg-slate-50"}`}>
                      <div className="flex items-center gap-3">
                        {isDemo ? (
                          <div className="w-8 h-8 rounded-full bg-amber-400/10 text-amber-500 ring-1 ring-amber-400/30 flex items-center justify-center text-[12px] font-black shrink-0 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/20 to-transparent"></div>
                            <span className="relative z-10 flex items-center gap-0.5"><span className="opacity-70 text-[10px]">$</span>D</span>
                          </div>
                        ) : isUSD ? (
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/30 flex items-center justify-center text-[13px] font-black shrink-0 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-400/20 to-transparent"></div>
                            <span className="relative z-10">$</span>
                          </div>
                        ) : isUSDT ? (
                          <div className="w-8 h-8 rounded-full bg-[#26A17B]/10 text-[#26A17B] ring-1 ring-[#26A17B]/30 flex items-center justify-center text-[13px] font-black shrink-0 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-[#26A17B]/20 to-transparent"></div>
                            <span className="relative z-10">₮</span>
                          </div>
                        ) : isBTC ? (
                          <div className="w-8 h-8 rounded-full bg-[#F7931A]/10 text-[#F7931A] ring-1 ring-[#F7931A]/30 flex items-center justify-center text-[13px] font-black shrink-0 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-[#F7931A]/20 to-transparent"></div>
                            <span className="relative z-10">₿</span>
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/30 flex items-center justify-center text-[12px] font-black shrink-0 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/20 to-transparent"></div>
                            <span className="relative z-10">{acc.currency?.charAt(0) || "R"}</span>
                          </div>
                        )}
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-bold tracking-tight">{acc.balance.toFixed(2)} <span className="text-[10px] opacity-70 font-medium">{acc.currency}</span></span>
                          <span className={`text-[10px] font-medium tracking-wide ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{isDemo ? "Demo" : "Real"} • {acc.id}</span>
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
            className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl transition-all duration-300 border shadow-sm ${theme === "dark"
              ? "bg-slate-800/80 border-slate-700/50 text-slate-300 hover:text-white hover:bg-rose-500/90 hover:border-rose-500"
              : "bg-white border-gray-200 text-slate-600 hover:text-white hover:bg-rose-500/90 hover:border-rose-500 hover:shadow-rose-500/20"
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
