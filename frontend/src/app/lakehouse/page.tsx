"use client"
import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Database, RefreshCw, Layers, ShieldCheck, Zap } from "lucide-react"

export default function Lakehouse() {
  const [tables] = useState([
    { name: "bronze_orders", zone: "Bronze", rows: "1.2M", size: "450 MB", optimized: "2 mins ago" },
    { name: "bronze_customers", zone: "Bronze", rows: "45K", size: "12 MB", optimized: "5 mins ago" },
    { name: "silver_orders_cleaned", zone: "Silver", rows: "1.18M", size: "410 MB", optimized: "10 mins ago" },
    { name: "silver_customers_scd2", zone: "Silver", rows: "52K", size: "18 MB", optimized: "12 mins ago" },
    { name: "gold_sales_daily", zone: "Gold", rows: "1.2K", size: "2 MB", optimized: "1 hour ago" },
    { name: "gold_customer_ltv", zone: "Gold", rows: "45K", size: "10 MB", optimized: "1 hour ago" },
  ])

  const [isOptimizing, setIsOptimizing] = useState(false)

  const handleOptimize = () => {
    setIsOptimizing(true)
    setTimeout(() => setIsOptimizing(false), 2000)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Lakehouse Configuration</h2>
          <p className="text-muted-foreground mt-1">Manage Databricks connection strings and Unity Catalog schemas.</p>
        </div>
        <Button 
          onClick={handleOptimize} 
          disabled={isOptimizing}
          className="transition-all hover:scale-105"
        >
          <Zap className={`mr-2 h-4 w-4 ${isOptimizing ? 'animate-spin' : ''}`} />
          {isOptimizing ? 'Optimizing Z-Order...' : 'Optimize Tables'}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-muted-foreground" />
              Databricks Connection
            </CardTitle>
            <CardDescription>Unity Catalog workspace details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Workspace URL</label>
              <Input disabled value="https://adb-123456789.azuredatabricks.net" className="bg-muted/50 font-mono text-xs" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">SQL Warehouse ID</label>
              <Input disabled value="a1b2c3d4e5f6g7h8" className="bg-muted/50 font-mono text-xs" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Catalog Name</label>
              <Input disabled value="retail_lakehouse_prod" className="bg-muted/50 font-mono text-xs" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-muted-foreground" />
              Delta Lake Storage
            </CardTitle>
            <CardDescription>Medallion architecture overview.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Table Name</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tables.map((t, i) => (
                  <TableRow key={i} className="group">
                    <TableCell className="font-medium group-hover:text-primary transition-colors">{t.name}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={
                          t.zone === 'Bronze' ? 'border-amber-700/50 text-amber-700 bg-amber-700/10' :
                          t.zone === 'Silver' ? 'border-slate-400/50 text-slate-600 bg-slate-400/10' :
                          'border-yellow-500/50 text-yellow-600 bg-yellow-500/10'
                        }
                      >
                        {t.zone}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs">{t.size}</TableCell>
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

