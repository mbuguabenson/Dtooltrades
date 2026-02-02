export interface DerivAPIConfig {
  appId: string
  token?: string
}

export interface AuthorizeResponse {
  loginid: string
  balance: number
  currency: string
  is_virtual: boolean
  email: string
}

export interface ActiveSymbol {
  symbol: string
  display_name: string
  market: string
  market_display_name: string
}

export interface ContractType {
  contract_type: string
  contract_display: string
  contract_category: string
  contract_category_display: string
  barriers: number
}

export interface ProposalRequest {
  symbol: string
  contract_type: string
  amount: number
  basis: string
  duration: number
  duration_unit: string
  currency: string
  barrier?: string
}

export interface ProposalResponse {
  id: string
  ask_price: number
  payout: number
  spot: number
  spot_time: number
  longcode: string
}

export interface BuyResponse {
  contract_id: number
  buy_price: number
  payout: number
  longcode: string
  start_time: number
  transaction_id: number
}

export interface ContractUpdate {
  contract_id: number
  is_sold: boolean
  profit?: number
  payout?: number
  buy_price: number
  entry_tick?: number
  exit_tick?: number
  entry_spot?: string
  exit_spot?: string
  current_spot?: string
  current_spot_time?: number
  tick_count?: number
  display_name?: string
  status?: string
}

export interface TickData {
  symbol: string
  quote: number
  epoch: number
  id?: string
}

export interface TickHistoryResponse {
  prices: number[]
  times: number[]
}

import { DerivWebSocketManager } from "./deriv-websocket-manager"

export class DerivAPIClient {
  private manager: DerivWebSocketManager
  private reqId = 0 // Still used locally for tracking my own requests
  private pendingRequests = new Map<number, { resolve: (value: any) => void; reject: (reason: any) => void }>()
  private subscriptions = new Map<string, (data: any) => void>()
  private activeSubscriptions = new Map<string, string>()
  private config: DerivAPIConfig
  private isAuthorised = false
  private onErrorCallback?: (error: any) => void

  constructor(config: DerivAPIConfig) {
    this.config = config
    this.manager = DerivWebSocketManager.getInstance()
    this.setupListeners()
  }

  get token() {
    return this.config.token
  }

  async call(request: any): Promise<any> {
    return this.send(request)
  }

  private setupListeners() {
    this.manager.on("*", (data: any) => {
      this.handleMessage(data)
    })
  }

  setErrorCallback(callback: (error: any) => void) {
    this.onErrorCallback = callback
  }

  async connect(): Promise<void> {
    await this.manager.connect()
    if (this.config.token && !this.isAuthorised) {
      await this.authorize(this.config.token)
    }
  }

  private handleMessage(response: any) {
    // Only handle errors if they belong to a request we sent
    if (response.error && response.req_id && this.pendingRequests.has(response.req_id)) {
      if (this.onErrorCallback) {
        this.onErrorCallback(response.error)
      }

      const promise = this.pendingRequests.get(response.req_id)!
      promise.reject(response.error)
      this.pendingRequests.delete(response.req_id)
      return
    }

    // Success response for a pending request
    if (response.req_id && this.pendingRequests.has(response.req_id)) {
      const promise = this.pendingRequests.get(response.req_id)!
      promise.resolve(response)
      this.pendingRequests.delete(response.req_id)
    }

    // Subscription updates (these often don't have req_id after the first message)
    if (response.subscription) {
      const callback = this.subscriptions.get(response.subscription.id)
      if (callback) {
        callback(response)
      }
    }
  }

  private send(request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const req_id = this.manager.getNextReqId()
      this.pendingRequests.set(req_id, { resolve, reject })

      const message = { ...request, req_id }

      try {
        this.manager.send(message)
      } catch (error) {
        console.error("[v0] Error sending message:", error)
        this.pendingRequests.delete(req_id)
        reject(error)
        return
      }

      setTimeout(() => {
        if (this.pendingRequests.has(req_id)) {
          const errorMsg = `Request ${req_id} (${Object.keys(request)[0]}) timed out after 30000ms`;
          console.error(`[v0] ${errorMsg}`);
          this.pendingRequests.get(req_id)!.reject(new Error(errorMsg))
          this.pendingRequests.delete(req_id)
        }
      }, 30000)
    })
  }


  async authorize(token: string): Promise<AuthorizeResponse> {
    this.config.token = token

    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Authorization request timeout after 10 seconds"))
      }, 10000)

      try {
        const response = await this.send({ authorize: token })
        clearTimeout(timeout)
        this.isAuthorised = true
        resolve(response.authorize)
      } catch (error) {
        clearTimeout(timeout)
        reject(error)
      }
    })
  }

  async getActiveSymbols(): Promise<ActiveSymbol[]> {
    const response = await this.send({ active_symbols: "brief", product_type: "basic" })
    return response.active_symbols
  }

  async getContractsFor(symbol: string): Promise<ContractType[]> {
    const response = await this.send({ contracts_for: symbol })
    return response.contracts_for.available
  }

  async getProposal(params: ProposalRequest): Promise<ProposalResponse> {
    const validatedParams = { ...params }

    // For digit contracts, ensure minimum duration and proper symbol
    if (params.contract_type?.includes("DIGIT")) {
      if (params.duration < 5) {
        console.log(`[v0] Adjusting duration from ${params.duration} to 5 for digit contract`)
        validatedParams.duration = 5
      }
      validatedParams.duration_unit = "t" // Force ticks for digit contracts
    }

    // Ensure symbol is a valid continuous index
    if (!validatedParams.symbol || validatedParams.symbol.length === 0) {
      throw new Error("Invalid symbol: Symbol cannot be empty")
    }

    const response = await this.send({
      proposal: 1,
      ...validatedParams,
      basis: validatedParams.basis || "stake",
    })

    if (response.error) {
      console.error("[v0] Proposal error:", response.error)
      throw new Error(response.error.message || "Proposal failed")
    }

    return response.proposal
  }

  async getTickHistory(symbol: string, count = 1000): Promise<TickHistoryResponse> {
    const response = await this.send({
      ticks_history: symbol,
      count: count,
      end: "latest",
      style: "ticks",
    })
    return {
      prices: response.history.prices,
      times: response.history.times,
    }
  }

  async getTick(symbol: string): Promise<TickData> {
    const response = await this.send({ ticks: symbol })
    return response.tick
  }

  async buyContract(proposalId: string, askPrice?: number): Promise<BuyResponse> {
    const buyRequest: any = { buy: proposalId }
    if (askPrice !== undefined && isFinite(askPrice)) {
      buyRequest.price = askPrice
    }
    const response = await this.send(buyRequest)
    return response.buy
  }

  async subscribeBalance(callback: (balance: number, currency: string) => void): Promise<string> {
    const existingSubscription = Array.from(this.subscriptions.keys()).find((key) =>
      key.toLowerCase().includes("balance"),
    )

    if (existingSubscription) {
      console.log("[v0] Already subscribed to balance, reusing existing subscription")
      return existingSubscription
    }

    const response = await this.send({ balance: 1, subscribe: 1 })
    const subscriptionId = response.subscription.id

    this.subscriptions.set(subscriptionId, (data) => {
      if (data.balance) {
        callback(data.balance.balance, data.balance.currency)
      }
    })

    return subscriptionId
  }

  async subscribeProposalOpenContract(
    contractId: number,
    callback: (contract: ContractUpdate) => void,
  ): Promise<string> {
    const response = await this.send({ proposal_open_contract: 1, contract_id: contractId, subscribe: 1 })
    const subscriptionId = response.subscription.id

    this.subscriptions.set(subscriptionId, (data) => {
      if (data.proposal_open_contract) {
        callback(data.proposal_open_contract)
      }
    })

    return subscriptionId
  }

  async subscribeTicks(symbol: string, callback: (tick: TickData) => void): Promise<string> {
    const existingSubscriptionId = this.activeSubscriptions.get(`tick_${symbol}`)
    if (existingSubscriptionId && this.subscriptions.has(existingSubscriptionId)) {
      console.log(`[v0] Reusing existing tick subscription for ${symbol}`)
      return existingSubscriptionId
    }

    try {
      // Delegate to manager for shared subscription handling
      const subscriptionId = await this.manager.subscribeTicks(symbol, callback)

      if (subscriptionId) {
        this.activeSubscriptions.set(`tick_${symbol}`, subscriptionId)
        // We register it locally too so it can be handled by handleMessage if needed, 
        // though the manager now handles the callback.
        this.subscriptions.set(subscriptionId, (data) => {
          if (data.tick) callback(data.tick)
        })
      }

      return subscriptionId
    } catch (error: any) {
      const errorDetail = error?.message || JSON.stringify(error)
      if (errorDetail.includes("already subscribed") || error?.code === "AlreadySubscribed") {
        console.log(`[v0] Already subscribed to ${symbol}, reusing connection`)
        return ""
      }
      console.error(`[v0] Failed to subscribe to ${symbol}:`, errorDetail)
      throw error
    }
  }

  private async clearZombieSubscriptions(symbol: string): Promise<void> {
    try {
      const oldId = this.activeSubscriptions.get(`tick_${symbol}`)
      if (oldId && !this.subscriptions.has(oldId)) {
        this.activeSubscriptions.delete(`tick_${symbol}`)
        console.log(`[v0] Cleared zombie subscription reference for ${symbol}`)
      }
    } catch (error) {
      console.log(`[v0] Error clearing zombie subscriptions:`, error)
    }
  }

  async forget(subscriptionId: string): Promise<void> {
    if (!subscriptionId) return
    try {
      // Use manager's unsubscribe to handle reference counting
      await this.manager.unsubscribe(subscriptionId)
      this.subscriptions.delete(subscriptionId)

      for (const [key, value] of this.activeSubscriptions.entries()) {
        if (value === subscriptionId) {
          this.activeSubscriptions.delete(key)
          console.log(`[v0] Cleaned up subscription reference: ${key}`)
          break
        }
      }
    } catch (error) {
      console.log("[v0] Forget error (ignored):", error)
    }
  }

  async forgetAll(...types: string[]): Promise<void> {
    try {
      const forgetTypes = types.length > 0 ? types : ["balance", "ticks", "proposal_open_contract"]
      await this.send({ forget_all: forgetTypes })

      console.log(`[v0] Forgetting all subscriptions for types: ${forgetTypes.join(", ")}`)

      this.subscriptions.clear()
      this.activeSubscriptions.clear()

      console.log("[v0] All subscriptions cleared")
    } catch (error) {
      console.log("[v0] ForgetAll error (ignored):", error)
    }
  }

  async clearSubscription(type: string): Promise<void> {
    try {
      await this.send({ forget_all: type })
      const keysToDelete: string[] = []
      this.subscriptions.forEach((_, key) => {
        if (key.includes(type)) {
          keysToDelete.push(key)
        }
      })
      keysToDelete.forEach((key) => this.subscriptions.delete(key))

      if (type === "ticks") {
        for (const key of Array.from(this.activeSubscriptions.keys())) {
          if (key.startsWith("tick_")) {
            this.activeSubscriptions.delete(key)
          }
        }
      }
    } catch (error) {
      console.log("[v0] Clear subscription error (ignored):", error)
    }
  }

  disconnect() {
    this.isAuthorised = false
    this.pendingRequests.clear()
    this.subscriptions.clear()
    this.activeSubscriptions.clear()
    console.log("[v0] DerivAPIClient detached from manager")
  }

  isConnected(): boolean {
    return this.manager.isConnected()
  }

  isAuth(): boolean {
    return this.isAuthorised
  }
}
