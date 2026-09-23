"use client"
import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Database, FileJson, Server } from "lucide-react"
import { generateCDCEvents } from "@/lib/mock-data"

export default function CDCMonitor() {
  const [events, setEvents] = useState<any[]>([])
  const [stats, setStats] = useState({ inserts: 0, updates: 0, deletes: 0 })

  useEffect(() => {
    // Initial load
    const initialEvents = generateCDCEvents(15)
    setEvents(initialEvents)
    
    // Simulate incoming events
    const interval = setInterval(() => {
      const newEvent = generateCDCEvents(1)[0]
      newEvent.timestamp = new Date().toISOString() // Fresh timestamp
      
      setEvents(prev => {
        const updated = [newEvent, ...prev].slice(0, 50) // Keep last 50
        return updated
      })

      setStats(prev => ({
        ...prev,
        inserts: newEvent.operation === 'INSERT' ? prev.inserts + 1 : prev.inserts,
        updates: newEvent.operation === 'UPDATE' ? prev.updates + 1 : prev.updates,
        deletes: newEvent.operation === 'DELETE' ? prev.deletes + 1 : prev.deletes,
      }))
    }, 1500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Activity className="h-8 w-8 text-blue-500 animate-pulse" />
          CDC Live Monitor
        </h2>
        <p className="text-muted-foreground mt-1">Real-time Debezium Change Data Capture stream directly from the source databases into the Lakehouse.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stream Status</CardTitle>
            <Server className="h-4 w-4 text-green-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">CONNECTED</div>
            <p className="text-xs text-muted-foreground">Debezium Kafka Connect</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inserts</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.inserts}</div>
            <p className="text-xs text-muted-foreground">Since page load</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Updates</CardTitle>
            <FileJson className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">~{stats.updates}</div>
            <p className="text-xs text-muted-foreground">Since page load</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deletes</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">-{stats.deletes}</div>
            <p className="text-xs text-muted-foreground">Since page load</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-ping"></div>
            Live Event Stream
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead>Event ID</TableHead>
                  <TableHead>Operation</TableHead>
                  <TableHead>Target Table</TableHead>
                  <TableHead className="text-right">Payload Size</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((evt, i) => (
                  <TableRow 
                    key={evt.event_id} 
                    className={`transition-all duration-500 ${i === 0 ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
                  >
                    <TableCell className="text-muted-foreground text-xs font-mono">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit', fractionalSecondDigits: 3 })}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{evt.event_id}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={evt.operation === 'INSERT' ? 'default' : evt.operation === 'DELETE' ? 'destructive' : 'secondary'}
                        className={`${i === 0 ? 'animate-bounce' : ''}`}
                      >
                        {evt.operation}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{evt.table}</TableCell>
                    <TableCell className="text-right text-xs font-mono">{evt.payload_size} bytes</TableCell>
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
