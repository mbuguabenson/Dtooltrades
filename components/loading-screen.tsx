"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Loader2 } from "lucide-react"

interface LoadingStep {
  id: string
  label: string
  status: "pending" | "loading" | "complete"
}

interface LoadingScreenProps {
  onComplete: () => void
}

// ... imports ...

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // ... state and useEffect (keep existing logic) ...
  const [steps, setSteps] = useState<LoadingStep[]>([
    { id: "connect", label: "Connecting to Deriv API", status: "pending" },
    { id: "markets", label: "Initializing market data", status: "pending" },
    { id: "servers", label: "Setting up data from servers", status: "pending" },
    { id: "account", label: "Connecting accounts", status: "pending" },
    { id: "finalize", label: "Finalizing setup", status: "pending" },
  ])

  useEffect(() => {
    const loadingSequence = async () => {
      try {
        console.log("[v0] LoadingScreen: Starting initialization sequence")

        // Step 1: Connect to Deriv API (0-20%)
        setSteps((prev) => prev.map((s, i) => (i === 0 ? { ...s, status: "loading" } : s)))
        await animateProgress(0, 20, 800)
        setSteps((prev) => prev.map((s, i) => (i === 0 ? { ...s, status: "complete" } : s)))

        // Step 2: Initialize market data (20-40%)
        setSteps((prev) => prev.map((s, i) => (i === 1 ? { ...s, status: "loading" } : s)))
        await animateProgress(20, 40, 600)
        setSteps((prev) => prev.map((s, i) => (i === 1 ? { ...s, status: "complete" } : s)))

        // Step 3: Setting up data from servers (40-65%)
        setSteps((prev) => prev.map((s, i) => (i === 2 ? { ...s, status: "loading" } : s)))
        await animateProgress(40, 65, 700)
        setSteps((prev) => prev.map((s, i) => (i === 2 ? { ...s, status: "complete" } : s)))

        // Step 4: Connecting accounts (65-85%)
        setSteps((prev) => prev.map((s, i) => (i === 3 ? { ...s, status: "loading" } : s)))
        await animateProgress(65, 85, 600)
        setSteps((prev) => prev.map((s, i) => (i === 3 ? { ...s, status: "complete" } : s)))

        // Step 5: Finalizing setup (85-100%)
        setSteps((prev) => prev.map((s, i) => (i === 4 ? { ...s, status: "loading" } : s)))
        await animateProgress(85, 100, 500)
        setSteps((prev) => prev.map((s, i) => (i === 4 ? { ...s, status: "complete" } : s)))

        // Wait a moment to show completion
        await new Promise((resolve) => setTimeout(resolve, 500))
        console.log("[v0] LoadingScreen: Initialization complete, calling onComplete")
        onComplete()
      } catch (err) {
        console.error("[v0] LoadingScreen: Initialization error:", err)
        setError(err instanceof Error ? err.message : "Failed to initialize application")
      }
    }

    loadingSequence()
  }, [onComplete])

  const animateProgress = (from: number, to: number, duration: number) => {
    return new Promise<void>((resolve) => {
      const steps = 20
      const increment = (to - from) / steps
      const delay = duration / steps
      let current = from

      const interval = setInterval(() => {
        current += increment
        if (current >= to) {
          setProgress(to)
          clearInterval(interval)
          resolve()
        } else {
          setProgress(Math.round(current))
        }
      }, delay)
    })
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0e17]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-red-900/20 via-[#0a0e17] to-[#0a0e17]" />
        <div className="w-full max-w-md px-6 relative z-10">
          <div className="bg-[#111827]/80 backdrop-blur-md border border-red-500/30 rounded-2xl p-8 shadow-2xl shadow-red-500/10">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-white mb-2">Initialization Failed</h2>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-linear-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-full font-semibold transition-all shadow-lg hover:shadow-red-500/25"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050b14] overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-blue-900/10 via-[#050b14] to-[#050b14]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px] animate-pulse delay-1000" />

      <div className="w-full max-w-xl px-6 relative z-10">
        {/* Logo & Title */}
        <div className="text-center mb-10">
          <div className="relative inline-block mb-6 group">
            <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-xl animate-pulse group-hover:bg-blue-400/40 transition-all duration-500" />

            {/* Fintech Logo: Abstract Graph Pulse */}
            <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 drop-shadow-2xl">
              <circle cx="50" cy="50" r="45" fill="url(#bg-grad)" stroke="url(#stroke-grad)" strokeWidth="2" />
              <path d="M30 65 L45 50 L60 58 L75 35" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="animate-[dash_1.5s_ease-in-out_infinite]" />
              <circle cx="75" cy="35" r="3" fill="white" className="animate-ping" />
              <defs>
                <linearGradient id="bg-grad" x1="0" y1="0" x2="100" y2="100">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
                <linearGradient id="stroke-grad" x1="0" y1="0" x2="100" y2="100">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <h1 className="text-5xl font-bold mb-3 tracking-tight">
            <span className="bg-linear-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Profit Hub
            </span>
          </h1>
          <p className="text-slate-400 text-lg font-light tracking-wide mb-1">
            Advanced Trading Intelligence
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-4 mb-10">
          <div className="relative h-2 bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-slate-700/30">
            <div
              className="absolute inset-0 bg-linear-to-r from-blue-600 via-cyan-500 to-purple-500 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(34,211,238,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-cyan-400 font-medium animate-pulse">Initializing...</span>
            <span className="text-slate-300 font-mono">{progress}%</span>
          </div>
        </div>

        {/* Loading Steps */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/50 rounded-2xl p-6 shadow-xl mb-6">
          <div className="space-y-4">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center gap-4 transition-all duration-300 ${step.status === "loading"
                    ? "opacity-100 translate-x-2"
                    : step.status === "complete"
                      ? "opacity-60"
                      : "opacity-40"
                  }`}
              >
                <div className="shrink-0 w-6 h-6 flex items-center justify-center">
                  {step.status === "complete" ? (
                    <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/50">
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                  ) : step.status === "loading" ? (
                    <div className="w-5 h-5 rounded-full border-2 border-t-cyan-400 border-r-transparent border-b-cyan-400/30 border-l-transparent animate-spin" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${step.status === "loading"
                        ? "text-cyan-300"
                        : step.status === "complete"
                          ? "text-slate-400"
                          : "text-slate-600"
                      }`}
                  >
                    {step.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest">
            Secure Connection • Encrypted Data
          </p>
        </div>
      </div>
    </div>
  )
}
