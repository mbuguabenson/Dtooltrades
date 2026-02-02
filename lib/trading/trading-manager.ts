import type { DerivAPIClient } from "../deriv-api"
import { DerivRealTrader } from "../deriv-real-trader"
import type { StrategySignal } from "./adaptive-strategy-manager"

export type TradeMode = "Manual" | "Auto"

export interface SessionStats {
    trades: number
    wins: number
    losses: number
    profit: number
    highestWin: number
    worstLoss: number
}

export class TradingManager {
    private trader: DerivRealTrader
    private mode: TradeMode = "Manual"
    private isAutoTrading = false
    private stats: SessionStats = {
        trades: 0,
        wins: 0,
        losses: 0,
        profit: 0,
        highestWin: 0,
        worstLoss: 0
    }

    private maxLoss = 10
    private targetProfit = 5
    private defaultStake = 0.35
    private lastTradeTime = 0
    private tickDuration = 3

    constructor(apiClient: DerivAPIClient) {
        this.trader = new DerivRealTrader(apiClient)
    }

    public setConfig(config: { maxLoss: number, targetProfit: number, stake: number, duration: number }) {
        this.maxLoss = config.maxLoss
        this.targetProfit = config.targetProfit
        this.defaultStake = config.stake
        this.tickDuration = config.duration
    }

    public async tradeOnce(signal: StrategySignal, symbol: string) {
        if (this.stats.profit <= -this.maxLoss || this.stats.profit >= this.targetProfit) {
            console.warn("[v0] Session limits reached.")
            return
        }

        if (signal.entryStatus !== "Confirmed") {
            console.warn("[v0] Entry not confirmed.")
            return
        }

        return this.execute(signal, symbol)
    }

    public startAutoTrade(symbol: string, getSignal: () => StrategySignal | null) {
        if (this.isAutoTrading) return
        this.isAutoTrading = true
        this.mode = "Auto"

        this.autoLoop(symbol, getSignal)
    }

    public stopAutoTrade() {
        this.isAutoTrading = false
        this.mode = "Manual"
    }

    private async autoLoop(symbol: string, getSignal: () => StrategySignal | null) {
        while (this.isAutoTrading) {
            if (this.stats.profit <= -this.maxLoss || this.stats.profit >= this.targetProfit) {
                this.stopAutoTrade()
                break
            }

            if (this.trader.getActiveContractCount() > 0) {
                await new Promise(r => setTimeout(r, 1000))
                continue
            }

            const signal = getSignal()
            if (signal && signal.entryStatus === "Confirmed") {
                // Double safety: check for API lag or tick freeze
                if (Date.now() - this.lastTradeTime < 5000) {
                    await new Promise(r => setTimeout(r, 1000))
                    continue
                }

                await this.execute(signal, symbol)
            }

            await new Promise(r => setTimeout(r, 1000))
        }
    }

    private async execute(signal: StrategySignal, symbol: string) {
        const result = await this.trader.executeTrade({
            symbol,
            contractType: signal.type,
            stake: this.defaultStake,
            duration: this.tickDuration,
            durationUnit: "t",
            barrier: signal.barrier
        })

        if (result) {
            this.lastTradeTime = Date.now()
            this.updateStats(result)
        }

        return result
    }

    private updateStats(result: any) {
        this.stats.trades++
        if (result.isWin) {
            this.stats.wins++
            this.stats.profit += result.profit
            if (result.profit > this.stats.highestWin) this.stats.highestWin = result.profit
        } else {
            this.stats.losses++
            this.stats.profit -= result.buyPrice
            if (result.buyPrice > this.stats.worstLoss) this.stats.worstLoss = result.buyPrice
        }
    }

    public getStats() {
        return { ...this.stats }
    }

    public getStatus() {
        return {
            mode: this.mode,
            isAutoTrading: this.isAutoTrading,
            activeContracts: this.trader.getActiveContractCount()
        }
    }
}
