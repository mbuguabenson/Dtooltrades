"use client"

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import classNames from 'classnames'
import { ChartTitle, SmartChart, setSmartChartsPublicPath } from '@deriv/deriv-charts'
import '@deriv/deriv-charts/dist/smartcharts.css'
import { derivWebSocket } from '@/lib/deriv-websocket-manager'

// Initialize the path where SmartCharts expects its fonts and binary shaders to live
if (typeof window !== 'undefined') {
  setSmartChartsPublicPath('/assets/')
}

interface DerivSmartChartProps {
  symbol: string
  theme?: "light" | "dark"
  className?: string
  isMobile?: boolean
  hideToolbar?: boolean
}

export default function DerivSmartChartInner({ 
  symbol, 
  theme = "dark", 
  className,
  isMobile = false,
  hideToolbar = false
}: DerivSmartChartProps) {
  const [activeSymbols, setActiveSymbols] = useState<any[]>([])
  const [isConnectionOpened, setIsConnectionOpened] = useState(derivWebSocket.isConnected())
  const [chartType, setChartType] = useState('line')
  const [granularity, setGranularity] = useState(0)

  // Subscriptions tracking: map of subscription_id -> wildcard message handler for cleanup
  const subscriptionHandlersRef = useRef<Map<string, (msg: any) => void>>(new Map())
  // Track subscription tags (symbol-granularity) to subscription IDs
  const subscriptionIdsRef = useRef<Record<string, string>>({})

  useEffect(() => {
    // Sync connection status
    const unsubStatus = derivWebSocket.onConnectionStatus((status) => {
      setIsConnectionOpened(status === "connected")
    })
    setIsConnectionOpened(derivWebSocket.isConnected())

    // Load active symbols
    derivWebSocket.getActiveSymbols().then((symbols) => {
      setActiveSymbols(symbols)
    })

    return () => {
      unsubStatus()
      // Cleanup any dangling streams started by this chart instance
      subscriptionHandlersRef.current.forEach((handler, id) => {
        derivWebSocket.off("*", handler)
        derivWebSocket.send({ forget: id })
      })
      subscriptionHandlersRef.current.clear()
    }
  }, [])

  // SmartChart request callbacks (Champion Pattern)
  const requestAPI = async (req: any) => {
    try {
      return await derivWebSocket.sendAndWait(req, 15000)
    } catch (e) {
      console.error("[SmartChart] requestAPI error:", e)
      return { error: e }
    }
  }

  // getQuotes: Fetch historical data (Champion Pattern)
  const getQuotes = async (params: { symbol: string; granularity: number; count: number; start?: number; end?: number }) => {
    const { symbol, granularity, count, start, end } = params;
    
    const request: any = {
      ticks_history: symbol,
      style: granularity ? 'candles' : 'ticks',
      count,
      end: end ? String(end) : 'latest',
      adjust_start_time: 1,
    };

    if (granularity) request.granularity = granularity;
    if (start) request.start = String(start);

    try {
      const response = await derivWebSocket.sendAndWait(request, 15000);
      
      if (response.error) {
        throw new Error(response.error.message || 'Unknown error in tick history');
      }

      // Transform response to TGetQuotesResult format for the chart
      const result: any = {};
      if (response.candles) {
        result.candles = response.candles.map((c: any) => ({
          open: +c.open,
          high: +c.high,
          low: +c.low,
          close: +c.close,
          epoch: +c.epoch,
        }));
      } else if (response.history) {
        result.history = {
          prices: response.history.prices.map((p: any) => +p),
          times: response.history.times.map((t: any) => +t),
        };
      }

      return result;
    } catch (e) {
      console.error("[SmartChart] getQuotes error:", e);
      throw e;
    }
  };

  // subscribeQuotes: Real-time data (Champion Pattern)
  const subscribeQuotes = (request: any, callback: (quote: any) => void) => {
    const { symbol, granularity = 0 } = request;
    const key = `${symbol}-${granularity}`;

    const subRequest = {
      ...request,
      subscribe: 1,
      adjust_start_time: 1,
      count: 1,
      end: 'latest',
    };

    const handleResponse = (response: any) => {
      // Store subscription ID
      if (response.subscription?.id) {
        subscriptionIdsRef.current[key] = response.subscription.id;
      }

      // Convert to TQuote format for the champion library
      if (response.tick) {
        const { tick } = response;
        callback({
          Date: new Date(tick.epoch * 1000).toISOString(),
          Close: tick.quote,
          tick,
          DT: new Date(tick.epoch * 1000),
        });
      } else if (response.ohlc) {
        const { ohlc } = response;
        callback({
          Date: new Date(ohlc.open_time * 1000).toISOString(),
          Open: parseFloat(ohlc.open),
          High: parseFloat(ohlc.high),
          Low: parseFloat(ohlc.low),
          Close: parseFloat(ohlc.close),
          ohlc,
          DT: new Date(ohlc.open_time * 1000),
        });
      }
    };

    // Use wildcard listener to capture the subscription response and subsequent ticks
    const messageHandler = (msg: any) => {
      // Filter out invalid quotes
      if (msg?.tick && (msg.tick.quote === null || msg.tick.quote === undefined || msg.tick.quote === 0)) {
        return;
      }
      
      // Route messages to this subscriber
      // We check if it's the initial subscription response OR a tick/ohlc for the correct symbol
      if (msg.subscription?.id && msg.subscription.id === subscriptionIdsRef.current[key]) {
         handleResponse(msg);
      } else if ((msg.tick?.symbol === symbol || msg.ohlc?.symbol === symbol) && (!granularity || msg.ohlc?.granularity === granularity)) {
         handleResponse(msg);
      }
    };

    derivWebSocket.on("*", messageHandler);
    
    // Trigger the actual subscription
    derivWebSocket.sendAndWait(subRequest).then(resp => {
      if (resp.subscription?.id) {
        subscriptionIdsRef.current[key] = resp.subscription.id;
        subscriptionHandlersRef.current.set(resp.subscription.id, messageHandler);
      }
    });

    return () => {
      unsubscribeQuotes({ symbol, granularity });
    };
  };

  const unsubscribeQuotes = (request: any) => {
    const { symbol, granularity = 0 } = request;
    const key = `${symbol}-${granularity}`;
    const subId = subscriptionIdsRef.current[key];

    if (subId) {
      derivWebSocket.send({ forget: subId });
      const handler = subscriptionHandlersRef.current.get(subId);
      if (handler) {
        derivWebSocket.off("*", handler);
      }
      subscriptionHandlersRef.current.delete(subId);
      delete subscriptionIdsRef.current[key];
    }
  };

  const settings = useMemo(() => ({
    assetInformation: false,
    countdown: true,
    isHighestLowestMarkerEnabled: false,
    language: 'en',
    position: 'bottom',
    theme: theme,
  }), [theme])

  // Provide a safe fallback for market ordering to prevent localeCompare crashes inside deriv-charts
  const getMarketsOrder = useCallback((active_symbols: any[]) => {
    if (!active_symbols || !Array.isArray(active_symbols)) return []
    return active_symbols
      .map(s => s?.market)
      .filter((v, i, a) => v && typeof v === 'string' && a.indexOf(v) === i)
      .sort((a, b) => a.localeCompare(b))
  }, [])

  // Don't render if SSR
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <div className={classNames('w-full h-full min-h-[400px] relative', className)} dir='ltr'>
      {activeSymbols.length > 0 && isConnectionOpened ? (
        <SmartChart
          id={`smartchart-${symbol}`}
          symbol={symbol}
          isMobile={isMobile}
          theme={theme}
          settings={settings}
          chartType={chartType}
          granularity={granularity}
          isConnectionOpened={isConnectionOpened}
          requestAPI={requestAPI}
          getQuotes={getQuotes}
          subscribeQuotes={subscribeQuotes}
          unsubscribeQuotes={unsubscribeQuotes}
          getMarketsOrder={getMarketsOrder}
          chartData={{
            activeSymbols: activeSymbols,
          }}
          topWidgets={() => hideToolbar ? null : <ChartTitle onChange={(s: string) => {}} />}
          enabledChartFooter={false}
          chartControlsWidgets={hideToolbar ? null : undefined}
          barriers={[]}
          isLive
          leftMargin={80}
          showLastDigitStats={false}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 animate-pulse rounded-xl">
           <div className="text-blue-400 font-medium">Initializing Chart Engine...</div>
        </div>
      )}
    </div>
  )
}
