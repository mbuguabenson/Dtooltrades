"use client"

type MessageHandler = (message: any) => void

interface TickData {
  quote: number
  lastDigit: number
  epoch: number
  symbol: string
  id?: string
  pip_size?: number
}

interface ConnectionLog {
  type: "info" | "error" | "warning"
  message: string
  timestamp: Date
}

import { DERIV_CONFIG, DERIV_API } from "./deriv-config"
import { extractLastDigit, calculateDecimalCount } from "./digit-utils"

/**
 * Unified Deriv WebSocket Manager — backed by the official @deriv/deriv-api DerivAPIBasic.
 * All public methods are unchanged so every tab, hook, and bot continues to work.
 */
export class DerivWebSocketManager {
  private static instance: DerivWebSocketManager | null = null

  // Raw WebSocket (passed into DerivAPIBasic)
  private ws: WebSocket | null = null
  // Official Deriv API wrapper
  private api: any | null = null

  private messageHandlers: Map<string, MessageHandler[]> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectDelay = 2000
  private heartbeatInterval: NodeJS.Timeout | null = null
  private lastMessageTime = Date.now()
  private messageQueue: any[] = []
  private subscriptions: Map<string, string> = new Map()
  private subscriptionRefCount: Map<string, number> = new Map()
  private connectionPromise: Promise<void> | null = null
  private reqIdCounter = 1000

  private symbolsCache: any[] | null = null
  private symbolsPromise: Promise<any[]> | null = null
  private pipSizeMap: Map<string, number> = new Map()
  private pendingRequests: Map<number, (data: any) => void> = new Map()
  private symbolToSubscriptionMap: Map<string, string> = new Map()
  private activeSubscriptions: Set<string> = new Set()
  private tickCallbacks: Map<string, Set<(tick: TickData) => void>> = new Map()
  private connectionLogs: ConnectionLog[] = []
  private readonly maxLogs = 100
  private connectionStatusListeners: Set<(status: "connected" | "disconnected" | "reconnecting") => void> = new Set()

  public isAuthorized = false

  private readonly appId = DERIV_CONFIG.APP_ID
  private currentWsUrl: string = `${DERIV_API.WEBSOCKET}?app_id=${DERIV_CONFIG.APP_ID}&l=en&brand=deriv`

  private constructor() { }

  public static getInstance(): DerivWebSocketManager {
    if (!DerivWebSocketManager.instance) {
      DerivWebSocketManager.instance = new DerivWebSocketManager()
    }
    return DerivWebSocketManager.instance
  }

  public getNextReqId(): number {
    return ++this.reqIdCounter
  }

  // ─── Connection ────────────────────────────────────────────────────────────

  public async connect(url?: string, force = false): Promise<void> {
    const targetUrl = url || this.currentWsUrl

    if (!force && this.ws) {
      const state = this.ws.readyState
      if ((state === WebSocket.OPEN || state === WebSocket.CONNECTING) && this.ws.url === targetUrl) {
        if (state === WebSocket.OPEN) {
          this.log("info", "Already connected")
          return Promise.resolve()
        }
        if (this.connectionPromise) return this.connectionPromise
      }
      if (this.ws.url !== targetUrl) {
        this.ws.close()
      }
    }

    this.currentWsUrl = targetUrl
    if (this.connectionPromise) return this.connectionPromise

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        console.log("[v0] Connecting via DerivAPIBasic:", this.currentWsUrl)
        this.log("info", `Connecting to ${this.currentWsUrl}`)
        this.notifyConnectionStatus("reconnecting")

        // Create raw WebSocket
        this.ws = new WebSocket(this.currentWsUrl)

        // Wrap with DerivAPIBasic (the bundle uses CommonJS exports)
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const DerivAPIBasic = require('@deriv/deriv-api/dist/DerivAPIBasic')
        const API = DerivAPIBasic?.default ?? DerivAPIBasic
        this.api = new API({ connection: this.ws })

        const connectionTimeout = setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            this.log("error", "Connection timeout after 10 seconds")
            this.ws?.close()
            this.connectionPromise = null
            this.notifyConnectionStatus("disconnected")
            reject(new Error("Connection timeout"))
          }
        }, 10000)

        // Use addEventListener to avoid overwriting DerivAPIBasic's internal .onopen/.onclose handlers
        this.ws.addEventListener('open', () => {
          clearTimeout(connectionTimeout)
          console.log("[v0] DerivAPIBasic WebSocket connected")
          this.log("info", "Connected via DerivAPIBasic")
          this.reconnectAttempts = 0
          this.lastMessageTime = Date.now()
          this.notifyConnectionStatus("connected")
          this.startHeartbeat()
          this.processMessageQueue()
          this.connectionPromise = null
          this.tryAutoAuthorize()
          resolve()
        })

        // Route all messages through our existing routeMessage handler
        this.api.onMessage().subscribe(({ data }: { data: any }) => {
          try {
            this.lastMessageTime = Date.now()
            this.routeMessage(data)
          } catch (err) {
            console.error("[v0] Message routing error:", err)
          }
        })

        this.ws.addEventListener('error', (error) => {
          clearTimeout(connectionTimeout)
          console.error("[v0] WebSocket error:", error)
          this.log("error", `WebSocket error: ${error}`)
          this.connectionPromise = null
          this.notifyConnectionStatus("disconnected")
          this.rejectAllPendingRequests(new Error("WebSocket error occurred"))
          reject(error)
        })

        this.ws.addEventListener('close', () => {
          clearTimeout(connectionTimeout)
          console.log("[v0] WebSocket closed, reconnecting…")
          this.log("warning", "WebSocket closed, reconnecting…")
          if (this.connectionPromise) {
            reject(new Error("WebSocket closed during connection attempt"))
          }
          this.connectionPromise = null
          this.stopHeartbeat()
          this.notifyConnectionStatus("disconnected")
          this.rejectAllPendingRequests(new Error("WebSocket connection closed"))
          this.handleReconnect()
        })
      } catch (error) {
        console.error("[v0] Connection setup error:", error)
        this.log("error", `Connection setup error: ${error}`)
        this.connectionPromise = null
        this.notifyConnectionStatus("disconnected")
        this.rejectAllPendingRequests(error instanceof Error ? error : new Error(String(error)))
        reject(error)
      }
    })

    return this.connectionPromise
  }

  // ─── Authorization ─────────────────────────────────────────────────────────

  /**
   * Called by deriv-api-context after OAuth login to authorize the shared connection.
   */
  public async authorize(token: string): Promise<void> {
    if (!this.api || !token) return
    try {
      const res = await this.api.send({ authorize: token })
      if (res?.error) {
        console.error("[v0] Authorization failed:", res.error)
        this.isAuthorized = false
      } else {
        console.log("[v0] Authorized:", res?.authorize?.loginid)
        this.isAuthorized = true
      }
    } catch (e) {
      console.error("[v0] authorize() error:", e)
    }
  }

  private tryAutoAuthorize() {
    try {
      const token =
        localStorage.getItem('authToken') ||
        localStorage.getItem('clientToken') ||
        localStorage.getItem('deriv_auth_token')
      if (token && token !== 'null' && token.length > 10) {
        this.authorize(token)
      }
    } catch { /* SSR safety */ }
  }

  // ─── Heartbeat & reconnect ─────────────────────────────────────────────────

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.log("error", "Max reconnection attempts reached, resetting counter")
      setTimeout(() => {
        this.reconnectAttempts = 0
        this.handleReconnect()
      }, 60000)
      return
    }
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1)
    this.log("info", `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
    setTimeout(() => {
      this.connect().catch((err) => this.log("error", `Reconnection failed: ${err}`))
    }, delay)
  }

  private startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatInterval = setInterval(() => {
      const timeSinceLastMessage = Date.now() - this.lastMessageTime
      if (timeSinceLastMessage > 60000) {
        this.log("warning", "No messages for 60s, reconnecting")
        this.ws?.close()
        return
      }
      if (this.ws?.readyState === WebSocket.OPEN) {
        try {
          this.send({ ping: 1, req_id: this.getNextReqId() })
        } catch (err) {
          this.log("error", `Heartbeat ping failed: ${err}`)
        }
      }
    }, 30000)
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private processMessageQueue() {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      this.send(this.messageQueue.shift())
    }
  }

  // ─── Send ──────────────────────────────────────────────────────────────────

  public send(message: any): void {
    if (this.api && this.ws?.readyState === WebSocket.OPEN) {
      // DerivAPIBasic.send() returns a Promise — suppress unhandled rejection for fire-and-forget
      this.api.send(message).catch(() => { })
    } else if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      this.messageQueue.push(message)
    }
  }

  /**
   * Send a message and await the response via DerivAPIBasic's native Promise API.
   */
  public async sendAndWait(message: any, timeoutMs = 30000): Promise<any> {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      await this.connect()
    }

    // Always use our battle-tested custom req_id tracking 
    // because DerivAPIBasic's internal promise map can sometimes silently drop resolving
    const req_id = message.req_id || this.getNextReqId()
    const payload = { ...message, req_id }
    
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        this.pendingRequests.delete(req_id)
        reject(new Error(`Request ${req_id} timed out after ${timeoutMs}ms`))
      }, timeoutMs)
      
      this.pendingRequests.set(req_id, (data) => {
        clearTimeout(t)
        data.error ? reject(data.error) : resolve(data)
      })
      
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(payload))
      } else {
        this.messageQueue.push(payload)
      }
    })
  }

  // ─── Message routing ───────────────────────────────────────────────────────

  private routeMessage(message: any) {
    try {
      if (message.msg_type === "ping" || message.echo_req?.ping) return

      // Resolve pending req_id-based requests (fallback path)
      if (message.req_id) {
        const req_id = Number(message.req_id)
        const callback = this.pendingRequests.get(req_id)

        // Track subscription IDs
        if (message.subscription && !message.error) {
          const symbol = message.echo_req?.ticks || message.echo_req?.active_symbols
          if (symbol && typeof symbol === 'string') {
            const subId = message.subscription.id
            const existing = this.symbolToSubscriptionMap.get(symbol)
            if (existing && existing !== subId) {
              this.send({ forget: subId, req_id: this.getNextReqId() })
            } else {
              this.subscriptions.set(subId, symbol)
              this.symbolToSubscriptionMap.set(symbol, subId)
              if (!this.subscriptionRefCount.has(subId)) this.subscriptionRefCount.set(subId, 1)
            }
          }
        }

        if (callback) {
          this.pendingRequests.delete(req_id)
          callback(message)
        }
      }

      // Tick handling
      if (message.tick) {
        const symbol = message.tick.underlying_symbol || message.tick.symbol
        if (message.subscription?.id) {
          const subId = message.subscription.id
          const existing = this.symbolToSubscriptionMap.get(symbol)
          if (!existing) {
            this.subscriptions.set(subId, symbol)
            this.symbolToSubscriptionMap.set(symbol, subId)
            if (!this.subscriptionRefCount.has(subId)) this.subscriptionRefCount.set(subId, 1)
          } else if (existing !== subId) {
            this.send({ forget: subId, req_id: this.getNextReqId() })
          }
        }
        const callbacks = this.tickCallbacks.get(symbol)
        if (callbacks) {
          const rawPip = message.tick.pip_size !== undefined ? Number(message.tick.pip_size) : undefined
          if (rawPip !== undefined) this.pipSizeMap.set(symbol, rawPip)
          const pipSize = rawPip ?? this.getPipSize(symbol)
          const tickData: TickData = {
            quote: message.tick.quote,
            lastDigit: this.extractLastDigit(message.tick.quote, pipSize),
            epoch: message.tick.epoch,
            symbol,
            id: message.subscription?.id,
            pip_size: pipSize,
          }
          callbacks.forEach(cb => cb(tickData))
        }
      }

      // Route by msg_type
      if (message.msg_type) {
        ;(this.messageHandlers.get(message.msg_type) || []).forEach(h => h(message))
      }

      // Legacy msg_type-less messages
      if (!message.msg_type) {
        if (message.proposal) (this.messageHandlers.get('proposal') || []).forEach(h => h(message))
        if (message.buy) (this.messageHandlers.get('buy') || []).forEach(h => h(message))
      }

      if (message.error) (this.messageHandlers.get("error") || []).forEach(h => h(message))
      ;(this.messageHandlers.get("*") || []).forEach(h => h(message))
    } catch (error) {
      console.error("[v0] Error routing message:", error)
    }
  }

  // ─── Message handler registration ─────────────────────────────────────────

  public on(event: string, handler: MessageHandler) {
    if (!this.messageHandlers.has(event)) this.messageHandlers.set(event, [])
    this.messageHandlers.get(event)!.push(handler)
  }

  public off(event: string, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(event)
    if (handlers) {
      const i = handlers.indexOf(handler)
      if (i > -1) handlers.splice(i, 1)
    }
  }

  // ─── Tick subscriptions ────────────────────────────────────────────────────

  public async subscribeTicks(symbol: string, callback: (tick: TickData) => void): Promise<string> {
    if (!symbol) {
      console.warn("[v0] subscribeTicks: Symbol is empty, skipping")
      return ""
    }
    if (!this.tickCallbacks.has(symbol)) this.tickCallbacks.set(symbol, new Set())
    this.tickCallbacks.get(symbol)!.add(callback)

    const existingId = this.symbolToSubscriptionMap.get(symbol)
    if (existingId) {
      const ref = this.subscriptionRefCount.get(existingId) || 0
      this.subscriptionRefCount.set(existingId, ref + 1)
      return existingId
    }

    if (this.activeSubscriptions.has(symbol)) {
      return new Promise((resolve) => {
        const check = setInterval(() => {
          const id = this.symbolToSubscriptionMap.get(symbol)
          if (id) {
            clearInterval(check)
            const ref = this.subscriptionRefCount.get(id) || 0
            this.subscriptionRefCount.set(id, ref + 1)
            resolve(id)
          }
        }, 200)
        setTimeout(() => { clearInterval(check); resolve("") }, 15000)
      })
    }

    this.activeSubscriptions.add(symbol)

    let lastError: any = null
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[v0] Subscribing to ${symbol} (attempt ${attempt})`)
        const response = await this.sendAndWait({ ticks: symbol, subscribe: 1 }, 30000)

        if (response.subscription?.id) {
          const subscriptionId = response.subscription.id
          const existing = this.symbolToSubscriptionMap.get(symbol)
          if (existing && existing !== subscriptionId) {
            this.send({ forget: subscriptionId, req_id: this.getNextReqId() })
            const ref = this.subscriptionRefCount.get(existing) || 0
            this.subscriptionRefCount.set(existing, ref + 1)
            this.activeSubscriptions.delete(symbol)
            return existing
          }
          this.subscriptions.set(subscriptionId, symbol)
          this.symbolToSubscriptionMap.set(symbol, subscriptionId)
          this.subscriptionRefCount.set(subscriptionId, 1)
          this.activeSubscriptions.delete(symbol)
          const pipSize = this.getPipSize(symbol)
          callback({
            quote: response.tick.quote,
            lastDigit: this.extractLastDigit(response.tick.quote, pipSize),
            epoch: response.tick.epoch,
            symbol,
            id: subscriptionId,
            pip_size: pipSize,
          })
          return subscriptionId
        }
        throw new Error(response.error?.message || "Invalid subscription response")
      } catch (error: any) {
        lastError = error
        if (error.code === 'AlreadySubscribed') {
          await new Promise(r => setTimeout(r, 1000))
          const recoveredId = this.symbolToSubscriptionMap.get(symbol)
          if (recoveredId) {
            const ref = this.subscriptionRefCount.get(recoveredId) || 0
            this.subscriptionRefCount.set(recoveredId, ref + 1)
            this.activeSubscriptions.delete(symbol)
            return recoveredId
          }
        }
        if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt))
      }
    }

    this.activeSubscriptions.delete(symbol)
    console.error(`[v0] Failed to subscribe to ${symbol}:`, lastError)
    return ""
  }

  public async unsubscribe(subscriptionId: string, callback?: (tick: TickData) => void) {
    if (!subscriptionId) return
    const symbol = this.subscriptions.get(subscriptionId)
    if (symbol && callback) {
      const cbs = this.tickCallbacks.get(symbol)
      if (cbs) {
        cbs.delete(callback)
        if (cbs.size === 0) this.tickCallbacks.delete(symbol)
      }
    }
    const ref = this.subscriptionRefCount.get(subscriptionId) || 1
    if (ref > 1) {
      this.subscriptionRefCount.set(subscriptionId, ref - 1)
      return
    }
    if (symbol) {
      this.symbolToSubscriptionMap.delete(symbol)
      this.tickCallbacks.delete(symbol)
    }
    try {
      this.send({ forget: subscriptionId, req_id: this.getNextReqId() })
      this.subscriptions.delete(subscriptionId)
      this.subscriptionRefCount.delete(subscriptionId)
    } catch (error) {
      console.error("[v0] Unsubscribe error:", error)
    }
  }

  public async unsubscribeAll() {
    this.send({ forget_all: ["ticks"], req_id: this.getNextReqId() })
    this.subscriptions.clear()
    this.subscriptionRefCount.clear()
    this.symbolToSubscriptionMap.clear()
    this.tickCallbacks.clear()
    this.log("info", "Unsubscribed from all ticks")
  }

  // ─── History ───────────────────────────────────────────────────────────────

  /**
   * Fetch historical ticks for a symbol.
   */
  public async getTicksHistory(symbol: string, count = 1000): Promise<TickData[]> {
    try {
      this.log("info", `Fetching ${count} historical ticks for ${symbol}`)
      const response = await this.sendAndWait({
        ticks_history: symbol,
        adjust_start_time: 1,
        count,
        end: 'latest',
        style: 'ticks'
      })

      if (response.history) {
        const { prices, times } = response.history
        const pipSize = this.getPipSize(symbol)
        
        return prices.map((price: number, i: number) => ({
          quote: price,
          lastDigit: this.extractLastDigit(price, pipSize),
          epoch: times[i],
          symbol,
          pip_size: pipSize
        }))
      }
      return []
    } catch (error) {
      console.error("[v0] getTicksHistory error:", error)
      return []
    }
  }

  // ─── Active symbols ────────────────────────────────────────────────────────

  public async getActiveSymbols(): Promise<Array<{ symbol: string; display_name: string; market?: string; market_display_name?: string }>> {
    if (this.symbolsCache) return this.symbolsCache
    if (this.symbolsPromise) return this.symbolsPromise

    this.symbolsPromise = (async () => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await this.sendAndWait({ active_symbols: "brief" }, 15000)
          if (response?.active_symbols) {
            this.symbolsCache = response.active_symbols.map((s: any) => {
              const symbol = s.underlying_symbol || s.symbol
              const display_name = s.underlying_symbol_name || s.display_name
              const decimalCount = s.pip_size !== undefined ? s.pip_size : (s.pip ? this.getDecimalCount(s.pip) : 2)
              this.pipSizeMap.set(symbol, decimalCount)
              return { symbol, display_name, market: s.market, market_display_name: s.market_display_name, pip_size: decimalCount }
            })
            console.log(`[v0] Loaded ${this.symbolsCache?.length} symbols`)
            return this.symbolsCache!
          }
          throw new Error("Invalid symbols response")
        } catch (error) {
          console.error(`[v0] getActiveSymbols attempt ${attempt} failed:`, error)
          if (attempt === 3) { this.symbolsCache = []; return this.symbolsCache }
          await new Promise(r => setTimeout(r, 2000 * attempt))
        }
      }
      return []
    })()

    return this.symbolsPromise.finally(() => { this.symbolsPromise = null })
  }

  // ─── Utilities ─────────────────────────────────────────────────────────────

  public getPipSize(symbol: string): number {
    return this.pipSizeMap.get(symbol) || 2
  }

  public extractLastDigit(quote: number, pipSize: number): number {
    return extractLastDigit(quote, pipSize)
  }

  public getDecimalCount(pip: number): number {
    return calculateDecimalCount(pip)
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  public disconnect() {
    this.stopHeartbeat()
    this.unsubscribeAll()
    if (this.ws) { this.ws.close(); this.ws = null }
    this.api = null
    this.isAuthorized = false
    this.log("info", "Disconnected")
  }

  // ─── Logging ───────────────────────────────────────────────────────────────

  private log(type: "info" | "error" | "warning", message: string) {
    this.connectionLogs.push({ type, message, timestamp: new Date() })
    if (this.connectionLogs.length > this.maxLogs) this.connectionLogs.shift()
  }

  public getConnectionLogs(): ConnectionLog[] { return [...this.connectionLogs] }

  // ─── Connection status listeners ───────────────────────────────────────────

  public onConnectionStatus(callback: (status: "connected" | "disconnected" | "reconnecting") => void): () => void {
    this.connectionStatusListeners.add(callback)
    return () => this.connectionStatusListeners.delete(callback)
  }

  private notifyConnectionStatus(status: "connected" | "disconnected" | "reconnecting") {
    this.connectionStatusListeners.forEach(cb => cb(status))
  }

  private rejectAllPendingRequests(error: Error) {
    this.pendingRequests.forEach((cb, req_id) => {
      cb({ error: { message: error.message, code: "ConnectionLoss" }, req_id })
    })
    this.pendingRequests.clear()
  }

  // ─── Static helpers ────────────────────────────────────────────────────────

  public static subscribe(symbol: string, callback: (data: TickData) => void): () => void {
    const instance = DerivWebSocketManager.getInstance()
    let subscriptionId: string | null = null
    let isCancelled = false

    instance.subscribeTicks(symbol, callback).then((id) => {
      if (isCancelled && id) instance.unsubscribe(id, callback)
      else subscriptionId = id
    })

    return () => {
      isCancelled = true
      if (subscriptionId) instance.unsubscribe(subscriptionId, callback)
    }
  }

  public async connectOptions(type: "demo" | "real" | "public", otp?: string): Promise<void> {
    const baseUrl = DERIV_API.OPTIONS_WS[type.toUpperCase() as keyof typeof DERIV_API.OPTIONS_WS]
    const url = otp ? `${baseUrl}?otp=${otp}` : baseUrl
    return this.connect(url, true)
  }
}

export const derivWebSocket = DerivWebSocketManager.getInstance()
