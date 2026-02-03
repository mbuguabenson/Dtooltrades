"use client"

import { useState, useEffect } from "react"

interface LoadingScreenProps {
  onComplete: () => void
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [shouldFadeOut, setShouldFadeOut] = useState(false)

  useEffect(() => {
    // Simulate loading sequence
    const totalDuration = 2500 // 2.5 seconds total load time
    const intervalTime = 20
    const steps = totalDuration / intervalTime

    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      const newProgress = Math.min((currentStep / steps) * 100, 100)

      // Non-linear progress simulation
      const easedProgress = easeOutQuart(newProgress / 100) * 100
      setProgress(easedProgress)

      if (currentStep >= steps) {
        clearInterval(timer)
        setTimeout(() => {
          setShouldFadeOut(true)
          setTimeout(onComplete, 500) // Wait for fade out animation
        }, 200)
      }
    }, intervalTime)

    return () => clearInterval(timer)
  }, [onComplete])

  // Easing function for smooth progress
  const easeOutQuart = (x: number): number => {
    return 1 - Math.pow(1 - x, 4)
  }

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050b14] transition-opacity duration-500 ${shouldFadeOut ? 'opacity-0' : 'opacity-100'}`}>

      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-[#050b14] to-[#050b14]" />

      {/* Central Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Logo Container */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse"></div>
          <div className="w-24 h-24 rounded-2xl bg-linear-to-br from-blue-600 to-cyan-400 flex items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.3)] relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent"></div>

            {/* Logo Icon */}
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white drop-shadow-lg">
              <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Text */}
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
          Profit Hub
        </h1>
        <p className="text-blue-400/60 text-sm font-medium tracking-widest uppercase mb-12">
          Initializing System
        </p>

        {/* Minimal Progress Bar */}
        <div className="w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-blue-500 to-cyan-400 transition-all duration-100 ease-out shadow-[0_0_10px_rgba(56,189,248,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-2 text-[10px] text-slate-500 font-mono">
          {progress.toFixed(0)}%
        </div>
      </div>

    </div>
  )
}
