"use client"
import { useState, useMemo, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ChevronLeft, ChevronRight, Package2 } from "lucide-react"
import { generateProducts } from "@/lib/mock-data"

export default function Products() {
  const [products, setProducts] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 15

  useEffect(() => {
    // Simulate loading
    setProducts(generateProducts(500))
  }, [])

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.product_id.toLowerCase().includes(search.toLowerCase())
    )
  }, [products, search])

  const totalPages = Math.ceil(filteredProducts.length / pageSize)
  const paginatedProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">View the latest state of the product catalog (SCD Type 1).</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products or SKUs..."
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
              <TableHead>Product / SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock Level</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No products found.</TableCell></TableRow>
            ) : (
             paginatedProducts.map((prod, i) => (
              <TableRow key={i} className="group hover:bg-muted/50 transition-colors cursor-pointer">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-md group-hover:bg-primary/10 transition-colors">
                      <Package2 className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{prod.name}</div>
                      <div className="text-xs font-mono text-muted-foreground group-hover:text-primary transition-colors">{prod.sku}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="group-hover:bg-primary/10 transition-colors">
                    {prod.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">${prod.price?.toFixed(2)}</TableCell>
                <TableCell className="text-right font-medium">{prod.stock_level}</TableCell>
                <TableCell className="text-center">
                  <Badge 
                    variant={prod.stock_level > prod.reorder_point ? 'default' : prod.stock_level === 0 ? 'destructive' : 'secondary'}
                    className={`transition-transform group-hover:scale-105 ${prod.stock_level > prod.reorder_point ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  >
                    {prod.stock_level > prod.reorder_point ? "In Stock" : prod.stock_level === 0 ? "Out of Stock" : "Low Stock"}
                  </Badge>
                </TableCell>
              </TableRow>
            )))}
          </TableBody>
        </Table>
      </div>

      {filteredProducts.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(page * pageSize, filteredProducts.length)}</span> of <span className="font-medium">{filteredProducts.length}</span> results
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
