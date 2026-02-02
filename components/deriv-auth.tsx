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
        <div className="flex items-center space-x-1.5 sm:space-x-3">
          <div
            className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border transition-all ${theme === "dark"
              ? "bg-slate-900/50 border-blue-500/10 shadow-[inner_0_0_10px_rgba(59,130,246,0.05)]"
              : "bg-slate-50 border-slate-200"
              }`}
          >
            {/* Account Info Badge */}
            <div className="flex flex-col">
              <span className={`text-[7px] sm:text-[8px] font-black uppercase tracking-wider ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>
                Identity
              </span>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <Badge className={`h-3.5 sm:h-4 px-0.5 sm:px-1 text-[8px] sm:text-[9px] font-bold ${accountType === "Real" ? "bg-emerald-500 text-black" : "bg-yellow-500 text-black"
                  }`}>
                  {accountType === "Real" ? "R" : "D"}
                </Badge>
                <span className={`text-[10px] sm:text-xs font-black tabular-nums ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                  {accountCode}
                </span>
              </div>
            </div>

            <div className={`w-px h-5 sm:h-6 ${theme === "dark" ? "bg-slate-800" : "bg-slate-200"}`} />

            {/* Balance Badge */}
            <div className="flex flex-col min-w-[80px]">
              <span className={`text-[7px] sm:text-[8px] font-black uppercase tracking-wider ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>
                Capital
              </span>
              {balance ? (
                <span className={`text-[10px] sm:text-xs font-black tabular-nums ${theme === "dark" ? "text-emerald-400" : "text-emerald-600"}`}>
                  {Number(balance.amount).toFixed(2)} <span className="hidden xs:inline">{balance.currency}</span>
                </span>
              ) : (
                <span className={`text-[10px] sm:text-xs font-bold animate-pulse ${theme === "dark" ? "text-slate-600" : "text-slate-400"}`}>
                  Syncing...
                </span>
              )}
            </div>

            {accounts.length > 1 && (
              <Select value={activeLoginId || ""} onValueChange={switchAccount}>
                <SelectTrigger
                  className={`w-32 sm:w-40 h-7 sm:h-8 text-[9px] sm:text-[10px] font-bold rounded-lg ${theme === "dark" ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}
                >
                  <SelectValue placeholder="Switch" />
                </SelectTrigger>
                <SelectContent className={theme === "dark" ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200"}>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id} className="text-[9px] sm:text-[10px] font-bold">
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1">
                          {acc.id}
                          <Badge className={`h-3 px-1 text-[8px] ${acc.type === "Real" ? "bg-emerald-500 text-black" : "bg-yellow-500 text-black"}`}>
                            {acc.type}
                          </Badge>
                        </span>
                        <span className={`text-[8px] sm:text-[9px] ${theme === "dark" ? "text-emerald-400" : "text-emerald-600"}`}>
                          {acc.balance.toFixed(2)} {acc.currency}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <Avatar
            className="cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all w-8 h-8 sm:w-10 sm:h-10 border-2 border-slate-800"
            onClick={openDerivAccount}
            title="Deriv Account Settings"
          >
            <AvatarImage
              src={`https://ui-avatars.com/api/?name=${activeLoginId || "User"}&background=3b82f6&color=fff&bold=true`}
            />
            <AvatarFallback className="bg-slate-800">
              <User className="text-blue-400" size={14} />
            </AvatarFallback>
          </Avatar>

          <Button
            onClick={logout}
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
            title="Secure Logout"
          >
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      )}
    </>
  )
}
