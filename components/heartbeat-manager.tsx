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

        const sendHeartbeat = async (currentStatus: string = "online") => {
            try {
                // Don't sync if balance is not yet loaded to avoid showing $0 in admin
                if (currentStatus === "online" && (!balance || balance.amount === undefined)) return

                await fetch("/api/user/heartbeat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        loginId: activeLoginId,
                        name: "Deriv User",
                        type: accountType,
                        currency: balance?.currency || "USD",
                        balance: balance?.amount || 0,
                        status: currentStatus
                    }),
                })
            } catch (error) {
                console.error("[Heartbeat] Failed to send heartbeat:", error)
            }
        }

        // Sync immediately on login or account switch
        sendHeartbeat("online")

        // Then sync every 30 seconds (steady pulse)
        if (intervalRef.current) clearInterval(intervalRef.current)
        intervalRef.current = setInterval(() => sendHeartbeat("online"), 30000)

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
            // Send offline status on logout/unmount
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
    }, [isLoggedIn, activeLoginId]) // Only re-run when session identity changes, not on every balance tick

    return null
}
