"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, BarChart3, ShieldCheck, Zap, TrendingUp, Globe, MousePointer2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-blue-500/30 font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${scrolled ? "bg-[#050505]/80 backdrop-blur-xl border-white/5 py-3" : "bg-transparent border-transparent py-6"}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter">PROFIT<span className="text-blue-500">HUB</span></span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {["Platform", "Markets", "Analytics", "About"].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest">{item}</a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" className="text-xs font-bold uppercase tracking-widest hover:bg-white/5">Console</Button>
            </Link>
            <Link href="/platform">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest px-6 rounded-full shadow-xl shadow-blue-600/20 transition-all hover:scale-105 active:scale-95">
                Launch Terminal
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 blur-[150px] rounded-full -z-10 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 blur-[150px] rounded-full -z-10"></div>

        <div className="max-w-5xl mx-auto text-center space-y-8 relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full animate-bounce">
            <Zap className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Next-Gen Quantum Trading Engine</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-white">
            Precision Trading <br />
            <span className="bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-500 bg-clip-text text-transparent">Reimagined.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-gray-400 text-lg md:text-xl font-medium leading-relaxed">
            Experience the ultimate trading terminal equipped with real-time analytics, automated bots, and professional-grade signaling. Built for the modern trader.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10">
            <Link href="/platform">
              <Button className="h-16 px-10 bg-white text-black hover:bg-gray-200 font-black text-sm uppercase tracking-widest rounded-2xl flex items-center gap-3 transition-all hover:scale-[1.03] active:scale-95 shadow-2xl shadow-white/10 group">
                Start Trading Now
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <button className="h-16 px-10 bg-white/5 border border-white/10 text-white hover:bg-white/10 font-black text-sm uppercase tracking-widest rounded-2xl flex items-center gap-3 transition-all">
              View Markets
              <Globe className="h-5 w-5 text-blue-500" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-20 border-t border-white/5 mt-20">
            {[
              { label: "Execution Speed", value: "24ms" },
              { label: "Global Users", value: "12K+" },
              { label: "Assets Tracked", value: "150+" },
              { label: "Uptime", value: "99.9%" }
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-black text-white mb-1">{stat.value}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section id="platform" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="h-8 w-8 text-blue-500" />,
                title: "Real-time Analytics",
                desc: "Proprietary algorithms scanning market shifts with millisecond precision."
              },
              {
                icon: <ShieldCheck className="h-8 w-8 text-emerald-500" />,
                title: "Safe & Secure",
                desc: "End-to-end encryption with decentralized security protocols for every trade."
              },
              {
                icon: <BarChart3 className="h-8 w-8 text-purple-500" />,
                title: "Visual Intelligence",
                desc: "Transform complex data into actionable insights through stunning interactive charts."
              }
            ].map((feature, i) => (
              <div key={i} className="p-10 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-blue-500/30 transition-all group">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-black text-white mb-4">{feature.title}</h3>
                <p className="text-gray-500 font-medium leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-40 px-6">
        <div className="max-w-4xl mx-auto rounded-[3rem] bg-gradient-to-br from-blue-600 to-indigo-800 p-12 md:p-24 text-center relative overflow-hidden shadow-2xl shadow-blue-500/20">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white">Ready to join the elite?</h2>
            <p className="text-blue-100 text-lg max-w-xl mx-auto">Take control of your financial journey with the most advanced trading platform on the market.</p>
            <Link href="/platform">
              <Button className="h-16 px-12 bg-white text-black hover:bg-gray-100 font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95">
                Enter Trading Floor
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-blue-500" />
            <span className="text-lg font-black tracking-tighter">PROFIT<span className="text-blue-500">HUB</span></span>
          </div>
          <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">© 2026 Profit Hub Quantum Terminal. All rights reserved.</p>
          <div className="flex items-center gap-6">
            {["Twitter", "Discord", "Telegram"].map(social => (
              <a key={social} href="#" className="text-gray-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">{social}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
