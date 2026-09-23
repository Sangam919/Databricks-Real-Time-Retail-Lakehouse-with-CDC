"use client"
import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("http://localhost:8000/api/v1/orders?limit=50")
      .then(res => res.json())
      .then(data => {
        setOrders(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Orders Ledger</h2>
      <p className="text-muted-foreground">Full ledger of recent orders processed through the Medallion architecture.</p>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={5}>Loading...</TableCell></TableRow> : 
             orders.map((order, i) => (
              <TableRow key={i}>
                <TableCell className="font-mono text-xs">{order.order_id}</TableCell>
                <TableCell className="font-medium">{order.customer_name}</TableCell>
                <TableCell>{new Date(order.order_ts).toLocaleString()}</TableCell>
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
      </div>
    </div>
  )
}
