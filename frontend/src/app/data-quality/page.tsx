"use client"
import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { generateDataQualityIssues } from "@/lib/mock-data"
import { AlertTriangle, CheckCircle2, ShieldAlert, Activity } from "lucide-react"

export default function DataQuality() {
  const [issues, setIssues] = useState<any[]>([])

  useEffect(() => {
    setIssues(generateDataQualityIssues(40))
  }, [])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Data Quality & Governance</h2>
        <p className="text-muted-foreground mt-1">Monitor DLT expectations, missing records, and invalid values.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Health Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">98.4%</div>
            <p className="text-xs text-muted-foreground">Up +0.2% from last week</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quarantined Records</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground group-hover:text-destructive transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">1,204</div>
            <p className="text-xs text-muted-foreground">Currently in Silver quarantine zone</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground group-hover:text-amber-500 transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{issues.filter(i => i.status === 'OPEN').length}</div>
            <p className="text-xs text-muted-foreground">Rules failing in the last 24h</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Validation Issues</CardTitle>
          <CardDescription>Detailed log of recent data quality rule violations.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Issue ID</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead className="text-center">Failing Records</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.map((issue, i) => (
                  <TableRow key={i} className="group hover:bg-muted/50 transition-colors">
                    <TableCell className="font-mono text-xs">{issue.issue_id}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(issue.timestamp).toLocaleString()}</TableCell>
                    <TableCell className="font-medium text-destructive">{issue.rule_name}</TableCell>
                    <TableCell>
                      <div className="text-sm">{issue.table_name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{issue.column_name}</div>
                    </TableCell>
                    <TableCell className="text-center font-medium">{issue.failing_records}</TableCell>
                    <TableCell className="text-right">
                      <Badge 
                        variant={issue.status === 'RESOLVED' ? 'outline' : 'destructive'}
                        className="transition-transform group-hover:scale-105"
                      >
                        {issue.status === 'RESOLVED' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {issue.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

