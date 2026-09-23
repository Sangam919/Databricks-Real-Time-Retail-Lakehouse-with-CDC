-- ============================================================================
-- Unity Catalog Governance: Masking, RLS, and Tags
-- Note: Requires Premium/Enterprise Workspace and Unity Catalog enabled.
-- ============================================================================

USE CATALOG retail_lakehouse;

-- ----------------------------------------------------------------------------
-- 1. Column Masking: Hide PII (Email & Phone) for non-admin groups
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION mask_email(email STRING)
RETURNS STRING
RETURN CASE 
    WHEN IS_ACCOUNT_GROUP_MEMBER('de_team') THEN email 
    ELSE '***@***.***' 
END;

CREATE OR REPLACE FUNCTION mask_phone(phone STRING)
RETURNS STRING
RETURN CASE 
    WHEN IS_ACCOUNT_GROUP_MEMBER('de_team') THEN phone 
    ELSE '***-***-****' 
END;

-- Apply Masks to Gold Dimension
ALTER TABLE gold.dim_customers ALTER COLUMN email SET MASK mask_email;
ALTER TABLE gold.dim_customers ALTER COLUMN phone SET MASK mask_phone;

-- ----------------------------------------------------------------------------
-- 2. Row-Level Security (RLS): Restrict data access by region
-- ----------------------------------------------------------------------------
-- Assume a mapping table or user attribute defines region access.
-- Here we'll hardcode a simple logic for demonstration:
-- The 'apac_analysts' group can only see 'APAC' region data.
CREATE OR REPLACE FUNCTION filter_region(region STRING)
RETURNS BOOLEAN
RETURN CASE
    WHEN IS_ACCOUNT_GROUP_MEMBER('de_team') THEN TRUE
    WHEN IS_ACCOUNT_GROUP_MEMBER('apac_analysts') AND region = 'APAC' THEN TRUE
    WHEN IS_ACCOUNT_GROUP_MEMBER('na_analysts') AND region = 'NA' THEN TRUE
    ELSE FALSE
END;

-- Apply Row Filter to Gold Facts
ALTER TABLE gold.fact_orders SET ROW FILTER filter_region ON (region);
ALTER TABLE gold.fact_daily_sales SET ROW FILTER filter_region ON (region);

-- ----------------------------------------------------------------------------
-- 3. Data Discovery Tags
-- ----------------------------------------------------------------------------
ALTER TABLE gold.dim_customers ALTER COLUMN email SET TAGS ('pii' = 'true', 'sensitivity' = 'high');
ALTER TABLE gold.dim_customers ALTER COLUMN phone SET TAGS ('pii' = 'true', 'sensitivity' = 'high');
ALTER TABLE gold.fact_orders SET TAGS ('domain' = 'sales', 'tier' = 'gold');

-- ----------------------------------------------------------------------------
-- 4. Table Comments
-- ----------------------------------------------------------------------------
COMMENT ON COLUMN gold.fact_orders.order_amount IS 'Total order value after discounts';
COMMENT ON COLUMN gold.fact_orders.status IS 'Current fulfillment status: PLACED, SHIPPED, DELIVERED, CANCELLED';
