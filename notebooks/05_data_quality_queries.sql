-- ============================================================================
-- Data Quality Queries
-- Run these against Databricks SQL Warehouse to monitor pipeline health
-- ============================================================================

-- USE CATALOG retail_lakehouse;
-- USE SCHEMA silver;

-- 1. Row Counts per Layer
SELECT 'bronze_orders' as table_name, count(1) as row_count FROM retail_lakehouse.bronze.bronze_orders
UNION ALL
SELECT 'silver_orders', count(1) FROM retail_lakehouse.silver.silver_orders
UNION ALL
SELECT 'silver_customers', count(1) FROM retail_lakehouse.silver.silver_customers
UNION ALL
SELECT 'silver_products', count(1) FROM retail_lakehouse.silver.silver_products;

-- 2. Expectation Pass/Fail Rates from DLT Event Log
-- Note: Replace 'your_pipeline_id' with the actual DLT pipeline ID
SELECT
  row_expectations.dataset,
  row_expectations.name as expectation_name,
  SUM(row_expectations.passed_records) as passed_records,
  SUM(row_expectations.failed_records) as failed_records,
  SUM(row_expectations.passed_records) / (SUM(row_expectations.passed_records) + SUM(row_expectations.failed_records)) * 100 as pass_rate_percent
FROM (
  SELECT
    explode(
      from_json(
        details :flow_progress :data_quality :expectations,
        "array<struct<name: string, dataset: string, passed_records: int, failed_records: int>>"
      )
    ) row_expectations
  FROM
    event_log("your_pipeline_id")
  WHERE
    event_type = 'flow_progress'
)
GROUP BY
  row_expectations.dataset,
  row_expectations.name
ORDER BY pass_rate_percent ASC;

-- 3. Freshness: Max ingestion time vs current time
SELECT 
  'silver_orders' as table_name,
  max(order_ts) as latest_event,
  max(_ingested_at) as latest_ingestion,
  current_timestamp() as current_time,
  timestampdiff(MINUTE, max(_ingested_at), current_timestamp()) as freshness_lag_minutes
FROM retail_lakehouse.silver.silver_orders;

-- 4. SCD2 History Rows per Customer
-- Finds customers with the most changes (highest number of history records)
SELECT 
  customer_id, 
  name, 
  count(1) as history_count
FROM retail_lakehouse.silver.silver_customers
GROUP BY customer_id, name
HAVING count(1) > 1
ORDER BY history_count DESC
LIMIT 10;

-- 5. Check if any duplicate active records exist for a customer (should be 0)
SELECT 
  customer_id, 
  count(1) as active_count
FROM retail_lakehouse.silver.silver_customers
WHERE __IS_CURRENT = true
GROUP BY customer_id
HAVING count(1) > 1;
