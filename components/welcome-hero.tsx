"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, BarChart3, Zap, Activity } from "lucide-react"

interface WelcomeHeroProps {
  theme?: "light" | "dark"
  onGetStarted?: () => void
}

export function WelcomeHero({ theme = "dark", onGetStarted }: WelcomeHeroProps) {
  return (
    <div className={`w-full py-12 sm:py-20 lg:py-28 relative overflow-hidden ${theme === "dark" ? "bg-[#0a0a0a]" : "bg-white"}`}>
      {/* Gradient background elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-5 pointer-events-none"
        style={{background: theme === "dark" ? "rgb(59, 130, 246)" : "rgb(59, 130, 246)"}}
      />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-5 pointer-events-none"
        style={{background: theme === "dark" ? "rgb(29, 78, 216)" : "rgb(29, 78, 216)"}}
      />

      <div className="relative z-10 mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="text-center mb-12 sm:mb-16">
          {/* Announcement Badge */}
          <div className="inline-flex items-center gap-2 mb-4 sm:mb-6 px-3 sm:px-4 py-2 rounded-full border"
            style={{
              borderColor: theme === "dark" ? "rgba(59, 130, 246, 0.3)" : "rgba(59, 130, 246, 0.2)",
              backgroundColor: theme === "dark" ? "rgba(59, 130, 246, 0.05)" : "rgba(59, 130, 246, 0.05)"
            }}>
            <span className={`text-xs sm:text-sm font-semibold ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}>
              Professional Trading Analysis Platform
            </span>
          </div>

          {/* Main Heading */}
          <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 tracking-tight leading-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
            Market Intelligence at <span className={`${theme === "dark" ? "text-blue-500" : "text-blue-600"}`}>Your Fingertips</span>
          </h1>

          {/* Subheading */}
          <p className={`text-lg sm:text-xl mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            Advanced analytics for Deriv markets. Track real-time data, analyze digit patterns, and execute smarter trades with professional-grade signals and insights.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={onGetStarted}
              className={`px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-lg inline-flex items-center gap-2 transition-all ${theme === "dark"
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30"
                : "bg-blue-600 text-white hover:bg-blue-700"}`}
            >
              Access Dashboard
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              className={`px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-lg ${theme === "dark"
                ? "border-gray-700 text-white hover:bg-gray-900/50"
                : "border-gray-300 text-slate-900 hover:bg-gray-50"}`}
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid - 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-12 sm:mt-16">
          {[
            {
              icon: Activity,
              number: "01",
              title: "Real-Time Market Data",
              description: "Live price feeds and instant updates across all Deriv markets with microsecond precision"
            },
            {
              icon: BarChart3,
              number: "02",
              title: "Advanced Analytics",
              description: "Comprehensive digit distribution, pattern recognition, and statistical analysis tools"
            },
            {
              icon: Zap,
              number: "03",
              title: "Smart Trading Signals",
              description: "AI-powered signals for even-odd, matches, rises, and falls with confidence scores"
            }
          ].map((feature, idx) => {
            const Icon = feature.icon
            return (
              <div
                key={idx}
                className={`group p-6 sm:p-8 rounded-xl border transition-all duration-300 ${theme === "dark"
                  ? "border-gray-800 bg-gray-900/30 hover:bg-gray-900/60 hover:border-blue-500/30"
                  : "border-gray-200 bg-gray-50/50 hover:bg-gray-100 hover:border-blue-400"}`}
              >
                <div className={`text-sm sm:text-base font-bold mb-3 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>
                  {feature.number}
                </div>
                <Icon className={`w-8 h-8 sm:w-10 sm:h-10 mb-4 transition-all ${theme === "dark" ? "text-blue-500 group-hover:text-blue-400" : "text-blue-600 group-hover:text-blue-700"}`} />
                <h3 className={`text-lg sm:text-xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                  {feature.title}
                </h3>
                <p className={`text-sm sm:text-base leading-relaxed ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-12 sm:mt-16 pt-12 sm:pt-16 border-t"
          style={{borderColor: theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}}>
          {[
            { label: "Active Markets", value: "24/7" },
            { label: "Data Points", value: "Real-Time" },
            { label: "Accuracy", value: "99.9%" },
            { label: "Uptime", value: "Industry Best" }
          ].map((stat, idx) => (
            <div key={idx} className="text-center">
              <div className={`text-xl sm:text-2xl font-bold ${theme === "dark" ? "text-blue-500" : "text-blue-600"}`}>
                {stat.value}
              </div>
              <p className={`text-xs sm:text-sm mt-1 ${theme === "dark" ? "text-gray-500" : "text-gray-600"}`}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
