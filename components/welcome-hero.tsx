"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, TrendingUp, BarChart3, Zap } from "lucide-react"

interface WelcomeHeroProps {
  theme?: "light" | "dark"
  onGetStarted?: () => void
}

export function WelcomeHero({ theme = "dark", onGetStarted }: WelcomeHeroProps) {
  return (
    <div className={`w-full py-16 sm:py-24 lg:py-32 relative overflow-hidden ${theme === "dark" ? "bg-[#0a0a0a]" : "bg-white"}`}>
      {/* Background gradient accent */}
      <div className={`absolute inset-0 overflow-hidden ${theme === "dark" ? "" : ""}`}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{background: theme === "dark" ? "radial-gradient(circle, rgb(59, 130, 246), transparent)" : "radial-gradient(circle, rgb(59, 130, 246), transparent)"}}
        />
      </div>

      <div className="relative z-10 mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 mb-6 sm:mb-8">
          <div className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border text-xs sm:text-sm font-semibold ${theme === "dark" 
            ? "border-blue-500/30 bg-blue-500/10 text-blue-400" 
            : "border-blue-200 bg-blue-50 text-blue-700"}`}>
            Welcome to ProfitHub
          </div>
        </div>

        {/* Main Heading */}
        <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
          Real-Time Trading <span className={`${theme === "dark" ? "text-blue-500" : "text-blue-600"}`}>Analysis</span> & Signals
        </h1>

        {/* Subheading */}
        <p className={`text-lg sm:text-xl mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
          Advanced market analysis with real-time data. Track digits, patterns, and trading signals for Deriv markets with professional-grade tools.
        </p>

        {/* CTA Button */}
        <Button
          onClick={onGetStarted}
          className={`mb-12 sm:mb-16 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-lg inline-flex items-center gap-2 transition-all hover:gap-3 ${theme === "dark"
            ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20"
            : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30"}`}
        >
          Get Started
          <ArrowRight className="w-5 h-5" />
        </Button>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {[
            {
              icon: TrendingUp,
              title: "Real-Time Data",
              description: "Live market updates and price tracking"
            },
            {
              icon: BarChart3,
              title: "Analysis Tools",
              description: "Digit distribution, patterns & statistics"
            },
            {
              icon: Zap,
              title: "Trading Signals",
              description: "Smart signals for even-odd, matches & more"
            }
          ].map((feature, idx) => {
            const Icon = feature.icon
            return (
              <div
                key={idx}
                className={`p-4 sm:p-6 rounded-lg border transition-all ${theme === "dark"
                  ? "border-white/10 bg-white/5 hover:bg-white/10 hover:border-blue-500/30"
                  : "border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-blue-300"}`}
              >
                <Icon className={`w-6 h-6 sm:w-8 sm:h-8 mb-3 mx-auto ${theme === "dark" ? "text-blue-500" : "text-blue-600"}`} />
                <h3 className={`font-semibold mb-1 text-sm sm:text-base ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                  {feature.title}
                </h3>
                <p className={`text-xs sm:text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
