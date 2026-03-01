"use client"

import { useEffect, useRef } from "react"
import { useDerivAPI } from "@/lib/deriv-api-context"

export function HeartbeatManager() {
    const { activeLoginId, balance, accountType, isLoggedIn, accounts } = useDerivAPI()
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (!isLoggedIn || !activeLoginId) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
            return
        }

        const sendHeartbeat = async () => {
            try {
                const activeAccount = accounts.find(a => a.id === activeLoginId)

                await fetch("/api/user/heartbeat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        loginId: activeLoginId,
                        name: "Deriv User", // Deriv API doesn't always provide name in authorize
                        type: accountType,
                        currency: balance?.currency || "USD",
                        balance: balance?.amount || 0,
                        status: "online"
                    }),
                })
            } catch (error) {
                console.error("[Heartbeat] Failed to send heartbeat:", error)
            }
        }

        // Send immediately on login
        sendHeartbeat()

        // Then every 30 seconds
        intervalRef.current = setInterval(sendHeartbeat, 30000)

        // Send offline status on unmount/logout
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }

            if (activeLoginId) {
                fetch("/api/user/heartbeat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        loginId: activeLoginId,
                        status: "offline"
                    }),
                }).catch(() => { })
            }
        }
    }, [isLoggedIn, activeLoginId, balance, accountType, accounts])

    return null
}
