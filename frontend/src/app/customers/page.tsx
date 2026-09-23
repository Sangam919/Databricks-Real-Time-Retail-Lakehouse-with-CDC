"use client"
import { useState, useMemo, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ChevronLeft, ChevronRight, UserCircle } from "lucide-react"
import { generateCustomers } from "@/lib/mock-data"

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 15

  useEffect(() => {
    // Simulate loading
    setCustomers(generateCustomers(1000))
  }, [])

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.customer_id.toLowerCase().includes(search.toLowerCase())
    )
  }, [customers, search])

  const totalPages = Math.ceil(filteredCustomers.length / pageSize)
  const paginatedCustomers = filteredCustomers.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
          <p className="text-muted-foreground">Historical customer dimensions and active profiles (SCD Type 2).</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search customers..."
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
              <TableHead>Customer ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Segment</TableHead>
              <TableHead>Valid Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">LTV</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCustomers.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No customers found.</TableCell></TableRow>
            ) : (
             paginatedCustomers.map((cust, i) => (
              <TableRow key={i} className="group hover:bg-muted/50 transition-colors cursor-pointer">
                <TableCell className="font-mono text-xs group-hover:text-primary transition-colors">{cust.customer_id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div>
                      <div className="font-medium">{cust.name}</div>
                      <div className="text-xs text-muted-foreground">{cust.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="group-hover:bg-primary/10 transition-colors">
                    {cust.segment}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {cust.valid_from} &rarr; {cust.valid_to === "9999-12-31" ? "Present" : cust.valid_to}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={cust.is_current ? 'default' : 'secondary'}
                    className={`transition-transform group-hover:scale-105 ${cust.is_current ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  >
                    {cust.is_current ? "Active" : "Historical"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">${cust.lifetime_value?.toFixed(2)}</TableCell>
              </TableRow>
            )))}
          </TableBody>
        </Table>
      </div>

      {filteredCustomers.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(page * pageSize, filteredCustomers.length)}</span> of <span className="font-medium">{filteredCustomers.length}</span> results
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
