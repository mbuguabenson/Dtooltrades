"use client"

import dynamic from 'next/dynamic'

// Dynamically import the inner chart wrapper with SSR disabled
// This prevents "self is not defined" because deriv-charts expects a browser environment (window, self, document)
const DerivSmartChartInner = dynamic(
  () => import('./deriv-smart-chart-inner'),
  { ssr: false }
)

interface DerivSmartChartProps {
  symbol: string
  theme?: "light" | "dark"
  className?: string
  isMobile?: boolean
  hideToolbar?: boolean
}

export function DerivSmartChart(props: DerivSmartChartProps) {
  return <DerivSmartChartInner {...props} />
}
