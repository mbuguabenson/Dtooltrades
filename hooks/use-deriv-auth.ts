"use client"

import { useEffect, useState, useRef } from "react"
import { DerivWebSocketManager } from "@/lib/deriv-websocket-manager"
import { DERIV_CONFIG, DERIV_API } from "@/lib/deriv-config"

interface Balance {
  amount: number
  currency: string
}

interface Account {
  id: string
  type: "Demo" | "Real"
  currency: string
  balance: number
}

export function useDerivAuth() {
  const [token, setToken] = useState<string>("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [balance, setBalance] = useState<Balance | null>(null)
  const [accountType, setAccountType] = useState<"Demo" | "Real" | null>(null)
  const [accountCode, setAccountCode] = useState<string>("")
  const [accounts, setAccounts] = useState<Account[]>([])
  const [activeLoginId, setActiveLoginId] = useState<string | null>(null)
  const activeLoginIdRef = useRef<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [balanceSubscribed, setBalanceSubscribed] = useState(false)
  const balanceSubscribedRef = useRef(false)
  const manager = DerivWebSocketManager.getInstance()

  // 1. Stable listener for auth and balance updates
  useEffect(() => {
    const handleAuthMessages = (data: any) => {
      if (data.msg_type === "authorize") {
        setIsInitializing(false)
        if (data.error) {
          console.error("[v0] ❌ Auth error:", data.error.message)
          if (data.error.code === "InvalidToken" || data.error.code === "AuthorizationRequired") {
            setIsLoggedIn(false)
            setActiveLoginId(null)
            activeLoginIdRef.current = null
            setAccountCode("")
            setToken("")

            // Clear invalid credentials so they aren't retried indefinitely
            localStorage.removeItem("deriv_api_token")
            localStorage.removeItem("deriv_auth_tokens")
            localStorage.removeItem("active_login_id")

            setShowTokenModal(true)
          }
          return
        }

        const { authorize } = data
        const accType = authorize.is_virtual ? "Demo" : "Real"

        console.log("[v0] ✅ Authorized:", authorize.loginid, `(${accType})`)
        setAccountType(accType)
        setActiveLoginId(authorize.loginid)
        activeLoginIdRef.current = authorize.loginid
        setAccountCode(authorize.loginid || "")
        setIsLoggedIn(true)
        setShowTokenModal(false)

        if (authorize.balance !== undefined) {
          const initialBalance = {
            amount: Number(authorize.balance),
            currency: authorize.currency || "USD",
          }
          setBalance(initialBalance)
        }

        if (authorize.account_list && Array.isArray(authorize.account_list)) {
          const formatted = authorize.account_list.map((acc: any) => ({
            id: acc.loginid,
            type: acc.is_virtual ? "Demo" : "Real",
            currency: acc.currency,
            balance: Number(acc.balance) || 0,
          }))
          setAccounts(formatted)
        }

        if (!balanceSubscribedRef.current) {
          manager.send({ balance: 1, subscribe: 1 })
          balanceSubscribedRef.current = true
          setBalanceSubscribed(true)
        }
      }

      if (data.msg_type === "balance" && data.balance) {
        const msgLoginId = data.balance.loginid || activeLoginIdRef.current
        if (msgLoginId === activeLoginIdRef.current) {
          setBalance({
            amount: data.balance.balance,
            currency: data.balance.currency,
          })
        }

        setAccounts(prev => prev.map(acc => {
          if (acc.id === msgLoginId) {
            return { ...acc, balance: data.balance.balance }
          }
          return acc
        }))
      }
    }

    // Handle connection errors/closures to potentially reset initialization if stuck
    const handleStatus = (status: string) => {
      if (status === "disconnected" && !localStorage.getItem("deriv_api_token")) {
        setIsInitializing(false)
      }
    }

    manager.on("authorize", handleAuthMessages)
    manager.on("balance", handleAuthMessages)
    const unbindStatus = manager.onConnectionStatus(handleStatus)

    return () => {
      manager.off("authorize", handleAuthMessages)
      manager.off("balance", handleAuthMessages)
      unbindStatus()
    }
  }, [])

  useEffect(() => {
    activeLoginIdRef.current = activeLoginId
  }, [activeLoginId])

  useEffect(() => {
    if (typeof window === "undefined") return

    const extractTokensFromParams = (searchStr: string): Record<string, string> => {
      const params = new URLSearchParams(searchStr)
      const urlTokens: Record<string, string> = {}
      let primaryToken = ""
      let primaryAcct = ""

      for (let i = 1; i <= 10; i++) {
        const t = params.get(`token${i}`)
        const a = params.get(`acct${i}`)
        if (t && a) {
          urlTokens[a] = t
          if (i === 1) {
            primaryToken = t
            primaryAcct = a
          }
        }
      }
      return primaryToken ? { ...urlTokens, __primary: primaryToken, __primaryAcct: primaryAcct } : {}
    }

    // Try query params first (standard Deriv OAuth redirect)
    let tokenData = extractTokensFromParams(window.location.search)

    // Fallback: try URL hash fragment (some OAuth flows use this)
    if (Object.keys(tokenData).length === 0 && window.location.hash) {
      const hashStr = window.location.hash.replace(/^#/, '')
      tokenData = extractTokensFromParams(hashStr)
    }

    if (Object.keys(tokenData).length > 0) {
      const primaryToken = tokenData.__primary || ""
      const primaryAcct = tokenData.__primaryAcct || ""
      delete tokenData.__primary
      delete tokenData.__primaryAcct

      console.log("[v0] 🔑 OAuth tokens detected in URL:", Object.keys(tokenData).length, "accounts")
      localStorage.setItem("deriv_auth_tokens", JSON.stringify(tokenData))
      localStorage.setItem("deriv_api_token", primaryToken)
      if (primaryAcct) localStorage.setItem("active_login_id", primaryAcct)

      // Clean URL of both query params and hash fragment
      window.history.replaceState({}, document.title, window.location.pathname)

      setToken(primaryToken)
      connectWithToken(primaryToken)
      return
    }

    const storedToken = localStorage.getItem("deriv_api_token")
    if (storedToken && storedToken.length > 10) {
      setToken(storedToken)
      connectWithToken(storedToken)
    } else {
      console.log("[v0] ℹ️ No session found")
      setIsInitializing(false)
    }
  }, [])

  const connectWithToken = async (apiToken: string) => {
    if (!apiToken || apiToken.length < 10) {
      setIsInitializing(false)
      return
    }

    try {
      await manager.connect()
      manager.send({ authorize: apiToken })
    } catch (e) {
      console.error("[v0] Connection error during auth:", e)
      setIsInitializing(false)
    }
  }

  const submitApiToken = (apiToken: string) => {
    if (!apiToken || apiToken.length < 10) {
      alert("Please enter a valid API token")
      return
    }

    setIsInitializing(true)
    localStorage.setItem("deriv_api_token", apiToken)
    setToken(apiToken)
    connectWithToken(apiToken)
  }

  const openTokenSettings = () => {
    setShowTokenModal(true)
  }

  const loginWithDeriv = () => {
    if (typeof window === "undefined") return
    // Use the standard Deriv OAuth URL - no response_type or scope needed
    // Deriv will redirect back with tokens as query params: ?acct1=CR...&token1=...
    const redirectUri = encodeURIComponent(`${window.location.origin}`)
    const oauthUrl = `https://oauth.deriv.com/oauth2/authorize?app_id=123189&redirect_uri=${redirectUri}&l=EN&brand=deriv`
    window.location.href = oauthUrl
  }

  const requestLogin = () => {
    loginWithDeriv()
  }

  const logout = () => {
    if (typeof window === "undefined") return
    manager.send({ forget_all: ["balance", "ticks", "proposal_open_contract"] })
    localStorage.removeItem("deriv_api_token")
    localStorage.removeItem("deriv_auth_tokens")
    localStorage.removeItem("active_login_id")
    setToken("")
    setIsLoggedIn(false)
    setBalance(null)
    setAccounts([])
    setActiveLoginId(null)
    setIsInitializing(false)
    setShowTokenModal(true)
  }

  const switchAccount = (loginId: string) => {
    if (!loginId || typeof window === "undefined") return
    const storedTokens = JSON.parse(localStorage.getItem("deriv_auth_tokens") || "{}")
    const targetToken = storedTokens[loginId] || token

    if (!targetToken) return

    setIsInitializing(true)
    localStorage.setItem("deriv_api_token", targetToken)
    localStorage.setItem("active_login_id", loginId)
    setToken(targetToken)
    balanceSubscribedRef.current = false
    setBalanceSubscribed(false)
    manager.send({ authorize: targetToken })
  }

  return {
    token,
    isLoggedIn,
    isInitializing,
    isAuthenticated: isLoggedIn,
    loginWithDeriv,
    requestLogin,
    showApprovalModal,
    logout,
    balance,
    accountType,
    accountCode,
    accounts,
    switchAccount,
    activeLoginId,
    showTokenModal,
    submitApiToken,
    openTokenSettings,
  }
}
