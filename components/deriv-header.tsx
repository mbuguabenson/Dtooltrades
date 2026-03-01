"use client"

import { Button } from "@/components/ui/button"
import { DERIV_CONFIG } from "@/lib/deriv-config"

interface DerivTab {
  id: string
  name: string
  url: string
}

const tabs: DerivTab[] = [
  { id: "trader", name: "DTrader", url: `https://app.deriv.com/dtrader?app_id=${DERIV_CONFIG.APP_ID}` },
  { id: "smarttrader", name: "SmartTrader", url: `https://smarttrader.deriv.com?app_id=${DERIV_CONFIG.APP_ID}` },
  {
    id: "copytrading",
    name: "Copy Trading",
    url: `https://app.deriv.com/appstore/traders-hub?app_id=${DERIV_CONFIG.APP_ID}`,
  },
]

interface DerivHeaderProps {
  activeTab: DerivTab
  setActiveTab: (tab: DerivTab) => void
  theme?: "light" | "dark"
}

export function DerivHeader({ activeTab, setActiveTab, theme = "dark" }: DerivHeaderProps) {
  return (
    <div
      className={`flex space-x-2 px-4 py-3 border-b ${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
        }`}
    >
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          onClick={() => setActiveTab(tab)}
          className={`px-6 py-2 rounded-full font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 duration-200 ${activeTab.id === tab.id
            ? "gradient-blue-indigo text-white shadow-blue-500/30"
            : theme === "dark"
              ? "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300"
            }`}
        >
          {tab.name}
        </Button>
      ))}
    </div>
  )
}

export { tabs }
export type { DerivTab }
