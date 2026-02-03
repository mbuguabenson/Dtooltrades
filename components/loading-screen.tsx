"use client"

import { useState, useEffect } from "react"
import { CheckCircle2 } from "lucide-react"

interface LoadingStep {
  id: string
  label: string
  status: "pending" | "loading" | "complete"
}

interface LoadingScreenProps {
  onComplete: () => void
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const [steps, setSteps] = useState<LoadingStep[]>([
    { id: "connect", label: "Establishing Secure Link", status: "pending" },
    { id: "markets", label: "Calibrating Market Feeds", status: "pending" },
    { id: "analyze", label: "Initializing Quantum Analysis", status: "pending" },
    { id: "account", label: "Verifying Credentials", status: "pending" },
    { id: "finalize", label: "Launching Platform", status: "pending" },
  ])

  useEffect(() => {
    const loadingSequence = async () => {
      try {
        console.log("[v0] Loader: Quantum Sequence Initiated")

        // Step 1: Secure Link
        setSteps((prev) => prev.map((s, i) => (i === 0 ? { ...s, status: "loading" } : s)))
        await animateProgress(0, 25, 800)
        setSteps((prev) => prev.map((s, i) => (i === 0 ? { ...s, status: "complete" } : s)))

        // Step 2: Market Feeds
        setSteps((prev) => prev.map((s, i) => (i === 1 ? { ...s, status: "loading" } : s)))
        await animateProgress(25, 45, 700)
        setSteps((prev) => prev.map((s, i) => (i === 1 ? { ...s, status: "complete" } : s)))

        // Step 3: Analysis
        setSteps((prev) => prev.map((s, i) => (i === 2 ? { ...s, status: "loading" } : s)))
        await animateProgress(45, 70, 900)
        setSteps((prev) => prev.map((s, i) => (i === 2 ? { ...s, status: "complete" } : s)))

        // Step 4: Verification
        setSteps((prev) => prev.map((s, i) => (i === 3 ? { ...s, status: "loading" } : s)))
        await animateProgress(70, 90, 600)
        setSteps((prev) => prev.map((s, i) => (i === 3 ? { ...s, status: "complete" } : s)))

        // Step 5: Finalize
        setSteps((prev) => prev.map((s, i) => (i === 4 ? { ...s, status: "loading" } : s)))
        await animateProgress(90, 100, 500)
        setSteps((prev) => prev.map((s, i) => (i === 4 ? { ...s, status: "complete" } : s)))

        await new Promise((resolve) => setTimeout(resolve, 800))
        onComplete()
      } catch (err) {
        console.error("[v0] Loader Error:", err)
        setError("Initialization Sequence Failed")
      }
    }

    loadingSequence()
  }, [onComplete])

  const animateProgress = (from: number, to: number, duration: number) => {
    return new Promise<void>((resolve) => {
      const steps = 30
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
          setProgress(current)
        }
      }, delay)
    })
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505] text-white">
        <div className="text-center p-8 border border-red-500/20 bg-red-950/10 rounded-xl backdrop-blur-xl">
          <h2 className="text-2xl font-light mb-4 text-red-400">System Halted</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded text-sm tracking-widest uppercase transition-all">
            Reboot System
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#020408] overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.03),transparent_70%)]" />
      <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,rgba(168,85,247,0.03),transparent_60%)] animate-spin-slow" />

      <div className="relative z-10 w-full max-w-sm px-6">
        {/* Quantum Core Logo */}
        <div className="flex justify-center mb-12 relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-[60px] rounded-full animate-pulse" />
          <div className="w-24 h-24 relative">
            <div className="absolute inset-0 border-t border-b border-blue-500/30 rounded-full animate-spin-slow" />
            <div className="absolute inset-2 border-l border-r border-cyan-400/30 rounded-full animate-spin-reverse-slow" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_20px_white] animate-pulse" />
            </div>
            {/* Orbital Rings */}
            <div className="absolute inset-[-10px] border border-blue-500/10 rounded-full animate-ping-slow" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-light tracking-[0.2em] text-white mb-2">
            PROFIT<span className="font-bold text-blue-400">HUB</span>
          </h1>
          <p className="text-[10px] uppercase tracking-[0.4em] text-gray-500">
            Quantum Trading Interface
          </p>
        </div>

        {/* Progress Bar - Minimal */}
        <div className="mb-8">
          <div className="flex justify-between text-[10px] uppercase tracking-widest text-gray-400 mb-2">
            <span>System Integrity</span>
            <span className="text-blue-400">{Math.round(progress)}%</span>
          </div>
          <div className="h-[2px] w-full bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-blue-600 via-cyan-400 to-white transition-all duration-300 ease-out shadow-[0_0_10px_rgba(34,211,238,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center gap-3">
              <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${step.status === "complete" ? "bg-cyan-400 shadow-[0_0_8px_cyan]" :
                  step.status === "loading" ? "bg-blue-500 animate-pulse" : "bg-gray-800"
                }`} />
              <span className={`text-[10px] uppercase tracking-wider transition-colors duration-300 ${step.status === "complete" ? "text-gray-400" :
                  step.status === "loading" ? "text-blue-300" : "text-gray-700"
                }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-[9px] text-gray-700 uppercase tracking-[0.3em]">
          Encrypted End-to-End
        </p>
      </div>
    </div>
  )
}
