import { DerivWebSocketManager } from "../deriv-websocket-manager"

export type MarketState = "Random" | "Transitional" | "Structured"

export interface MarketScore {
    symbol: string
    score: number // 0-100
    state: MarketState
    stability: number
    patternStrength: number
    noiseRatio: number
    lastDigit: number
    timestamp: number
}

export class SmartIntelligenceEngine {
    private static instance: SmartIntelligenceEngine
    private wsManager: DerivWebSocketManager
    private isScanning: boolean = false
    private subscriptionIds: Map<string, string> = new Map()
    private markets: string[] = ["R_10", "R_25", "R_50", "R_75", "R_100"]
    private scanResults: Map<string, MarketScore> = new Map()
    private tickWindows: Map<string, number[]> = new Map()
    private readonly WINDOW_SIZE = 100
    private listeners: Set<(scores: MarketScore[]) => void> = new Set()

    private constructor() {
        this.wsManager = DerivWebSocketManager.getInstance()
        this.initializeWindows()
    }

    public static getInstance(): SmartIntelligenceEngine {
        if (!SmartIntelligenceEngine.instance) {
            SmartIntelligenceEngine.instance = new SmartIntelligenceEngine()
        }
        return SmartIntelligenceEngine.instance
    }

    private initializeWindows() {
        this.markets.forEach(symbol => {
            this.tickWindows.set(symbol, [])
        })
    }

    public async startScanning() {
        if (this.isScanning) return
        console.log("[v0] Starting Smart Intelligence multi-market scan...")
        this.isScanning = true

        for (const symbol of this.markets) {
            const subId = await this.wsManager.subscribeTicks(symbol, (tick) => {
                this.processTick(symbol, tick.quote)
            })
            if (subId) {
                this.subscriptionIds.set(symbol, subId)
            }
        }
    }

    public async stopScanning() {
        console.log("[v0] Stopping Smart Intelligence scan...")
        for (const [symbol, subId] of this.subscriptionIds.entries()) {
            await this.wsManager.unsubscribe(subId)
        }
        this.subscriptionIds.clear()
        this.isScanning = false
    }

    public getIsScanning() {
        return this.isScanning
    }

    private processTick(symbol: string, quote: number) {
        const lastDigit = this.wsManager.extractLastDigit(quote)
        const window = this.tickWindows.get(symbol) || []

        window.push(lastDigit)
        if (window.length > this.WINDOW_SIZE) {
            window.shift()
        }

        this.tickWindows.set(symbol, window)
        this.calculateScore(symbol, lastDigit)
    }

    private calculateScore(symbol: string, lastDigit: number) {
        const window = this.tickWindows.get(symbol) || []
        if (window.length < 20) return // Wait for enough data

        // 1. Stability (Distribution Uniformity)
        const freq = this.getFrequencies(window)
        const idealFreq = window.length / 10
        let variance = 0
        freq.forEach(count => {
            variance += Math.pow(count - idealFreq, 2)
        })
        const stability = Math.max(0, 100 - (Math.sqrt(variance / 10) / idealFreq) * 100)

        // 2. Pattern Strength (Cluster Detection)
        let clusters = 0
        for (let i = 1; i < window.length; i++) {
            if (window[i] === window[i - 1]) clusters++
        }
        const patternStrength = Math.min(100, (clusters / (window.length / 5)) * 100)

        // 3. Noise Ratio (Entropy-based)
        const entropy = this.calculateEntropy(freq, window.length)
        const noiseRatio = (entropy / 3.32) * 100 // log2(10) is ~3.32

        // Final Scoring Logic
        let score = (stability * 0.4) + (patternStrength * 0.4) + ((100 - noiseRatio) * 0.2)

        let state: MarketState = "Random"
        if (score > 70) state = "Structured"
        else if (score > 40) state = "Transitional"

        const marketScore: MarketScore = {
            symbol,
            score: Math.round(score),
            state,
            stability: Math.round(stability),
            patternStrength: Math.round(patternStrength),
            noiseRatio: Math.round(noiseRatio),
            lastDigit,
            timestamp: Date.now()
        }

        this.scanResults.set(symbol, marketScore)
        this.notifyListeners()
    }

    private getFrequencies(window: number[]): number[] {
        const freq = Array(10).fill(0)
        window.forEach(d => freq[d]++)
        return freq
    }

    private calculateEntropy(freq: number[], total: number): number {
        let entropy = 0
        freq.forEach(count => {
            if (count > 0) {
                const p = count / total
                entropy -= p * Math.log2(p)
            }
        })
        return entropy
    }

    public getScores(): MarketScore[] {
        return Array.from(this.scanResults.values()).sort((a, b) => b.score - a.score)
    }

    public onUpdate(callback: (scores: MarketScore[]) => void) {
        this.listeners.add(callback)
        return () => { this.listeners.delete(callback); }
    }

    private notifyListeners() {
        const scores = this.getScores()
        this.listeners.forEach(callback => callback(scores))
    }
}
