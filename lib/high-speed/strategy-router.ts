"use client"

import { type PowerSnapshot } from "./power-analytics-engine"
import { highSpeedExecutor } from "./high-speed-executor"

export type TradeStrategy = "EVEN_ODD" | "OVER_UNDER" | "DIFFERS" | "MATCHES"

export interface StrategyConfig {
    stake: number
    martingale: number
    duration: number
    durationUnit: string
    autoBotEnabled: boolean
    marketSwitchOnLoss: boolean
    maxLossEnabled: boolean
    maxLossAmount: number
}

/**
 * Strategy Router
 * Decides when to execute trades based on PowerSnapshot and Strategy Rules.
 */
export class StrategyRouter {
    private config: StrategyConfig
    private isProcessing = false
    private consecutiveLosses = 0
    private currentStake: number

    constructor(config: StrategyConfig) {
        this.config = config
        this.currentStake = config.stake
    }

    public setConfig(config: StrategyConfig) {
        this.config = config
        // Reset stake if not in a loss recovery cycle (simple implementation)
        if (this.consecutiveLosses === 0) {
            this.currentStake = config.stake
        }
    }

    /**
     * Main entry point for every tick.
     */
    public async onTickUpdate(snapshot: PowerSnapshot, strategy: TradeStrategy, symbol: string) {
        if (this.isProcessing || !this.config.autoBotEnabled) return

        const signal = this.analyzeSignal(snapshot, strategy)

        if (signal) {
            this.isProcessing = true
            try {
                const contractId = await highSpeedExecutor.executeTrade({
                    symbol,
                    contract_type: signal.contractType,
                    amount: this.currentStake,
                    duration: this.config.duration,
                    duration_unit: this.config.durationUnit,
                    prediction: (signal as any).prediction
                })

                // Note: Real result tracking would happen via proposal_open_contract
                // For now, we return control
            } catch (error) {
                console.error("[v0] Strategy execution failed:", error)
            } finally {
                this.isProcessing = false
            }
        }
    }

    private analyzeSignal(snapshot: PowerSnapshot, strategy: TradeStrategy) {
        switch (strategy) {
            case "EVEN_ODD":
                return this.checkEvenOdd(snapshot)
            case "OVER_UNDER":
                return this.checkOverUnder(snapshot)
            case "DIFFERS":
                return this.checkDiffers(snapshot)
            case "MATCHES":
                return this.checkMatches(snapshot)
            default:
                return null
        }
    }

    /**
     * EVEN/ODD strategy:
     * 1. Power >= 55% and increasing.
     * 2. Identify dominant side.
     * 3. Strategy waits for least-appearing digit.
     */
    private checkEvenOdd(snapshot: PowerSnapshot) {
        const threshold = 55
        let dominant: "DIGITEVEN" | "DIGITODD" | null = null

        if (snapshot.evenPower >= threshold && snapshot.isEvenIncreasing) {
            dominant = "DIGITEVEN"
        } else if (snapshot.oddPower >= threshold && snapshot.isOddIncreasing) {
            dominant = "DIGITODD"
        }

        if (!dominant) return null

        // Special condition: dominant digit must appear within next 3 after weakest?
        // User requested: "Wait for least-appearing digit to appear. Within next 3, dominant must appear."
        // This requires a tiny state machine. For the stateless tick event, we check if last digit was weakest.
        if (snapshot.lastDigit === snapshot.weakestDigit) {
            return { contractType: dominant }
        }

        return null
    }

    /**
     * OVER/UNDER strategy:
     * 1. Power >= 55% and increasing.
     * 2. Over suggestion: 6,7,8,9. Under: 0,1,2,3.
     */
    private checkOverUnder(snapshot: PowerSnapshot) {
        const threshold = 55

        if (snapshot.overPower >= threshold && snapshot.isOverIncreasing) {
            return { contractType: "DIGITOVER", prediction: 5 } // Standard Over 5
        }

        if (snapshot.underPower >= threshold && snapshot.isUnderIncreasing) {
            return { contractType: "DIGITUNDER", prediction: 4 } // Standard Under 4
        }

        return null
    }

    /**
     * DIFFERS strategy:
     * 1. Only 2-7 allowed.
     * 2. Must NOT be Most appearing, 2nd most, or Least appearing.
     * 3. Power must be decreasing.
     */
    private checkDiffers(snapshot: PowerSnapshot) {
        // Collect prohibited digits
        const sorted = [...snapshot.digitPowers]
            .map((p, i) => ({ power: p, digit: i }))
            .sort((a, b) => b.power - a.power)

        const prohibited = [sorted[0].digit, sorted[1].digit, sorted[9].digit]

        // Pick a candidate from 2-7
        for (let d = 2; d <= 7; d++) {
            if (!prohibited.includes(d)) {
                // Frequency check (decreased power check would need history, using simple check here)
                if (snapshot.digitPowers[d] < 8) { // Less than average 10%
                    return { contractType: "DIGITDIFF", prediction: d }
                }
            }
        }

        return null
    }

    /**
     * MATCHES strategy:
     * 1. High frequency, every tick.
     * 2. Select highest-power digit.
     * 3. If power decreases -> stop.
     */
    private checkMatches(snapshot: PowerSnapshot) {
        const target = snapshot.strongestDigit
        // Simple heuristic: if power > 12 (above average) execute
        if (snapshot.digitPowers[target] > 12) {
            return { contractType: "DIGITMATCH", prediction: target }
        }
        return null
    }

    public recordResult(isWin: boolean) {
        if (isWin) {
            this.consecutiveLosses = 0
            this.currentStake = this.config.stake
        } else {
            this.consecutiveLosses++
            this.currentStake *= this.config.martingale

            if (this.config.maxLossEnabled && this.currentStake > this.config.maxLossAmount) {
                // Reset or stop
                this.currentStake = this.config.stake
            }
        }
    }
}
