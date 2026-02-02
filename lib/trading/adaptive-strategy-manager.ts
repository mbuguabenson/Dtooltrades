import type { PatternMatch } from "./smart-pattern-engine"

export type TradeStrategy = "OverUnder" | "EvenOdd" | "Matches" | "Differs"

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

        // Mutual Exclusion: Matches and Differs must never trigger together
        return this.resolveConflicts(signals)
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

            case "Clustering":
                return {
                    strategy: "Matches",
                    type: "DIGITMATCH",
                    barrier: pattern.metadata.digit.toString(),
                    confidence: pattern.confidence,
                    description: `Following cluster momentum for digit ${pattern.metadata.digit}.`,
                    entryStatus: pattern.confidence >= 75 ? "Confirmed" : "Waiting"
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

            case "MicroRepetition":
                return {
                    strategy: "Matches",
                    type: "DIGITMATCH",
                    barrier: pattern.metadata.series[pattern.metadata.series.length - 1].toString(),
                    confidence: pattern.confidence,
                    description: "High-probability repetition continuation.",
                    entryStatus: "Confirmed"
                }

            default:
                return null
        }
    }

    private resolveConflicts(signals: StrategySignal[]): StrategySignal[] {
        let hasMatches = signals.some(s => s.strategy === "Matches")
        let hasDiffers = signals.some(s => s.strategy === "Differs")

        if (hasMatches && hasDiffers) {
            // Pick the one with higher confidence
            const bestMatch = signals.filter(s => s.strategy === "Matches").sort((a, b) => b.confidence - a.confidence)[0]
            const bestDiffer = signals.filter(s => s.strategy === "Differs").sort((a, b) => b.confidence - a.confidence)[0]

            if (bestMatch.confidence >= bestDiffer.confidence) {
                return signals.filter(s => s.strategy !== "Differs")
            } else {
                return signals.filter(s => s.strategy !== "Matches")
            }
        }

        return signals
    }
}
