"use client"

import { useState, useEffect } from "react"
import { useDerivAPI } from "@/lib/deriv-api-context"
import { useDerivAuth } from "@/hooks/use-deriv-auth"
import { DerivWebSocketManager } from "@/lib/deriv-websocket-manager"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart3,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
} from "lucide-react"

interface OpenContract {
  contract_id: number
  status: string
  profit?: number
  bid_price?: number
  current_spot?: string
  entry_price?: number
  buy_price?: number
  contract_type?: string
}

interface DashboardTabProps {
  theme?: "light" | "dark"
}

export function DashboardTab({ theme = "dark" }: DashboardTabProps) {
  const globalContext = useDerivAPI()
  const authContext = useDerivAuth()
  const manager = DerivWebSocketManager.getInstance()

  const [openContracts, setOpenContracts] = useState<OpenContract[]>([])
  const [totalProfit, setTotalProfit] = useState(0)
  const [isOtpConnected, setIsOtpConnected] = useState(false)
  const [connectionLog, setConnectionLog] = useState<string[]>([])
  const [marketData, setMarketData] = useState<Record<string, any>>({})

  const balance = globalContext.balance?.amount || 0
  const currency = globalContext.balance?.currency || "USD"
  const isLoggedIn = globalContext.isLoggedIn
  const isConnected = globalContext.isConnected

  const addLog = (message: string) => {
    console.log(`[v0] ${message}`)
    setConnectionLog((prev) => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${message}`])
  }

  // Handle WebSocket messages for contract updates
  useEffect(() => {
    const handleMessage = (data: any) => {
      // Handle contract updates (live profit/loss)
      if (data.msg_type === "proposal_open_contract") {
        const contract = data.proposal_open_contract
        setOpenContracts((prev) => {
          const existing = prev.find((c) => c.contract_id === contract.contract_id)
          if (existing) {
            return prev.map((c) =>
              c.contract_id === contract.contract_id
                ? {
                    ...c,
                    status: contract.status || c.status,
                    profit: contract.profit,
                    bid_price: contract.bid_price,
                    current_spot: contract.current_spot,
                  }
                : c
            )
          } else {
            return [
              ...prev,
              {
                contract_id: contract.contract_id,
                status: contract.status || "open",
                profit: contract.profit,
                bid_price: contract.bid_price,
                current_spot: contract.current_spot,
                entry_price: contract.entry_spot,
                buy_price: contract.buy_price,
                contract_type: contract.contract_type,
              },
            ]
          }
        })

        if (contract.profit !== undefined) {
          addLog(`📊 Contract ${contract.contract_id}: ${contract.status} | P&L: $${contract.profit?.toFixed(2)}`)
        }
      }

      // Handle ticks for market data
      if (data.msg_type === "tick") {
        const tick = data.tick
        setMarketData((prev) => ({
          ...prev,
          [tick.symbol]: {
            bid: tick.bid,
            ask: tick.ask,
            quote: tick.quote,
            epoch: tick.epoch,
          },
        }))
      }
    }

    manager.on("message", handleMessage)
    return () => manager.off("message", handleMessage)
  }, [manager])

  // Calculate total profit
  useEffect(() => {
    const total = openContracts.reduce((sum, contract) => sum + (contract.profit || 0), 0)
    setTotalProfit(total)
  }, [openContracts])

  // Attempt OAuth2 + OTP connection if logged in
  useEffect(() => {
    if (isLoggedIn && authContext.oauthAccessToken && authContext.accountId && !isOtpConnected) {
      attemptOtpConnection()
    }
  }, [isLoggedIn, authContext.oauthAccessToken, authContext.accountId, isOtpConnected])

  const attemptOtpConnection = async () => {
    try {
      addLog("🔐 Attempting OAuth2 + OTP connection...")
      if (authContext.connectWithOauth && authContext.oauthAccessToken && authContext.accountId) {
        await authContext.connectWithOauth(authContext.oauthAccessToken, authContext.accountId)
        setIsOtpConnected(true)
        addLog("✅ OTP-authenticated WebSocket connected!")
      }
    } catch (error) {
      addLog(`❌ OTP connection failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const requestProposal = () => {
    if (!manager.isConnected) {
      addLog("❌ WebSocket not connected")
      return
    }

    manager.send({
      proposal: 1,
      amount: 10,
      basis: "stake",
      contract_type: "CALL",
      currency: currency,
      duration: 5,
      duration_unit: "t",
      underlying_symbol: "1HZ100V",
      req_id: 1,
    })
    addLog("📨 Proposal request sent")
  }

  const closeContract = (contractId: number) => {
    if (!manager.isConnected) {
      addLog("❌ WebSocket not connected")
      return
    }

    manager.send({
      sell: contractId,
      price: openContracts.find((c) => c.contract_id === contractId)?.bid_price || 0,
    })
    addLog(`📤 Close request sent for contract ${contractId}`)
  }

  return (
    <div className={`space-y-6 p-6 ${theme === "dark" ? "bg-slate-950/50" : "bg-gray-50"}`}>
      {/* Header - Status & Balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Connection Status */}
        <Card
          className={`p-6 border ${
            theme === "dark"
              ? `${isConnected ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`
              : `${isConnected ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-sm font-semibold ${theme === "dark" ? "text-slate-400" : "text-gray-600"}`}>
                API Connection
              </p>
              <p
                className={`text-2xl font-bold mt-2 ${
                  isConnected
                    ? theme === "dark"
                      ? "text-green-400"
                      : "text-green-600"
                    : theme === "dark"
                      ? "text-red-400"
                      : "text-red-600"
                }`}
              >
                {isConnected ? "Connected" : "Disconnected"}
              </p>
            </div>
            {isConnected ? (
              <CheckCircle className={`w-8 h-8 ${theme === "dark" ? "text-green-400" : "text-green-600"}`} />
            ) : (
              <AlertCircle className={`w-8 h-8 ${theme === "dark" ? "text-red-400" : "text-red-600"}`} />
            )}
          </div>
        </Card>

        {/* OTP Status */}
        <Card
          className={`p-6 border ${
            theme === "dark"
              ? `${isOtpConnected ? "bg-blue-500/10 border-blue-500/30" : "bg-slate-500/10 border-slate-500/30"}`
              : `${isOtpConnected ? "bg-blue-50 border-blue-200" : "bg-gray-100 border-gray-300"}`
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-sm font-semibold ${theme === "dark" ? "text-slate-400" : "text-gray-600"}`}>
                OTP WebSocket
              </p>
              <p
                className={`text-2xl font-bold mt-2 ${
                  isOtpConnected
                    ? theme === "dark"
                      ? "text-blue-400"
                      : "text-blue-600"
                    : theme === "dark"
                      ? "text-slate-400"
                      : "text-gray-600"
                }`}
              >
                {isOtpConnected ? "Active" : "Idle"}
              </p>
            </div>
            <Zap className={`w-8 h-8 ${isOtpConnected ? (theme === "dark" ? "text-blue-400" : "text-blue-600") : theme === "dark" ? "text-slate-500" : "text-gray-400"}`} />
          </div>
        </Card>

        {/* Balance */}
        <Card
          className={`p-6 border ${
            theme === "dark"
              ? "bg-cyan-500/10 border-cyan-500/30"
              : "bg-cyan-50 border-cyan-200"
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-sm font-semibold ${theme === "dark" ? "text-slate-400" : "text-gray-600"}`}>
                Total Balance
              </p>
              <p
                className={`text-2xl font-bold mt-2 ${
                  theme === "dark" ? "text-cyan-400" : "text-cyan-600"
                }`}
              >
                {currency} {balance.toFixed(2)}
              </p>
            </div>
            <Wallet className={`w-8 h-8 ${theme === "dark" ? "text-cyan-400" : "text-cyan-600"}`} />
          </div>
        </Card>
      </div>

      {/* Profit & Loss */}
      <Card
        className={`p-6 border ${
          theme === "dark"
            ? `${totalProfit >= 0 ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`
            : `${totalProfit >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`
        }`}
      >
        <div className="flex items-center gap-4">
          {totalProfit >= 0 ? (
            <TrendingUp className={`w-10 h-10 ${theme === "dark" ? "text-green-400" : "text-green-600"}`} />
          ) : (
            <TrendingDown className={`w-10 h-10 ${theme === "dark" ? "text-red-400" : "text-red-600"}`} />
          )}
          <div>
            <p className={`text-sm font-semibold ${theme === "dark" ? "text-slate-400" : "text-gray-600"}`}>
              Total P&L (Open Contracts)
            </p>
            <p
              className={`text-3xl font-bold mt-1 ${
                totalProfit >= 0
                  ? theme === "dark"
                    ? "text-green-400"
                    : "text-green-600"
                  : theme === "dark"
                    ? "text-red-400"
                    : "text-red-600"
              }`}
            >
              {currency} {totalProfit.toFixed(2)}
            </p>
          </div>
        </div>
      </Card>

      {/* Open Contracts */}
      <Card className={`p-6 border ${theme === "dark" ? "bg-slate-900/50 border-slate-800" : "bg-white border-gray-200"}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-bold flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
            <BarChart3 className="w-5 h-5" />
            Open Contracts
          </h3>
          {isOtpConnected && (
            <Button onClick={requestProposal} className="bg-blue-600 hover:bg-blue-700 text-white">
              Request Proposal
            </Button>
          )}
        </div>

        {openContracts.length === 0 ? (
          <p className={`text-center py-8 ${theme === "dark" ? "text-slate-400" : "text-gray-600"}`}>
            No open contracts. Connect and trade to see live updates here.
          </p>
        ) : (
          <div className="space-y-3">
            {openContracts.map((contract) => (
              <div
                key={contract.contract_id}
                className={`p-4 rounded-lg border flex items-center justify-between ${
                  theme === "dark"
                    ? "bg-slate-800/50 border-slate-700"
                    : "bg-gray-50 border-gray-300"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge
                      className={`${
                        contract.status === "open"
                          ? "bg-blue-500/30 text-blue-300"
                          : contract.status === "won"
                            ? "bg-green-500/30 text-green-300"
                            : "bg-red-500/30 text-red-300"
                      }`}
                    >
                      {contract.status.toUpperCase()}
                    </Badge>
                    <p className={`text-sm font-semibold ${theme === "dark" ? "text-cyan-400" : "text-cyan-600"}`}>
                      Contract #{contract.contract_id}
                    </p>
                    <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-gray-600"}`}>
                      {contract.contract_type}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className={`text-xs ${theme === "dark" ? "text-slate-500" : "text-gray-500"}`}>Entry</p>
                      <p className={`font-mono font-semibold ${theme === "dark" ? "text-slate-300" : "text-gray-700"}`}>
                        {contract.entry_price ? `${contract.entry_price.toFixed(4)}` : "---"}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${theme === "dark" ? "text-slate-500" : "text-gray-500"}`}>Current</p>
                      <p className={`font-mono font-semibold ${theme === "dark" ? "text-slate-300" : "text-gray-700"}`}>
                        {contract.current_spot ? `${contract.current_spot.toFixed(4)}` : "---"}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${theme === "dark" ? "text-slate-500" : "text-gray-500"}`}>P&L</p>
                      <p
                        className={`font-mono font-bold ${
                          contract.profit && contract.profit >= 0
                            ? theme === "dark"
                              ? "text-green-400"
                              : "text-green-600"
                            : theme === "dark"
                              ? "text-red-400"
                              : "text-red-600"
                        }`}
                      >
                        ${contract.profit?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                  </div>
                </div>
                {contract.status === "open" && (
                  <Button
                    onClick={() => closeContract(contract.contract_id)}
                    className="ml-4 bg-red-600 hover:bg-red-700 text-white text-sm"
                  >
                    Close
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Connection Log */}
      <Card className={`p-6 border ${theme === "dark" ? "bg-slate-900/50 border-slate-800" : "bg-white border-gray-200"}`}>
        <h3 className={`text-lg font-bold flex items-center gap-2 mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
          <Activity className="w-5 h-5" />
          Connection Log
        </h3>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {connectionLog.length === 0 ? (
            <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-gray-600"}`}>
              Waiting for events...
            </p>
          ) : (
            connectionLog.map((log, idx) => (
              <p
                key={idx}
                className={`text-xs font-mono ${
                  theme === "dark" ? "text-slate-400" : "text-gray-600"
                }`}
              >
                {log}
              </p>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
