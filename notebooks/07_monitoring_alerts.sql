-- ============================================================================
-- Pipeline Monitoring & Alerting Queries
-- Run these as scheduled Databricks SQL Alerts
-- ============================================================================

-- USE CATALOG retail_lakehouse;

-- 1. Freshness Alert: Trigger if no data ingested in the last 15 minutes
-- Alert Condition: freshness_lag_minutes > 15
SELECT 
  'silver_orders' as table_name,
  timestampdiff(MINUTE, max(_ingested_at), current_timestamp()) as freshness_lag_minutes
FROM retail_lakehouse.silver.silver_orders;

-- 2. Pipeline Lag: Event Time vs Processed Time
-- Alert Condition: avg_processing_lag_seconds > 120
SELECT 
  date_trunc('hour', order_ts) as hour,
  avg(timestampdiff(SECOND, order_ts, _ingested_at)) as avg_processing_lag_seconds
FROM retail_lakehouse.bronze.bronze_orders
WHERE _ingested_at >= current_timestamp() - interval 24 hours
GROUP BY 1
ORDER BY 1 DESC
LIMIT 1;

-- 3. DLT Pipeline Health: Error Rate
-- Evaluates the percentage of failed records in the last run.
-- Alert Condition: failed_percentage > 5
SELECT
  dataset,
  SUM(failed_records) / (SUM(passed_records) + SUM(failed_records)) * 100 as failed_percentage
FROM (
  SELECT
    explode(
      from_json(
        details :flow_progress :data_quality :expectations,
        "array<struct<name: string, dataset: string, passed_records: int, failed_records: int>>"
      )
    ) as row_expectations
  FROM
    event_log("your_pipeline_id")
  WHERE
    event_type = 'flow_progress'
    AND timestamp >= current_timestamp() - interval 1 hour
) 
GROUP BY dataset;
