-- ============================================================================
-- Unity Catalog Setup for Databricks Real-Time Retail Lakehouse with CDC
-- Note: These commands require a Premium or Enterprise Databricks workspace.
-- Community Edition users can skip this file as UC is not supported.
-- ============================================================================

-- 1. Create Catalog
CREATE CATALOG IF NOT EXISTS retail_lakehouse;
USE CATALOG retail_lakehouse;

-- 2. Create Medallion Schemas
CREATE SCHEMA IF NOT EXISTS bronze 
  COMMENT 'Raw ingested data - no transformations, schema evolution enabled';

CREATE SCHEMA IF NOT EXISTS silver 
  COMMENT 'Cleaned, validated, business-conformed data (SCD1/SCD2 applied)';

CREATE SCHEMA IF NOT EXISTS gold   
  COMMENT 'Business-level aggregates, star schema, and real-time KPIs';

-- 3. External Location Setup (Requires ADLS Gen2 or similar)
-- Ensure STORAGE CREDENTIAL 'retail_storage_cred' is created in Account Console first
-- CREATE EXTERNAL LOCATION IF NOT EXISTS retail_landing
--   URL 'abfss://landing@<storage_account>.dfs.core.windows.net/'
--   WITH (STORAGE CREDENTIAL retail_storage_cred)
--   COMMENT 'Landing zone for Auto Loader fallback';

-- 4. Access Control (Groups must exist in Account Console)
-- CREATE GROUP IF NOT EXISTS de_team;
-- CREATE GROUP IF NOT EXISTS analysts;

-- Grant permissions to Data Engineering Team
-- GRANT USE CATALOG ON CATALOG retail_lakehouse TO de_team;
-- GRANT USE SCHEMA, CREATE TABLE, MODIFY, SELECT ON SCHEMA bronze TO de_team;
-- GRANT USE SCHEMA, CREATE TABLE, MODIFY, SELECT ON SCHEMA silver TO de_team;
-- GRANT USE SCHEMA, CREATE TABLE, MODIFY, SELECT ON SCHEMA gold TO de_team;

-- Grant permissions to Analysts (Read-only on Gold)
-- GRANT USE CATALOG ON CATALOG retail_lakehouse TO analysts;
-- GRANT USE SCHEMA, SELECT ON SCHEMA gold TO analysts;
