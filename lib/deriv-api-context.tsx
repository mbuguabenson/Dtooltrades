"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useRef } from "react"
import { DerivAPIClient } from "./deriv-api"
import { DERIV_APP_ID } from "./deriv-config"
import { useDerivAuth } from "@/hooks/use-deriv-auth"

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

interface DerivAPIContextType {
  apiClient: DerivAPIClient | null
  isConnected: boolean
  isAuthorized: boolean
  error: string | null
  connectionStatus: "disconnected" | "connecting" | "connected" | "reconnecting"
  // Auth properties from useDerivAuth
  token: string
  isLoggedIn: boolean
  balance: Balance | null
  accountType: "Demo" | "Real" | null
  accountCode: string
  accounts: Account[]
  activeLoginId: string | null
  logout: () => void
  requestLogin: () => void
  switchAccount: (loginId: string) => void
  submitApiToken: (token: string) => void
  openTokenSettings: () => void
}

const DerivAPIContext = createContext<DerivAPIContextType | null>(null)

let globalAPIClient: DerivAPIClient | null = null

export function DerivAPIProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected" | "reconnecting"
  >("disconnected")
  const clientRef = useRef<DerivAPIClient | null>(null)
  const initAttemptRef = useRef(0)
  const auth = useDerivAuth()
  const { token, isLoggedIn } = auth

  useEffect(() => {
    if (token && isLoggedIn && token.length > 10) {
      if (!globalAPIClient || globalAPIClient.token !== token) {
        console.log("[v0] Initializing/Updating DerivAPIClient with token")

        if (globalAPIClient) {
          globalAPIClient.disconnect()
        }

        globalAPIClient = new DerivAPIClient({ appId: DERIV_APP_ID.toString(), token })
        globalAPIClient.setErrorCallback((err) => {
          const errorMessage = err?.message || (typeof err === 'string' ? err : 'Unknown API Error');
          setError(errorMessage)
        })

        const attemptConnection = async () => {
          try {
            initAttemptRef.current++
            setConnectionStatus("connecting")

            await globalAPIClient!.connect()
            await new Promise(resolve => setTimeout(resolve, 500))
            await globalAPIClient!.authorize(token)

            setIsConnected(true)
            setIsAuthorized(true)
            setConnectionStatus("connected")
            setError(null)
            initAttemptRef.current = 0
          } catch (err: any) {
            console.error("[v0] Connection/Authorization failed:", err)
            setConnectionStatus("reconnecting")

            if (initAttemptRef.current < 10) {
              const delay = Math.min(1000 * Math.pow(1.5, initAttemptRef.current), 15000)
              setTimeout(attemptConnection, delay)
            } else {
              setError("Failed to connect to API after 10 attempts.")
              setConnectionStatus("disconnected")
            }
          }
        }

        attemptConnection()
      }
    }

    clientRef.current = globalAPIClient

    const interval = setInterval(() => {
      if (clientRef.current) {
        const connected = clientRef.current.isConnected()
        const authorized = clientRef.current.isAuth()

        setIsConnected(connected)
        setIsAuthorized(authorized)

        // Auto-reauthorize if connected but lost authorization
        if (connected && !authorized && token && isLoggedIn) {
          console.log("[v0] Auto-reauthorizing due to connection recovery...")
          clientRef.current.authorize(token).catch(err => {
            console.error("[v0] Auto-reauth failed:", err)
          })
        }

        if (connected && authorized && error) {
          setError(null)
          setConnectionStatus("connected")
        }
      }
    }, 2000)

    return () => {
      clearInterval(interval)
    }
  }, [token, isLoggedIn])

  return (
    <DerivAPIContext.Provider
      value={{
        apiClient: clientRef.current,
        isConnected,
        isAuthorized,
        error,
        connectionStatus,
        ...auth,
      }}
    >
      {children}
    </DerivAPIContext.Provider>
  )
}

export function useDerivAPI() {
  const context = useContext(DerivAPIContext)
  if (!context) {
    // Return a dummy context to avoid crashing, but warn
    console.error("useDerivAPI must be used within DerivAPIProvider")
    return {
      apiClient: null,
      isConnected: false,
      isAuthorized: false,
      error: "Context not found",
      connectionStatus: "disconnected",
      token: "",
      isLoggedIn: false,
      balance: null,
      accountType: null,
      accountCode: "",
      accounts: [],
      activeLoginId: null,
      logout: () => { },
      requestLogin: () => { },
      switchAccount: () => { },
      submitApiToken: () => { },
      openTokenSettings: () => { },
    } as DerivAPIContextType
  }
  return context
}
