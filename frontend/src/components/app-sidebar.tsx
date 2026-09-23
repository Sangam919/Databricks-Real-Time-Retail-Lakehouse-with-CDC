"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { Home, Activity, ListOrdered, Users, Package, Database, Shield, LayoutDashboard } from "lucide-react"

const items = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Real-Time Analytics",
    url: "/real-time-analytics",
    icon: Activity,
  },
  {
    title: "CDC Monitor",
    url: "/cdc-monitor",
    icon: LayoutDashboard,
  },
  {
    title: "Orders",
    url: "/orders",
    icon: ListOrdered,
  },
  {
    title: "Customers",
    url: "/customers",
    icon: Users,
  },
  {
    title: "Products",
    url: "/products",
    icon: Package,
  },
  {
    title: "Data Quality",
    url: "/data-quality",
    icon: Shield,
  },
  {
    title: "Lakehouse Configuration",
    url: "/lakehouse",
    icon: Database,
  },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Database className="w-6 h-6 text-blue-600" />
          <span className="font-bold text-lg">Retail Lakehouse</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton render={<a href={item.url} />}>
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
