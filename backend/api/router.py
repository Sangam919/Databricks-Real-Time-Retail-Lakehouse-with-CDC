from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from db.databricks import execute_query

router = APIRouter()

@router.get("/kpis/daily")
async def get_daily_kpis():
    """Fetch total revenue, orders, and AOV for today."""
    
    # We combine the 3 KPI queries into one logic, or run them sequentially.
    # For simplicity, we run them sequentially. In production, a single view is better.
    
    query = """
    SELECT 
        sum(total_revenue) as Revenue,
        sum(total_orders) as Orders,
        sum(total_revenue) / sum(total_orders) as AOV
    FROM gold.fact_daily_sales 
    WHERE date_key = current_date()
    """
    
    result = execute_query(query)
    if result is None:
        return {"Revenue": 0, "Orders": 0, "AOV": 0, "_mock": True}
        
    if not result or result[0].get("Revenue") is None:
        return {"Revenue": 0, "Orders": 0, "AOV": 0}
        
    return result[0]


@router.get("/kpis/realtime")
async def get_realtime_kpis():
    """Fetch the latest 5 minutes of velocity/quality KPIs."""
    query = """
    SELECT 
      window_end,
      orders_per_minute,
      revenue_per_minute,
      CASE 
        WHEN orders_per_minute < 5 THEN 'Low Velocity Alert'
        ELSE 'Healthy'
      END as status
    FROM gold.gold_realtime_kpis
    ORDER BY window_end DESC
    LIMIT 5
    """
    result = execute_query(query)
    if result is None:
        return [
            {"window_end": "2024-01-01T10:05:00Z", "orders_per_minute": 10, "revenue_per_minute": 250.0, "status": "Healthy"},
            {"window_end": "2024-01-01T10:04:00Z", "orders_per_minute": 3, "revenue_per_minute": 50.0, "status": "Low Velocity Alert"},
            {"window_end": "2024-01-01T10:03:00Z", "orders_per_minute": 12, "revenue_per_minute": 300.0, "status": "Healthy"}
        ]
    return result


@router.get("/analytics/revenue-by-region")
async def get_revenue_by_region():
    query = """
    SELECT 
      region,
      sum(total_revenue) as revenue
    FROM gold.fact_daily_sales
    GROUP BY region
    """
    result = execute_query(query)
    if result is None:
        return [
            {"region": "NA", "revenue": 15000},
            {"region": "EMEA", "revenue": 8000},
            {"region": "APAC", "revenue": 12000},
            {"region": "LATAM", "revenue": 3000}
        ]
    return result

@router.get("/analytics/top-products")
async def get_top_products():
    query = """
    SELECT 
      p.name as product_name,
      sum(o.order_amount) as total_revenue
    FROM gold.fact_orders o
    JOIN gold.dim_products p ON o.product_key = p.product_key
    GROUP BY 1
    ORDER BY 2 DESC
    LIMIT 10
    """
    result = execute_query(query)
    if result is None:
        return [
            {"product_name": "Premium Laptop", "total_revenue": 50000},
            {"product_name": "Wireless Mouse", "total_revenue": 15000},
            {"product_name": "Mechanical Keyboard", "total_revenue": 12000},
            {"product_name": "USB-C Hub", "total_revenue": 8000}
        ]
    return result

@router.get("/orders")
async def get_recent_orders(limit: int = 50):
    query = f"""
    SELECT 
      o.order_id,
      o.order_ts,
      c.name as customer_name,
      o.order_amount,
      o.status
    FROM gold.fact_orders o
    JOIN gold.dim_customers c ON o.customer_key = c.customer_key
    ORDER BY o.order_ts DESC
    LIMIT {limit}
    """
    result = execute_query(query)
    if result is None:
        return [
            {"order_id": "ORD-123", "order_ts": "2024-01-01T10:00:00Z", "customer_name": "John Doe", "order_amount": 150.0, "status": "PLACED"},
            {"order_id": "ORD-124", "order_ts": "2024-01-01T09:55:00Z", "customer_name": "Jane Smith", "order_amount": 25.5, "status": "SHIPPED"},
            {"order_id": "ORD-125", "order_ts": "2024-01-01T09:45:00Z", "customer_name": "Alice Johnson", "order_amount": 89.99, "status": "DELIVERED"},
            {"order_id": "ORD-126", "order_ts": "2024-01-01T09:40:00Z", "customer_name": "Bob Williams", "order_amount": 210.50, "status": "SHIPPED"},
            {"order_id": "ORD-127", "order_ts": "2024-01-01T09:30:00Z", "customer_name": "Charlie Brown", "order_amount": 15.0, "status": "CANCELLED"},
            {"order_id": "ORD-128", "order_ts": "2024-01-01T09:15:00Z", "customer_name": "Diana Prince", "order_amount": 450.0, "status": "PLACED"},
            {"order_id": "ORD-129", "order_ts": "2024-01-01T09:00:00Z", "customer_name": "Evan Wright", "order_amount": 32.75, "status": "SHIPPED"},
            {"order_id": "ORD-130", "order_ts": "2024-01-01T08:45:00Z", "customer_name": "Fiona Gallagher", "order_amount": 120.0, "status": "DELIVERED"},
            {"order_id": "ORD-131", "order_ts": "2024-01-01T08:30:00Z", "customer_name": "George Miller", "order_amount": 65.25, "status": "SHIPPED"},
            {"order_id": "ORD-132", "order_ts": "2024-01-01T08:15:00Z", "customer_name": "Hannah Abbott", "order_amount": 99.99, "status": "PLACED"},
            {"order_id": "ORD-133", "order_ts": "2024-01-01T08:00:00Z", "customer_name": "Ian Malcolm", "order_amount": 540.0, "status": "DELIVERED"},
            {"order_id": "ORD-134", "order_ts": "2024-01-01T07:45:00Z", "customer_name": "Julia Roberts", "order_amount": 12.50, "status": "SHIPPED"}
        ]
    return result
