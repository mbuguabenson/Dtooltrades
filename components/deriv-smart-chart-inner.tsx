"use client"
import "@/lib/react-19-shim"
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'

import classNames from 'classnames'
import { ChartTitle, SmartChart, setSmartChartsPublicPath } from '@deriv-com/smartcharts-champion'
import '@deriv-com/smartcharts-champion/dist/smartcharts.css'
import { derivWebSocket } from '@/lib/deriv-websocket-manager'
import { chartWebSocket } from '@/lib/chart-websocket-manager'

// Initialize the path where SmartCharts expects its fonts and binary shaders to live
if (typeof window !== 'undefined') {
  setSmartChartsPublicPath('/assets/')
}

// --- REACT 19 COMPATIBILITY PATCH FOR SMARTCHARTS ---
// SmartCharts bundles an older React 18 JSX runtime that creates legacy elements.
// React 19 strictly rejects these with "A React Element from an older version of React".
// We intercept its render output and upgrade the elements at runtime.
const upgradeLegacyElements = (node: any): any => {
  if (!node || typeof node !== 'object') return node;
  if (Array.isArray(node)) return node.map(upgradeLegacyElements);

  const LEGACY_SYMBOL = Symbol.for('react.element');
  const MODERN_SYMBOL = Symbol.for('react.transitional.element');

  if (node.$$typeof === LEGACY_SYMBOL || node.$$typeof === MODERN_SYMBOL) {
     const newNode = { ...node, $$typeof: MODERN_SYMBOL };
     if (newNode.props) {
        newNode.props = { ...newNode.props };
        if (newNode.props.children) {
           newNode.props.children = upgradeLegacyElements(newNode.props.children);
        }
     }
     return newNode;
  }
  return node;
}

if (typeof window !== 'undefined' && SmartChart) {
   // Patch Class component render
   if (SmartChart.prototype && SmartChart.prototype.render) {
      const originalRender = SmartChart.prototype.render;
      SmartChart.prototype.render = function() {
         return upgradeLegacyElements(originalRender.call(this));
      };
   } 
   // Patch Function component
   else if (typeof SmartChart === 'function') {
      const OriginalSmartChart = SmartChart as any;
      (window as any).PatchedSmartChart = function(props: any) {
         return upgradeLegacyElements(OriginalSmartChart(props));
      };
   }
}

const ActiveSmartChart = (typeof window !== 'undefined' && (window as any).PatchedSmartChart) 
  ? (window as any).PatchedSmartChart 
  : SmartChart;
// ---------------------------------------------------

interface DerivSmartChartProps {
  symbol: string
  theme?: "light" | "dark"
  className?: string
  isMobile?: boolean
  hideToolbar?: boolean
  granularity?: number
  onSymbolChange?: (symbol: string) => void
}

export default function DerivSmartChartInner({ 
  symbol, 
  theme = "dark", 
  className,
  isMobile = false,
  hideToolbar = false,
  granularity: initialGranularity = 0,
  onSymbolChange,
}: DerivSmartChartProps) {
  const [activeSymbols, setActiveSymbols] = useState<any[]>([])
  const [isConnectionOpened, setIsConnectionOpened] = useState(false)
  const [chartType, setChartType] = useState('line')
  const [granularity, setGranularity] = useState(initialGranularity)
  const [isEngineReady, setIsEngineReady] = useState(false)

  // Sync granularity prop with local state
  useEffect(() => {
    setGranularity(initialGranularity)
  }, [initialGranularity])

  // Subscriptions tracking
  const subscriptionHandlersRef = useRef<Map<string, (msg: any) => void>>(new Map())
  const subscriptionIdsRef = useRef<Record<string, string>>({})

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      // 1. Ensure dedicated connection is ready
      await chartWebSocket.connect()
      if (!isMounted) return

      setIsConnectionOpened(true)

      // 2. Load active symbols (Metadata is shared but fetched independently for robustness)
      const symbols = await derivWebSocket.getActiveSymbols()
      if (isMounted && symbols && symbols.length > 0) {
        setActiveSymbols(symbols)
        // Ensure state is synced before starting engine
        setTimeout(() => {
           if (isMounted) setIsEngineReady(true)
        }, 300)
      }
    }

    init()

    return () => {
      isMounted = false
      // Cleanup any dangling streams started by this chart instance
      subscriptionHandlersRef.current.forEach((handler, id) => {
        chartWebSocket.send({ forget: id })
      })
      subscriptionHandlersRef.current.clear()
    }
  }, [])

  // SmartChart request callbacks
  const requestAPI = async (req: any) => {
    const requestType = Object.keys(req)[0]
    
    // Intercept metadata requests for instant response
    if (requestType === 'active_symbols') {
      return { active_symbols: activeSymbols }
    }
    
    if (requestType === 'trading_times') {
      const now = new Date()
      return { 
        trading_times: { 
          markets: [], 
          date: now.toISOString().split('T')[0] 
        } 
      }
    }

    if (requestType === 'asset_index') {
      return { asset_index: [] }
    }

    try {
      return await chartWebSocket.sendAndWait(req)
    } catch (e) {
      console.error("[ChartAPI] requestAPI error:", e)
      return { error: e }
    }
  }

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
      const response = await chartWebSocket.sendAndWait(request);
      if (response.error) throw new Error(response.error.message);

      const result: any = {};
      if (response.candles) {
        result.candles = response.candles.map((c: any) => ({
          open: +c.open, high: +c.high, low: +c.low, close: +c.close, epoch: +c.epoch,
        }));
      } else if (response.history) {
        result.history = {
          prices: response.history.prices.map((p: any) => +p),
          times: response.history.times.map((t: any) => +t),
        };
      }
      return result;
    } catch (e) {
      console.error("[ChartAPI] getQuotes error:", e);
      throw e;
    }
  };

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

    const messageHandler = (msg: any) => {
      // Filter out invalid quotes
      if (msg?.tick && (msg.tick.quote === null || msg.tick.quote === undefined || msg.tick.quote === 0)) return;
      
      // Route messages to this subscriber
      if (msg.subscription?.id && msg.subscription.id === subscriptionIdsRef.current[key]) {
         handleResponse(msg);
      } else if ((msg.tick?.symbol === symbol || msg.ohlc?.symbol === symbol) && (!granularity || msg.ohlc?.granularity === granularity)) {
         handleResponse(msg);
      }
    };

    const handleResponse = (response: any) => {
      if (response.subscription?.id) {
        subscriptionIdsRef.current[key] = response.subscription.id;
      }

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

    const unsub = chartWebSocket.onMessage(messageHandler);
    
    chartWebSocket.sendAndWait(subRequest).then(resp => {
      if (resp.subscription?.id) {
        subscriptionIdsRef.current[key] = resp.subscription.id;
        subscriptionHandlersRef.current.set(resp.subscription.id, messageHandler);
      }
    });

    return () => {
       unsub();
       unsubscribeQuotes({ symbol, granularity });
    };
  };

  const unsubscribeQuotes = (request: any) => {
    const { symbol, granularity = 0 } = request;
    const key = `${symbol}-${granularity}`;
    const subId = subscriptionIdsRef.current[key];

    if (subId) {
      chartWebSocket.send({ forget: subId });
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

  const getMarketsOrder = useCallback((active_symbols: any[]) => {
    if (!active_symbols || !Array.isArray(active_symbols)) return []
    return Array.from(new Set(active_symbols.map(s => s?.market).filter(Boolean))).sort()
  }, [])

  const getSubmarketsOrder = useCallback((active_symbols: any[]) => {
    if (!active_symbols || !Array.isArray(active_symbols)) return []
    return Array.from(new Set(active_symbols.map(s => s?.submarket).filter(Boolean))).sort()
  }, [])

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  
  console.log("SMARTCHART_EXPORT_INSPECT:", { 
    type: typeof SmartChart, 
    keys: SmartChart ? Object.keys(SmartChart) : 'null',
    isReactElement: SmartChart && SmartChart.$$typeof ? true : false
  })

  if (!mounted) return null

  return (
    <div className={classNames('w-full h-full min-h-[400px] relative rounded-xl overflow-hidden', className)} dir='ltr'>
      {isEngineReady && activeSymbols.length > 0 && isConnectionOpened ? (
        <ActiveSmartChart
          id={`smartchart-${symbol}`}
          symbol={symbol}
          isMobile={isMobile}
          theme={theme}
          settings={settings}
          chartType={chartType}
          granularity={granularity as any}
          isConnectionOpened={isConnectionOpened}
          requestAPI={requestAPI}
          getQuotes={getQuotes}
          subscribeQuotes={subscribeQuotes}
          unsubscribeQuotes={unsubscribeQuotes}
          getMarketsOrder={getMarketsOrder}
          getSubmarketsOrder={getSubmarketsOrder}
          getSymbolsOrder={(symbols: any[]) => {
            if (!symbols || !Array.isArray(symbols)) return []
            return [...symbols].sort((a, b) => (a?.display_name || a?.symbol || "").localeCompare(b?.display_name || b?.symbol || ""))
          }}
          chartData={{ activeSymbols }}
          feedCall={{ activeSymbols: false, tradingTimes: false }}
          shouldFetchTradingTimes={false}
          topWidgets={() => hideToolbar ? <></> : <ChartTitle onChange={(s: any) => {
             // SmartCharts might pass an object or a string depending on version
             const nextSymbol = typeof s === 'string' ? s : s?.symbol
             if (nextSymbol && onSymbolChange) onSymbolChange(nextSymbol)
          }} />}
          enabledChartFooter={false}
          chartControlsWidgets={hideToolbar ? () => <></> : undefined}
          barriers={[]}
          isLive
          leftMargin={80}
          showLastDigitStats={false}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0e27]/40 backdrop-blur-sm animate-in fade-in duration-500">
           <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
           <div className="text-blue-400 font-black uppercase tracking-widest text-[10px]">Initializing Neural Chart Engine</div>
           {!isConnectionOpened && <div className="text-amber-500/60 text-[8px] mt-2 uppercase font-bold">Waiting for Dedicated Connection...</div>}
        </div>
      )}
    </div>
  )
}
