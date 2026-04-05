/**
 * Example Trading Component using OAuth2 + OTP -> WebSocket Flow
 * 
 * This component demonstrates the complete new flow:
 * 1. Get OAuth access token
 * 2. Exchange for OTP WebSocket URL
 * 3. Connect to trading WebSocket
 * 4. Send trading requests (proposal, buy, contract updates)
 * 
 * Reference: https://developers.deriv.com/docs/
 */

"use client"

import { useState, useEffect } from "react"
import { useDerivAuth } from "@/hooks/use-deriv-auth"
import { DerivWebSocketManager } from "@/lib/deriv-websocket-manager"
import { ProposalMsg, BuyMsg, ProposalOpenContractMsg } from "@/lib/deriv-otp-types"

interface OpenContract {
  contract_id: number
  status: string
  profit?: number
  bid_price?: number
  current_spot?: string
}

export function TradingExampleOAuth2() {
  const auth = useDerivAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [openContracts, setOpenContracts] = useState<OpenContract[]>([])
  const [lastProposal, setLastProposal] = useState<any>(null)
  const [tradingLog, setTradingLog] = useState<string[]>([])
  const manager = DerivWebSocketManager.getInstance()

  const addLog = (message: string) => {
    console.log(`[v0] ${message}`)
    setTradingLog(prev => [...prev.slice(-20), `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    const handleMessage = (data: any) => {
      // Handle proposal responses
      if (data.msg_type === 'proposal') {
        const proposal = data as ProposalMsg
        if (!proposal.error) {
          setLastProposal(proposal.proposal)
          addLog(`📊 Proposal: ID=${proposal.proposal.id}, Price=$${proposal.proposal.ask_price}, Payout=$${proposal.proposal.payout}`)
        } else {
          addLog(`❌ Proposal error: ${proposal.error?.message}`)
        }
      }

      // Handle buy confirmations
      if (data.msg_type === 'buy') {
        const buy = data as BuyMsg
        if (!buy.error) {
          addLog(`✅ Contract bought: ID=${buy.buy.contract_id}, Price=$${buy.buy.buy_price}`)
          // Subscribe to contract updates
          manager.send({
            proposal_open_contract: 1,
            contract_id: buy.buy.contract_id,
            subscribe: 1
          })
        } else {
          addLog(`❌ Buy error: ${buy.error?.message}`)
        }
      }

      // Handle contract updates (live profit/loss)
      if (data.msg_type === 'proposal_open_contract') {
        const poc = data as ProposalOpenContractMsg
        const contract = poc.proposal_open_contract
        
        setOpenContracts(prev => {
          const existing = prev.find(c => c.contract_id === contract.contract_id)
          if (existing) {
            return prev.map(c =>
              c.contract_id === contract.contract_id
                ? {
                    ...c,
                    status: contract.status || c.status,
                    profit: contract.profit,
                    bid_price: contract.bid_price,
                    current_spot: contract.current_spot
                  }
                : c
            )
          } else {
            return [...prev, {
              contract_id: contract.contract_id,
              status: contract.status || 'open',
              profit: contract.profit,
              bid_price: contract.bid_price,
              current_spot: contract.current_spot
            }]
          }
        })

        if (contract.profit !== undefined) {
          addLog(`💹 P&L Update: Contract ${contract.contract_id}, Profit: $${contract.profit.toFixed(2)}, Bid: $${contract.bid_price?.toFixed(2)}`)
        }
      }
    }

    manager.on('message', handleMessage)
    return () => manager.off('message', handleMessage)
  }, [manager])

  const handleConnectOAuth = async () => {
    if (!auth.oauthAccessToken || !auth.accountId) {
      alert("Please complete OAuth login first and provide account ID")
      return
    }

    try {
      addLog("🔐 Connecting via OAuth2 + OTP...")
      await auth.connectWithOauth(auth.oauthAccessToken, auth.accountId)
      setIsConnected(true)
      addLog("✅ Connected via OAuth2 + OTP!")
    } catch (error) {
      addLog(`❌ Connection failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleGetProposal = () => {
    if (!isConnected) {
      alert("Not connected. Connect via OAuth first.")
      return
    }

    manager.send({
      proposal: 1,
      amount: 10,
      basis: 'stake',
      contract_type: 'CALL',
      currency: 'USD',
      duration: 5,
      duration_unit: 't',
      underlying_symbol: '1HZ100V',
      req_id: manager.getNextReqId()
    })

    addLog("📤 Proposal request sent for 1HZ100V CALL")
  }

  const handleBuyProposal = () => {
    if (!lastProposal) {
      alert("No proposal available. Get a proposal first.")
      return
    }

    manager.send({
      buy: lastProposal.id,
      price: lastProposal.ask_price,
      req_id: manager.getNextReqId()
    })

    addLog(`📤 Buy request sent for proposal ${lastProposal.id}`)
  }

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg space-y-4">
      <h2 className="text-2xl font-bold">OAuth2 + OTP Trading Example</h2>

      {/* Status */}
      <div className="p-4 bg-gray-800 rounded">
        <div className="text-sm">
          <p>OAuth Access Token: {auth.oauthAccessToken ? '✅ Set' : '❌ Not Set'}</p>
          <p>Account ID: {auth.accountId ? `✅ ${auth.accountId}` : '❌ Not Set'}</p>
          <p>Connection: {isConnected ? '✅ Connected' : '❌ Disconnected'}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleConnectOAuth}
          disabled={!auth.oauthAccessToken}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded"
        >
          Connect via OAuth2 + OTP
        </button>
        <button
          onClick={handleGetProposal}
          disabled={!isConnected}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded"
        >
          Get Proposal
        </button>
        <button
          onClick={handleBuyProposal}
          disabled={!isConnected || !lastProposal}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 rounded"
        >
          Buy Proposal
        </button>
      </div>

      {/* Open Contracts */}
      {openContracts.length > 0 && (
        <div className="p-4 bg-gray-800 rounded">
          <h3 className="text-lg font-semibold mb-2">Open Contracts</h3>
          <div className="space-y-2 text-sm">
            {openContracts.map(contract => (
              <div key={contract.contract_id} className="flex justify-between p-2 bg-gray-700 rounded">
                <span>Contract {contract.contract_id}</span>
                <span className={contract.profit && contract.profit > 0 ? "text-green-400" : "text-red-400"}>
                  P&L: ${contract.profit?.toFixed(2) || '0.00'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trading Log */}
      <div className="p-4 bg-gray-800 rounded max-h-64 overflow-y-auto">
        <h3 className="text-lg font-semibold mb-2">Log</h3>
        <div className="space-y-1 font-mono text-xs text-gray-300">
          {tradingLog.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 bg-blue-900 rounded text-sm">
        <p className="font-semibold mb-2">How to use:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Complete OAuth login first</li>
          <li>Provide your Options Account ID</li>
          <li>Click "Connect via OAuth2 + OTP" to establish WebSocket connection</li>
          <li>Get a proposal and buy contracts</li>
          <li>Watch live P&L updates</li>
        </ol>
      </div>
    </div>
  )
}
