"use client"

import { useEffect, useState, useRef } from "react"
import { DerivWebSocketManager } from "@/lib/deriv-websocket-manager"
import { DERIV_CONFIG, DERIV_API, OAUTH_CLIENT_ID } from "@/lib/deriv-config"
import { generateCodeVerifier, generateCodeChallenge, generateState } from "@/lib/pkce"

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
        console.log("[v0] 💰 Balance update received:", data.balance.balance, data.balance.currency, "for", msgLoginId)
        
        if (msgLoginId === activeLoginIdRef.current) {
          setBalance({
            amount: Number(data.balance.balance),
            currency: data.balance.currency,
          })
        }

        setAccounts(prev => prev.map(acc => {
          if (acc.id === msgLoginId) {
            return { ...acc, balance: Number(data.balance.balance) }
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

    const handleOAuthCallback = async (params: URLSearchParams) => {
      const code = params.get('code')
      const returnedState = params.get('state')
      const storedState = sessionStorage.getItem('oauth_state')
      const codeVerifier = sessionStorage.getItem('pkce_code_verifier')

      if (!code || !returnedState || !storedState || !codeVerifier) return

      if (returnedState !== storedState) {
        console.error("[v0] ❌ OAuth State mismatch! CSRF detected or invalid session.")
        return
      }

      setIsInitializing(true)
      console.log("[v0] 🔄 Exchanging OAuth code for token...")

      try {
        const response = await fetch('/api/auth/deriv-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            code_verifier: codeVerifier,
            redirect_uri: window.location.origin
          })
        })

        const data = await response.json()
        if (data.error) throw new Error(data.error)

        const accessToken = data.access_token
        console.log("[v0] 🔑 OAuth 2.0 access token received")

        // Store and authorize
        localStorage.setItem("deriv_api_token", accessToken)
        setToken(accessToken)
        connectWithToken(accessToken)

        // Clear PKCE from session
        sessionStorage.removeItem('pkce_code_verifier')
        sessionStorage.removeItem('oauth_state')

        // Clean URL
        const newUrl = window.location.origin + window.location.pathname
        window.history.replaceState({}, document.title, newUrl)
      } catch (err: any) {
        console.error("[v0] ❌ Token exchange failed:", err.message)
        setIsInitializing(false)
      }
    }

    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.has('code')) {
      handleOAuthCallback(searchParams)
      return
    }

    const extractTokensFromParams = (searchStr: string): Record<string, string> => {
      // Keep legacy extraction for backward compatibility or direct token pass-through
      const cleanedStr = searchStr.replace(/^[?#]/, '')
      if (!cleanedStr) return {}

      const params = new URLSearchParams(cleanedStr)
      const urlTokens: Record<string, string> = {}
      let primaryToken = ""
      let primaryAcct = ""

      for (let i = 1; i <= 20; i++) {
        const t = params.get(`token${i}`)
        const a = params.get(`acct${i}`)
        if (t && a) {
          urlTokens[a] = t
          if (i === 1 || !primaryToken) {
            primaryToken = t
            primaryAcct = a
          }
        }
      }
      return primaryToken ? { ...urlTokens, __primary: primaryToken, __primaryAcct: primaryAcct } : {}
    }

    let tokenData = extractTokensFromParams(window.location.search)

    if (window.location.hash) {
      const hashData = extractTokensFromParams(window.location.hash)
      tokenData = { ...tokenData, ...hashData }
    }

    if (Object.keys(tokenData).length > 0) {
      const primaryToken = tokenData.__primary || ""
      const primaryAcct = tokenData.__primaryAcct || ""
      delete tokenData.__primary
      delete tokenData.__primaryAcct

      console.log("[v0] 🔑 Legacy OAuth tokens detected in URL:", Object.keys(tokenData).length, "accounts")
      localStorage.setItem("deriv_auth_tokens", JSON.stringify(tokenData))
      localStorage.setItem("deriv_api_token", primaryToken)
      if (primaryAcct) localStorage.setItem("active_login_id", primaryAcct)

      const newUrl = window.location.origin + window.location.pathname
      window.history.replaceState({}, document.title, newUrl)

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

  const loginWithDeriv = async () => {
    console.log("[v0] 🔐 Starting OAuth login flow...")
    if (typeof window === "undefined") {
      console.error("[v0] ❌ OAuth: Window object not available (SSR)")
      return
    }
    
    try {
      // Modern OAuth 2.0 PKCE Flow
      const verifier = generateCodeVerifier()
      const challenge = await generateCodeChallenge(verifier)
      const state = generateState()

      console.log("[v0] 🔐 PKCE verifier and challenge generated")
      
      // Store in localStorage for later retrieval in the callback
      localStorage.setItem('pkce_code_verifier', verifier)
      localStorage.setItem('oauth_state', state)

      // Set cookies for the callback handler
      document.cookie = `pkce_code_verifier=${verifier}; path=/; SameSite=Lax`
      document.cookie = `oauth_state=${state}; path=/; SameSite=Lax`

      // Build OAuth redirect URI - must match pre-registered URI in Deriv app
      const redirectUri = `${window.location.origin}/api/auth/oauth-callback`
      const oauthUrl = new URL(DERIV_API.OAUTH)
      
      oauthUrl.searchParams.set('response_type', 'code')
      oauthUrl.searchParams.set('client_id', OAUTH_CLIENT_ID)
      oauthUrl.searchParams.set('redirect_uri', redirectUri)
      oauthUrl.searchParams.set('scope', 'trade')
      oauthUrl.searchParams.set('state', state)
      oauthUrl.searchParams.set('code_challenge', challenge)
      oauthUrl.searchParams.set('code_challenge_method', 'S256')

      console.log("[v0] 🔐 OAuth URL:", oauthUrl.toString())
      console.log("[v0] 🔐 Redirect URI:", redirectUri)
      console.log("[v0] 🔐 Redirecting to OAuth provider...")
      
      window.location.href = oauthUrl.toString()
    } catch (error) {
      console.error("[v0] ❌ OAuth setup error:", error)
    }
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
    activeLoginIdRef.current = null
    setIsInitializing(false)
    balanceSubscribedRef.current = false
    setBalanceSubscribed(false)
    setShowTokenModal(true)
  }

  const switchAccount = (loginId: string) => {
    if (!loginId || typeof window === "undefined") return
    const storedTokens = JSON.parse(localStorage.getItem("deriv_auth_tokens") || "{}")
    const targetToken = storedTokens[loginId] || token

    if (!targetToken) return

    console.log("[v0] 🔄 Switching account to:", loginId)
    setIsInitializing(true)
    localStorage.setItem("deriv_api_token", targetToken)
    localStorage.setItem("active_login_id", loginId)
    setToken(targetToken)
    
    // Reset subscription flags so authorize handler re-subscribes for the NEW account
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
