"use client"
import { useEffect, useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { generateOrders } from "@/lib/mock-data"

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 15

  useEffect(() => {
    // Try to fetch real data, fallback to mock data
    fetch("http://localhost:8000/api/v1/orders?limit=1000")
      .then(res => {
        if (!res.ok) throw new Error("Backend not available")
        return res.json()
      })
      .then(data => {
        setOrders(data)
        setLoading(false)
      })
      .catch(() => {
        // Fallback to 1000 items of generated mock data
        setOrders(generateOrders(1000))
        setLoading(false)
      })
  }, [])

  const filteredOrders = useMemo(() => {
    return orders.filter(o => 
      o.order_id.toLowerCase().includes(search.toLowerCase()) || 
      o.customer_name.toLowerCase().includes(search.toLowerCase())
    )
  }, [orders, search])

  const totalPages = Math.ceil(filteredOrders.length / pageSize)
  const paginatedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Orders Ledger</h2>
          <p className="text-muted-foreground">Full ledger of recent orders processed through the Medallion architecture.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search orders or customers..."
            className="pl-8 transition-all focus:w-full"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>
      
      <div className="border rounded-md bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell></TableRow>
            ) : paginatedOrders.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No orders found.</TableCell></TableRow>
            ) : (
             paginatedOrders.map((order, i) => (
              <TableRow key={i} className="group hover:bg-muted/50 transition-colors cursor-pointer">
                <TableCell className="font-mono text-xs group-hover:text-primary transition-colors">{order.order_id}</TableCell>
                <TableCell className="font-medium">{order.customer_name}</TableCell>
                <TableCell className="text-muted-foreground">{new Date(order.order_ts).toLocaleString()}</TableCell>
                <TableCell>
                  <Badge 
                    variant={order.status === 'SHIPPED' || order.status === 'DELIVERED' ? 'default' : 
                            order.status === 'CANCELLED' ? 'destructive' : 'secondary'}
                    className="transition-transform group-hover:scale-105"
                  >
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">${order.order_amount?.toFixed(2)}</TableCell>
              </TableRow>
            )))}
          </TableBody>
        </Table>
      </div>

      {!loading && filteredOrders.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(page * pageSize, filteredOrders.length)}</span> of <span className="font-medium">{filteredOrders.length}</span> results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="transition-all hover:bg-primary hover:text-primary-foreground"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="transition-all hover:bg-primary hover:text-primary-foreground"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
