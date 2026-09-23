-- ============================================================================
-- Databricks SQL Dashboard Queries
-- These queries back the Lakeview AI/BI Dashboard
-- ============================================================================

-- USE CATALOG retail_lakehouse;

-- 1. KPI: Total Revenue Today
SELECT sum(total_revenue) as Revenue 
FROM gold.fact_daily_sales 
WHERE date_key = current_date();

-- 2. KPI: Orders Today
SELECT sum(total_orders) as Orders 
FROM gold.fact_daily_sales 
WHERE date_key = current_date();

-- 3. KPI: Average Order Value
SELECT sum(total_revenue) / sum(total_orders) as AOV 
FROM gold.fact_daily_sales 
WHERE date_key = current_date();

-- 4. KPI: Active Customers (Last 30 days)
SELECT count(distinct customer_key) as Active_Customers 
FROM gold.fact_orders 
WHERE order_date >= current_date() - interval 30 days;

-- 5. Time Series: Revenue per hour (Last 24h)
SELECT 
  date_trunc('hour', order_ts) as hour,
  sum(order_amount) as revenue
FROM gold.fact_orders
WHERE order_ts >= current_timestamp() - interval 24 hours
GROUP BY 1
ORDER BY 1;

-- 6. Bar Chart: Top 10 Products by Revenue (All Time)
SELECT 
  p.name as product_name,
  sum(o.order_amount) as total_revenue
FROM gold.fact_orders o
JOIN gold.dim_products p ON o.product_key = p.product_key
GROUP BY 1
ORDER BY 2 DESC
LIMIT 10;

-- 7. Table: Recent 50 Orders with Customer Names
SELECT 
  o.order_id,
  o.order_ts,
  c.name as customer_name,
  o.order_amount,
  o.status
FROM gold.fact_orders o
JOIN gold.dim_customers c ON o.customer_key = c.customer_key
ORDER BY o.order_ts DESC
LIMIT 50;

-- 8. Map: Revenue by Region
SELECT 
  region,
  sum(total_revenue) as revenue
FROM gold.fact_daily_sales
GROUP BY region;

-- 9. Real-time Alerts: Quality + Freshness
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
LIMIT 5;
