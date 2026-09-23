"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Activity, DollarSign, Users, ShoppingCart, ArrowUpRight, ArrowDownRight } from "lucide-react"

export default function RealTimeAnalytics() {
  const [metrics, setMetrics] = useState({
    activeUsers: 1240,
    salesPerMinute: 450.50,
    conversionRate: 3.2,
    cartAbandonment: 65.4,
  })
  
  const [chartData, setChartData] = useState<number[]>(Array(24).fill(0).map(() => Math.floor(Math.random() * 100)))

  useEffect(() => {
    const interval = setInterval(() => {
      // Fluctuate metrics slightly
      setMetrics(prev => ({
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 10 - 4),
        salesPerMinute: Math.max(100, prev.salesPerMinute + (Math.random() * 20 - 9)),
        conversionRate: Math.max(1.0, Math.min(10.0, prev.conversionRate + (Math.random() * 0.2 - 0.1))),
        cartAbandonment: Math.max(20, Math.min(90, prev.cartAbandonment + (Math.random() * 1.0 - 0.5))),
      }))
      
      // Tick chart data
      setChartData(prev => {
        const newData = [...prev.slice(1), Math.floor(Math.random() * 100)]
        return newData
      })
    }, 2000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Activity className="h-8 w-8 text-primary animate-pulse" />
          Real-Time Analytics
        </h2>
        <p className="text-muted-foreground mt-1">Live streaming KPIs powered by Spark Structured Streaming & Delta Live Tables.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users Right Now</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono tracking-tight">{metrics.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center text-green-500">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +14% from last hour
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales / Minute</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono tracking-tight text-green-600">
              ${metrics.salesPerMinute.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center text-green-500">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              Trending up
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Conversion Rate</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono tracking-tight text-primary">
              {metrics.conversionRate.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center text-amber-500">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              -0.4% baseline
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cart Abandonment</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono tracking-tight text-destructive">
              {metrics.cartAbandonment.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center text-red-500">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              Needs attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Traffic Velocity (Requests / Sec)</CardTitle>
          <CardDescription>Streaming directly from Kafka into Bronze tables.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full flex items-end justify-between gap-1 mt-4 px-2">
            {chartData.map((val, i) => (
              <div 
                key={i} 
                className="w-full bg-primary/20 hover:bg-primary transition-all duration-300 rounded-t-sm relative group"
                style={{ height: `${val}%` }}
              >
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs p-1 rounded shadow-md transition-opacity">
                  {val * 12} r/s
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2 px-2">
            <span>-24s ago</span>
            <span>Now</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

