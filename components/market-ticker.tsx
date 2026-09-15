'use client'

import { useState, useEffect } from 'react'
import { initialMarketPrices } from '@/lib/shipments-data'
import { ShieldCheck, TrendingUp, TrendingDown, Radio } from 'lucide-react'

export function MarketTicker() {
  const [prices, setPrices] = useState(initialMarketPrices)
  const [lastTick, setLastTick] = useState('14s ago')

  // Subtle real-time simulation of live spot ticks
  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prev =>
        prev.map(item => {
          const delta = (Math.random() - 0.48) * (item.price * 0.0003)
          const newPrice = Number((item.price + delta).toFixed(2))
          return {
            ...item,
            price: newPrice,
          }
        })
      )
      setLastTick('Just now')
      const timeout = setTimeout(() => setLastTick('12s ago'), 2500)
      return () => clearTimeout(timeout)
    }, 8000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="border-b border-border/80 bg-foreground text-background text-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
        {/* Left: Live Market Spot Rates */}
        <div className="flex items-center gap-5 overflow-x-auto py-0.5 scrollbar-none">
          <div className="flex items-center gap-1.5 font-semibold tracking-wider uppercase text-[10px] text-primary shrink-0">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            LBMA / NYMEX Spot
          </div>

          <div className="flex items-center gap-4 shrink-0 font-mono text-[11px]">
            {prices.map(p => {
              const isPositive = p.changePercent >= 0
              return (
                <div key={p.symbol} className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="text-background/60">{p.symbol}:</span>
                  <span className="font-semibold text-background">
                    ${p.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span
                    className={`inline-flex items-center text-[10px] ${
                      isPositive ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isPositive ? <TrendingUp size={11} className="mr-0.5" /> : <TrendingDown size={11} className="mr-0.5" />}
                    {isPositive ? '+' : ''}{p.changePercent}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Security & Network Telemetry Status */}
        <div className="hidden items-center gap-4 lg:flex shrink-0 text-[11px] text-background/70">
          <div className="flex items-center gap-1.5">
            <Radio size={12} className="text-primary animate-pulse" />
            <span>Telemetry Link: <strong className="text-background font-medium">Geneva HQ Synced</strong></span>
          </div>
          <span className="text-background/20">|</span>
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>Corridors: <strong className="text-emerald-400 font-medium">All Secure</strong></span>
          </div>
        </div>
      </div>
    </div>
  )
}
