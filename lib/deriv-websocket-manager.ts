"use client"

type MessageHandler = (message: any) => void

interface TickData {
  quote: number
  lastDigit: number
  epoch: number
  symbol: string
  id?: string
}

interface ConnectionLog {
  type: "info" | "error" | "warning"
  message: string
  timestamp: Date
}

import { DERIV_CONFIG } from "./deriv-config"

// ... imports

/**
 * Unified Deriv WebSocket Manager - Single source of truth for all WebSocket operations
 * Handles connection, reconnection, message routing, and subscription management
 */
export class DerivWebSocketManager {
  private static instance: DerivWebSocketManager | null = null
  private ws: WebSocket | null = null
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

  public getNextReqId(): number {
    return ++this.reqIdCounter;
  }
  private connectionLogs: ConnectionLog[] = []
  private maxLogs = 100
  private readonly appId = DERIV_CONFIG.APP_ID
  private readonly wsUrl = `wss://ws.derivws.com/websockets/v3?app_id=${DERIV_CONFIG.APP_ID}`

  private tickCallbacks: Map<string, Set<(tick: TickData) => void>> = new Map()

  private constructor() { }

  public static getInstance(): DerivWebSocketManager {
    if (!DerivWebSocketManager.instance) {
      DerivWebSocketManager.instance = new DerivWebSocketManager()
    }
    return DerivWebSocketManager.instance
  }

  public async connect(): Promise<void> {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.log("info", "WebSocket already connected")
        return Promise.resolve()
      }
      if (this.connectionPromise) {
        return this.connectionPromise
      }
    }

    if (this.connectionPromise) {
      return this.connectionPromise
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        console.log("[v0] Connecting to Deriv WebSocket:", this.wsUrl)
        this.log("info", "Initiating WebSocket connection")
        this.notifyConnectionStatus("reconnecting")

        this.ws = new WebSocket(this.wsUrl)

        const connectionTimeout = setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            console.error("[v0] WebSocket connection timeout")
            this.log("error", "Connection timeout after 10 seconds")
            this.ws?.close()
            this.connectionPromise = null
            this.notifyConnectionStatus("disconnected")
            reject(new Error("Connection timeout"))
          }
        }, 10000)

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout)
          console.log("[v0] WebSocket connected successfully")
          this.log("info", "WebSocket connected successfully")
          this.reconnectAttempts = 0
          this.lastMessageTime = Date.now()
          this.notifyConnectionStatus("connected")
          this.startHeartbeat()
          this.processMessageQueue()
          this.connectionPromise = null
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            this.lastMessageTime = Date.now() // Move here to ensure it's only on successful parse

            // Log pings for debugging if needed (rare)
            if (message.msg_type === "ping") {
              // console.log("[v0] Heartbeat pong received")
            }

            this.routeMessage(message)
          } catch (error) {
            console.error("[v0] Failed to parse message:", error)
            this.log("error", `Failed to parse message: ${error}`)
          }
        }

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout)
          console.error("[v0] WebSocket error:", error)
          this.log("error", `WebSocket error: ${error}`)
          this.connectionPromise = null
          this.notifyConnectionStatus("disconnected")
          reject(error)
        }

        this.ws.onclose = () => {
          clearTimeout(connectionTimeout)
          console.log("[v0] WebSocket closed, attempting reconnect...")
          this.log("warning", "WebSocket closed, reconnecting...")

          if (this.connectionPromise) {
            // Rejection will only trigger if it hasn't resolved yet
            reject(new Error("WebSocket closed during connection attempt"))
          }

          this.connectionPromise = null
          this.stopHeartbeat()
          this.notifyConnectionStatus("disconnected")
          this.handleReconnect()
        }
      } catch (error) {
        console.error("[v0] Connection setup error:", error)
        this.log("error", `Connection setup error: ${error}`)
        this.connectionPromise = null
        this.notifyConnectionStatus("disconnected")
        reject(error)
      }
    })

    return this.connectionPromise
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.log("error", "Max reconnection attempts reached, resetting counter")
      setTimeout(() => {
        this.reconnectAttempts = 0
        this.log("info", "Reconnection counter reset, will attempt again")
        this.handleReconnect()
      }, 60000)
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1)
    console.log(`[v0] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
    this.log("info", `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error("[v0] Reconnection failed:", error)
        this.log("error", `Reconnection failed: ${error}`)
      })
    }, delay)
  }

  private startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatInterval = setInterval(() => {
      const timeSinceLastMessage = Date.now() - this.lastMessageTime

      // Increase threshold to 45s (3x ping interval) to allow for network jitter
      if (timeSinceLastMessage > 45000) {
        console.warn(`[v0] No messages received for ${Math.round(timeSinceLastMessage / 1000)}s, reconnecting...`)
        this.log("warning", "No messages for 45s, reconnecting")
        this.ws?.close()
        return
      }

      if (this.ws?.readyState === WebSocket.OPEN) {
        try {
          // Send ping to keep connection alive and update lastMessageTime on response
          this.ws.send(JSON.stringify({ ping: 1, req_id: this.getNextReqId() }))
        } catch (error) {
          console.error("[v0] Heartbeat ping failed:", error)
          this.log("error", `Heartbeat ping failed: ${error}`)
        }
      }
    }, 15000)
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private processMessageQueue() {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift()
      this.ws.send(JSON.stringify(message))
    }
  }

  public send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.log("[v0] WebSocket not ready, queueing message")
      this.log("info", "Message queued - WebSocket not ready")
      this.messageQueue.push(message)
    }
  }

  private pendingRequests: Map<number, (data: any) => void> = new Map()

  private routeMessage(message: any) {
    try {
      this.lastMessageTime = Date.now()

      // 1. Resolve pending request-response patterns first
      if (message.req_id) {
        const req_id = Number(message.req_id);
        const callback = this.pendingRequests.get(req_id);
        if (callback) {
          if (message.error || !message.subscription) {
            this.pendingRequests.delete(req_id);
          }
          callback(message);
        }
      }

      // 2. Special handling for ticks (New robust way)
      if (message.tick) {
        const symbol = message.tick.symbol
        const callbacks = this.tickCallbacks.get(symbol)
        if (callbacks) {
          const tickData: TickData = {
            quote: message.tick.quote,
            lastDigit: this.extractLastDigit(message.tick.quote),
            epoch: message.tick.epoch,
            symbol: symbol,
            id: message.subscription?.id
          }
          callbacks.forEach(cb => cb(tickData))
        }
      }

      // 3. Route by message type for other events
      if (message.msg_type) {
        const handlers = this.messageHandlers.get(message.msg_type) || []
        handlers.forEach((handler) => handler(message))
      }

      // 4. Legacy fallbacks
      if (!message.msg_type) {
        if (message.proposal) (this.messageHandlers.get('proposal') || []).forEach(h => h(message));
        if (message.buy) (this.messageHandlers.get('buy') || []).forEach(h => h(message));
      }

      // 5. Route to wildcard and error handlers
      if (message.error) {
        const handlers = this.messageHandlers.get("error") || []
        handlers.forEach((handler) => handler(message))
      }

      const wildcardHandlers = this.messageHandlers.get("*") || []
      wildcardHandlers.forEach((handler) => handler(message))
    } catch (error) {
      console.error("[v0] Error routing message:", error)
      this.log("error", `Error routing message: ${error}`)
    }
  }

  /**
   * Send a message and wait for its specific response using req_id
   */
  public async sendAndWait(message: any, timeoutMs = 30000): Promise<any> {
    const req_id = message.req_id || this.getNextReqId();
    const payload = { ...message, req_id };

    // Ensure connected before starting the timeout
    if (this.ws?.readyState !== WebSocket.OPEN) {
      try {
        await this.connect();
      } catch (error) {
        throw new Error(`Cannot send request ${req_id}: WebSocket failed to connect`);
      }
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(req_id);
        const error = new Error(`Request ${req_id} (${message.ticks || message.active_symbols || 'unknown'}) timed out after ${timeoutMs}ms`);
        console.error(`[v0] ${error.message}`);
        this.log("error", error.message);
        reject(error);
      }, timeoutMs);

      this.pendingRequests.set(req_id, (data: any) => {
        clearTimeout(timeout);
        if (data.error) {
          console.error(`[v0] Request ${req_id} failed:`, data.error);
          reject(data.error);
        } else {
          resolve(data);
        }
      });

      this.send(payload);
    });
  }

  public on(event: string, handler: MessageHandler) {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, [])
    }
    this.messageHandlers.get(event)!.push(handler)
  }

  public off(event: string, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  private symbolToSubscriptionMap: Map<string, string> = new Map() // symbol -> ID
  private activeSubscriptions: Set<string> = new Set() // Track symbols currently being subscribed to prevent race conditions

  public async subscribeTicks(symbol: string, callback: (tick: TickData) => void): Promise<string> {
    // Register the callback
    if (!this.tickCallbacks.has(symbol)) {
      this.tickCallbacks.set(symbol, new Set())
    }
    this.tickCallbacks.get(symbol)!.add(callback)

    // 1. Check if already subscribed to this symbol
    const existingId = this.symbolToSubscriptionMap.get(symbol)
    if (existingId) {
      const currentRef = this.subscriptionRefCount.get(existingId) || 0
      this.subscriptionRefCount.set(existingId, currentRef + 1)
      console.log(`[v0] Reusing existing subscription for ${symbol}: ${existingId} (Refs: ${currentRef + 1})`)
      return existingId
    }

    // 2. Prevent concurrent duplicate subscription requests
    if (this.activeSubscriptions.has(symbol)) {
      console.log(`[v0] Subscription in progress for ${symbol}, waiting...`)
      return new Promise((resolve) => {
        const check = setInterval(() => {
          const id = this.symbolToSubscriptionMap.get(symbol)
          if (id) {
            clearInterval(check)
            resolve(id)
          }
        }, 200)
        setTimeout(() => { clearInterval(check); resolve("") }, 10000)
      })
    }

    this.activeSubscriptions.add(symbol)
    const requestId = this.getNextReqId()

    try {
      const response = await this.sendAndWait({
        ticks: symbol,
        subscribe: 1,
        req_id: requestId,
      })

      if (response.subscription?.id) {
        const subscriptionId = response.subscription.id
        this.subscriptions.set(subscriptionId, symbol)
        this.symbolToSubscriptionMap.set(symbol, subscriptionId)
        this.subscriptionRefCount.set(subscriptionId, 1)
        this.activeSubscriptions.delete(symbol)

        // Push initial tick if available
        if (response.tick) {
          callback({
            quote: response.tick.quote,
            lastDigit: this.extractLastDigit(response.tick.quote),
            epoch: response.tick.epoch,
            symbol: symbol,
            id: subscriptionId
          })
        }

        return subscriptionId
      }
    } catch (error) {
      console.error(`[v0] Failed to subscribe to ${symbol}:`, error)
      this.activeSubscriptions.delete(symbol)
    }

    return ""
  }

  public extractLastDigit(quote: number): number {
    // This is the most reliable way to get the last digit from Deriv quotes
    // Quotes usually have 2-4 decimal places.
    const parts = quote.toString().split('.')
    const decimals = parts[1] || ""
    if (decimals.length > 0) {
      return parseInt(decimals[decimals.length - 1])
    }
    return Math.floor(quote) % 10
  }

  public async unsubscribe(subscriptionId: string, callback?: (tick: TickData) => void) {
    if (!subscriptionId) return

    const symbol = this.subscriptions.get(subscriptionId)

    // Remove individual callback if provided
    if (symbol && callback) {
      const callbacks = this.tickCallbacks.get(symbol)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.tickCallbacks.delete(symbol)
        }
      }
    }

    const currentRef = this.subscriptionRefCount.get(subscriptionId) || 1
    if (currentRef > 1) {
      this.subscriptionRefCount.set(subscriptionId, currentRef - 1)
      return
    }

    // Really unsubscribe
    if (symbol) {
      this.symbolToSubscriptionMap.delete(symbol)
      this.tickCallbacks.delete(symbol)
    }

    try {
      this.send({ forget: subscriptionId, req_id: this.getNextReqId() })
      this.subscriptions.delete(subscriptionId)
      this.subscriptionRefCount.delete(subscriptionId)
      console.log(`[v0] Unsubscribed from ${subscriptionId} (${symbol})`)
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

  public async getActiveSymbols(): Promise<Array<{ symbol: string; display_name: string; market?: string; market_display_name?: string }>> {
    if (this.symbolsCache) return this.symbolsCache;
    if (this.symbolsPromise) return this.symbolsPromise;

    this.symbolsPromise = (async () => {
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          attempts++;
          console.log(`[v0] Fetching active symbols (attempt ${attempts}/${maxAttempts})...`);

          const response = await this.sendAndWait({
            active_symbols: "brief",
            product_type: "basic"
          }, 30000); // 30s timeout for symbols

          if (response.active_symbols) {
            this.symbolsCache = response.active_symbols.map((s: any) => ({
              symbol: s.symbol,
              display_name: s.display_name,
              market: s.market,
              market_display_name: s.market_display_name
            }));
            console.log(`[v0] Successfully loaded ${this.symbolsCache?.length} symbols`);
            return this.symbolsCache!;
          }
          throw new Error("Invalid symbols response");
        } catch (error) {
          console.error(`[v0] getActiveSymbols attempt ${attempts} failed:`, error);
          if (attempts === maxAttempts) {
            console.warn("[v0] All attempts to fetch symbols failed, using defaults");
            this.symbolsCache = [
              { symbol: "R_10", display_name: "Volatility 10 Index", market: "synthetic_index" },
              { symbol: "R_25", display_name: "Volatility 25 Index", market: "synthetic_index" },
              { symbol: "R_50", display_name: "Volatility 50 Index", market: "synthetic_index" },
              { symbol: "R_75", display_name: "Volatility 75 Index", market: "synthetic_index" },
              { symbol: "R_100", display_name: "Volatility 100 Index", market: "synthetic_index" },
              { symbol: "1HZ10V", display_name: "Volatility 10 (1s) Index", market: "synthetic_index" },
              { symbol: "1HZ100V", display_name: "Volatility 100 (1s) Index", market: "synthetic_index" },
            ];
            return this.symbolsCache;
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
        }
      }
      return []; // Should not reach here
    })();

    return this.symbolsPromise.finally(() => {
      this.symbolsPromise = null;
    });
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  public disconnect() {
    this.stopHeartbeat()
    this.unsubscribeAll()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.log("info", "Disconnected from WebSocket")
  }

  private log(type: "info" | "error" | "warning", message: string) {
    const log: ConnectionLog = {
      type,
      message,
      timestamp: new Date(),
    }
    this.connectionLogs.push(log)

    if (this.connectionLogs.length > this.maxLogs) {
      this.connectionLogs.shift()
    }
  }

  public getConnectionLogs(): ConnectionLog[] {
    return [...this.connectionLogs]
  }

  private connectionStatusListeners: Set<(status: "connected" | "disconnected" | "reconnecting") => void> = new Set()

  public onConnectionStatus(callback: (status: "connected" | "disconnected" | "reconnecting") => void): () => void {
    this.connectionStatusListeners.add(callback)
    return () => {
      this.connectionStatusListeners.delete(callback)
    }
  }

  private notifyConnectionStatus(status: "connected" | "disconnected" | "reconnecting") {
    this.connectionStatusListeners.forEach((callback) => callback(status))
  }

  public static subscribe(symbol: string, callback: (data: TickData) => void): () => void {
    const instance = DerivWebSocketManager.getInstance()
    let subscriptionId: string | null = null

    instance
      .subscribeTicks(symbol, callback)
      .then((id: string) => {
        subscriptionId = id
      })

    return () => {
      if (subscriptionId) {
        instance.unsubscribe(subscriptionId, callback)
      }
    }
  }
}

export const derivWebSocket = DerivWebSocketManager.getInstance()
