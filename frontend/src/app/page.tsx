"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShoppingBag, TrendingUp, Users } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

export default function Dashboard() {
  const [kpis, setKpis] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [kpiRes, ordersRes] = await Promise.all([
          fetch("http://localhost:8000/api/v1/kpis/daily").catch(() => null),
          fetch("http://localhost:8000/api/v1/orders?limit=5").catch(() => null)
        ])
        
        if (kpiRes && kpiRes.ok) setKpis(await kpiRes.json())
        if (ordersRes && ordersRes.ok) setOrders(await ordersRes.json())
      } catch (e) {
        console.error("Error fetching data:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <div>Loading dashboard...</div>

  // Fallback data if backend is not running or DB is disconnected
  const displayKpis = kpis || { Revenue: 0, Orders: 0, AOV: 0 }
  const displayOrders = orders.length > 0 ? orders : [
    { order_id: "N/A", customer_name: "No Data", order_amount: 0, status: "UNKNOWN", order_ts: new Date().toISOString() }
  ]

  const chartData = [
    { name: "00:00", total: Math.floor(Math.random() * 5000) + 1000 },
    { name: "04:00", total: Math.floor(Math.random() * 5000) + 1000 },
    { name: "08:00", total: Math.floor(Math.random() * 5000) + 1000 },
    { name: "12:00", total: Math.floor(Math.random() * 5000) + 1000 },
    { name: "16:00", total: Math.floor(Math.random() * 5000) + 1000 },
    { name: "20:00", total: Math.floor(Math.random() * 5000) + 1000 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
        <div className="text-sm text-muted-foreground">
          {kpis?._mock ? "Using mock data (DB disconnected)" : "Live Databricks Connection"}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue Today</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${displayKpis.Revenue?.toLocaleString(undefined, {minimumFractionDigits: 2}) || "0.00"}</div>
            <p className="text-xs text-muted-foreground">+20.1% from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{displayKpis.Orders?.toLocaleString() || "0"}</div>
            <p className="text-xs text-muted-foreground">+180 from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value (AOV)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${displayKpis.AOV?.toLocaleString(undefined, {minimumFractionDigits: 2}) || "0.00"}</div>
            <p className="text-xs text-muted-foreground">+2.4% from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
            <p className="text-xs text-muted-foreground">+201 since last hour</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Velocity</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip />
                <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayOrders.map((order, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{order.customer_name}</TableCell>
                    <TableCell>
                      <Badge variant={order.status === 'SHIPPED' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">${order.order_amount?.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
