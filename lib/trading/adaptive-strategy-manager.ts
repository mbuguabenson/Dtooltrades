import type { PatternMatch } from "./smart-pattern-engine"

export type TradeStrategy = "OverUnder" | "EvenOdd" | "Differs"

export interface StrategySignal {
    strategy: TradeStrategy
    type: string // e.g. "DIGITOVER", "DIGITUNDER"
    barrier: string
    confidence: number
    description: string
    entryStatus: "Blocked" | "Waiting" | "Confirmed"
}

export class AdaptiveStrategyManager {
    private minConfidence = 70

    public getSignals(patterns: PatternMatch[]): StrategySignal[] {
        const signals: StrategySignal[] = []

        for (const pattern of patterns) {
            const signal = this.mapPatternToSignal(pattern)
            if (signal) {
                signals.push(signal)
            }
        }

        return signals
    }

    private mapPatternToSignal(pattern: PatternMatch): StrategySignal | null {
        switch (pattern.type) {
            case "ExtremeCompression":
                return {
                    strategy: "OverUnder",
                    type: pattern.metadata.zone === "low" ? "DIGITOVER" : "DIGITUNDER",
                    barrier: pattern.metadata.zone === "low" ? "2" : "7",
                    confidence: pattern.confidence,
                    description: `Extreme compression detected. Reverting from ${pattern.metadata.zone} zone.`,
                    entryStatus: pattern.confidence >= 75 ? "Confirmed" : "Waiting"
                }

            case "EvenOddImbalance":
                return {
                    strategy: "EvenOdd",
                    type: pattern.metadata.side === "EVEN" ? "DIGITODD" : "DIGITEVEN", // Reversion logic
                    barrier: "0",
                    confidence: pattern.confidence,
                    description: `Mean-reversion following ${pattern.metadata.side} imbalance.`,
                    entryStatus: pattern.confidence >= 70 ? "Confirmed" : "Waiting"
                }

            case "ClusterRejection":
                return {
                    strategy: "Differs",
                    type: "DIGITDIFF",
                    barrier: pattern.metadata.rejectedDigit.toString(),
                    confidence: pattern.confidence,
                    description: `Fading rejected cluster of ${pattern.metadata.rejectedDigit}.`,
                    entryStatus: pattern.confidence >= 65 ? "Confirmed" : "Waiting"
                }

            default:
                return null
        }
    }
}
