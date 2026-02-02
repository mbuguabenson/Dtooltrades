"use client"

import { useEffect, useState, useRef } from "react"
import { DerivWebSocketManager } from "@/lib/deriv-websocket-manager"
import { DERIV_CONFIG } from "@/lib/deriv-config"

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
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [balanceSubscribed, setBalanceSubscribed] = useState(false)
  const balanceSubscribedRef = useRef(false)
  const manager = DerivWebSocketManager.getInstance()

  // 1. Stable listener for auth and balance updates
  useEffect(() => {
    const handleAuthMessages = (data: any) => {
      if (data.msg_type === "authorize") {
        if (data.error) {
          console.error("[v0] ❌ Auth error:", data.error.message)
          if (data.error.code === "InvalidToken") {
            setShowTokenModal(true)
            setIsLoggedIn(false)
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
          console.log("[v0] 💰 Setting initial balance from authorize:", initialBalance)
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
          console.log("[v0] 📡 Requesting balance subscription...")
          manager.send({ balance: 1, subscribe: 1 })
          balanceSubscribedRef.current = true
          setBalanceSubscribed(true)
        }
      }

      if (data.msg_type === "balance" && data.balance) {
        const msgLoginId = data.balance.loginid || activeLoginIdRef.current
        console.log(`[v0] 💰 Balance update received for ${msgLoginId}:`, data.balance.balance)

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

    manager.on("authorize", handleAuthMessages)
    manager.on("balance", handleAuthMessages)

    return () => {
      manager.off("authorize", handleAuthMessages)
      manager.off("balance", handleAuthMessages)
    }
  }, []) // Mount-only registration

  useEffect(() => {
    activeLoginIdRef.current = activeLoginId
  }, [activeLoginId])

  useEffect(() => {
    if (typeof window === "undefined") return

    const urlParams = new URLSearchParams(window.location.search)
    const urlTokens: Record<string, string> = {}
    let primaryToken = ""
    let primaryAcct = ""

    // Extract all tokens from URL (acct1, token1, acct2, token2, etc.)
    for (let i = 1; i <= 10; i++) {
      const t = urlParams.get(`token${i}`)
      const a = urlParams.get(`acct${i}`)
      if (t && a) {
        urlTokens[a] = t
        if (i === 1) {
          primaryToken = t
          primaryAcct = a
        }
      }
    }

    if (Object.keys(urlTokens).length > 0) {
      console.log("[v0] 🔑 OAuth tokens detected in URL:", Object.keys(urlTokens).length)
      localStorage.setItem("deriv_auth_tokens", JSON.stringify(urlTokens))
      localStorage.setItem("deriv_api_token", primaryToken)
      if (primaryAcct) localStorage.setItem("active_login_id", primaryAcct)

      // Clean up URL without refreshing
      const cleanUrl = window.location.pathname
      window.history.replaceState({}, document.title, cleanUrl)

      setToken(primaryToken)
      connectWithToken(primaryToken)
      return
    }

    // 2. Fallback to stored token
    const storedToken = localStorage.getItem("deriv_api_token")
    if (storedToken && storedToken.length > 10) {
      console.log("[v0] ✅ Existing API token found")
      setToken(storedToken)
      connectWithToken(storedToken)
    } else {
      console.log("[v0] ℹ️ No session found, user is guest")
    }
  }, [])

  const connectWithToken = async (apiToken: string) => {
    if (!apiToken || apiToken.length < 10) {
      console.error("[v0] ❌ Invalid API token")
      return
    }

    console.log("[v0] 🔌 Connecting via manager...")
    await manager.connect()

    // Authorization message
    manager.send({ authorize: apiToken })
  }

  const submitApiToken = (apiToken: string) => {
    if (!apiToken || apiToken.length < 10) {
      alert("Please enter a valid API token (at least 10 characters)")
      return
    }

    localStorage.setItem("deriv_api_token", apiToken)
    setToken(apiToken)
    connectWithToken(apiToken)
  }

  const openTokenSettings = () => {
    setShowTokenModal(true)
  }

  const loginWithDeriv = () => {
    if (typeof window === "undefined") return

    const redirectUri = encodeURIComponent(`${window.location.origin}`)
    const oauthUrl = `https://oauth.deriv.com/oauth2/authorize?app_id=${DERIV_CONFIG.APP_ID}&redirect_uri=${redirectUri}`

    console.log("[v0] 🔐 Initiating OAuth login...")
    window.location.href = oauthUrl
  }

  const requestLogin = () => {
    loginWithDeriv()
  }

  const handleApproval = () => {
    loginWithDeriv()
  }

  const cancelApproval = () => {
    setShowApprovalModal(false)
  }

  const logout = () => {
    if (typeof window === "undefined") return

    console.log("[v0] 👋 Logging out...")
    manager.send({ forget_all: ["balance", "ticks", "proposal_open_contract"] })

    localStorage.removeItem("deriv_api_token")
    localStorage.removeItem("deriv_token")
    localStorage.removeItem("deriv_account")
    setToken("")
    setIsLoggedIn(false)
    setBalance(null)
    setAccountType(null)
    setAccountCode("")
    setAccounts([])
    setActiveLoginId(null)
    setShowTokenModal(true)
    setBalanceSubscribed(false)
    console.log("[v0] ✅ Logged out successfully")
  }

  const switchAccount = (loginId: string) => {
    if (!loginId || typeof window === "undefined") return

    // Try to find token for this loginId
    const storedTokens = JSON.parse(localStorage.getItem("deriv_auth_tokens") || "{}")
    const targetToken = storedTokens[loginId] || token // Fallback to current token if specifically mapped token not found

    if (!targetToken) {
      console.error("[v0] ❌ No token found for account:", loginId)
      return
    }

    console.log("[v0] 🔄 Switching to account:", loginId)
    localStorage.setItem("deriv_api_token", targetToken)
    localStorage.setItem("active_login_id", loginId)
    setToken(targetToken)

    // Authorization message ONLY takes the token. loginid is NOT a allowed property.
    manager.send({ authorize: targetToken })
  }

  return {
    token,
    isLoggedIn,
    isAuthenticated: isLoggedIn,
    loginWithDeriv,
    requestLogin,
    showApprovalModal,
    handleApproval,
    cancelApproval,
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
