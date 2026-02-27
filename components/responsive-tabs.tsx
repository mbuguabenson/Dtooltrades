"use client"

import React from "react"
import { TabsList } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ResponsiveTabsProps {
  children: React.ReactNode
  theme?: "light" | "dark"
  value?: string
  onValueChange?: (value: string) => void
}

export function ResponsiveTabs({ children, theme = "dark", value, onValueChange }: ResponsiveTabsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)
  const [internalSelectedTab, setInternalSelectedTab] = React.useState<string>("smart-analysis")

  // Use controlled value if provided, otherwise fallback to internal state
  const selectedTab = value !== undefined ? value : internalSelectedTab
  const setSelectedTab = onValueChange !== undefined ? onValueChange : setInternalSelectedTab

  const tabsListRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    // Only need observer if we're not fully controlled and want to sync with DOM state
    if (value !== undefined) return

    const updateActiveTab = () => {
      const context = tabsListRef.current || document
      const activeTrigger = context.querySelector('[role="tab"][data-state="active"]')
      if (activeTrigger) {
        const tabValue = activeTrigger.getAttribute("data-value") || activeTrigger.getAttribute("value")
        if (tabValue && tabValue !== selectedTab) {
          setSelectedTab(tabValue)
        }
      }
    }

    updateActiveTab()

    const tabsList = tabsListRef.current
    if (tabsList) {
      const observer = new MutationObserver(updateActiveTab)
      observer.observe(tabsList, {
        attributes: true,
        subtree: true,
        attributeFilter: ["data-state"],
      })
      return () => observer.disconnect()
    }
  }, [selectedTab, value, setSelectedTab])

  const handleTabClick = (tabValue: string) => {
    console.log("[v0] Dropdown tab selected:", tabValue)
    setSelectedTab(tabValue)
    setIsDropdownOpen(false)

    // For controlled state, the click isn't strictly necessary as the parent will update
    // But we still do it to ensure any standard Radix behaviors are triggered
    const context = tabsListRef.current || document
    const tabTrigger = (
      context.querySelector(`[role="tab"][data-value="${tabValue}"]`) ||
      context.querySelector(`[role="tab"][value="${tabValue}"]`)
    ) as HTMLElement

    if (tabTrigger) {
      console.log("[v0] Clicking tab trigger for:", tabValue)
      tabTrigger.click()
    } else {
      // Final attempt: fallback to standard button with data-value
      const fallbackTrigger = document.querySelector(`button[data-value="${tabValue}"]`) as HTMLElement
      if (fallbackTrigger) {
        fallbackTrigger.click()
      }
    }
  }

  const getTabLabel = (value: string) => {
    const child = React.Children.toArray(children).find((c) => React.isValidElement(c) && (c.props as any).value === value)
    if (React.isValidElement(child)) {
      return (child.props as any).children || value.replace(/-/g, " ")
    }
    return value.replace(/-/g, " ")
  }

  return (
    <TabsList
      ref={tabsListRef}
      className={`flex w-full justify-start bg-transparent border-0 h-auto p-1 overflow-x-auto flex-nowrap scrollbar-none sm:scrollbar-thin scrollbar-thumb-emerald-500/50 hover:scrollbar-thumb-emerald-500/70 scrollbar-track-transparent ${theme === "dark" ? "" : ""
        }`}
    >
      {children}
    </TabsList>
  )
}
