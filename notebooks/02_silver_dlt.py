import dlt
from pyspark.sql.functions import col

# Optional: You can import your external logic if packaged as a wheel,
# but for simple DLT definitions, we often inline or reference sys.path.
# To keep this notebook self-contained per best practices for DLT:
from src.transformations.silver_transforms import clean_and_cast_orders, enrich_orders

# ==============================================================================
# SILVER: Orders
# ==============================================================================
@dlt.table(
    name="silver_orders",
    comment="Cleaned and deduped order events with derived columns.",
    table_properties={"quality": "silver"}
)
# DLT Expectations
@dlt.expect_or_drop("valid_order_id", "order_id IS NOT NULL")
@dlt.expect("positive_qty", "qty > 0")
@dlt.expect_or_fail("valid_price", "price >= 0")
@dlt.expect("valid_status", "status IN ('PLACED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'UNKNOWN')")
def silver_orders():
    """
    Reads from Bronze orders.
    Dedups late arriving duplicates using watermark and dropDuplicates.
    Applies casting and derives order_amount.
    """
    bronze_df = dlt.read_stream("bronze_orders")
    
    cleaned_df = clean_and_cast_orders(bronze_df)
    enriched_df = enrich_orders(cleaned_df)
    
    # Dedup logic: requires watermark for streaming
    return (
        enriched_df
        .withWatermark("order_ts", "10 minutes")
        .dropDuplicates(["order_id", "order_ts"])
    )

# ==============================================================================
# SILVER: Customers (SCD Type 2)
# ==============================================================================
# 1. Create target table schema/properties
dlt.create_streaming_table(
    name="silver_customers",
    comment="Customer dimension maintaining history (SCD Type 2) via APPLY CHANGES.",
    table_properties={"quality": "silver"}
)

# 2. Define the APPLY CHANGES workflow
dlt.apply_changes(
    target="silver_customers",                  # Target table to update
    source="bronze_customers_cdc",              # Source streaming table
    keys=["customer_id"],                       # Primary key to join on
    sequence_by=col("source.ts_ms"),            # Ordering column to resolve out-of-order changes
    apply_as_deletes=expr("op = 'd'"),          # Condition to identify hard deletes
    except_column_list=["op", "source", "_source_file", "_batch_id", "_rescued_data", "before", "ts_ms"], # Columns to ignore in target
    stored_as_scd_type=2,                       # Track full history with start/end time and current flag
    track_history_except_column_list=[]         # Optional: columns that don't trigger a new SCD2 record
)

# ==============================================================================
# SILVER: Products (SCD Type 1)
# ==============================================================================
dlt.create_streaming_table(
    name="silver_products",
    comment="Product dimension maintaining only the latest state (SCD Type 1).",
    table_properties={"quality": "silver"}
)

dlt.apply_changes(
    target="silver_products",
    source="bronze_products_cdc",
    keys=["product_id"],
    sequence_by=col("source.ts_ms"),
    apply_as_deletes=expr("op = 'd'"),
    except_column_list=["op", "source", "_source_file", "_batch_id", "_rescued_data", "before", "ts_ms"],
    stored_as_scd_type=1                        # Upsert mode, overwrites previous state
)

# ==============================================================================
# SILVER: Enriched Orders (Materialized View)
# ==============================================================================
@dlt.table(
    name="silver_orders_enriched",
    comment="Materialized view joining orders with current customer and product details.",
    table_properties={"quality": "silver"}
)
def silver_orders_enriched():
    """
    Joins the streaming orders table with the current state of customers and products.
    """
    orders = dlt.read("silver_orders")
    
    # Filter for active customer records in SCD2
    customers = dlt.read("silver_customers").filter(col("__IS_CURRENT") == True)
    
    products = dlt.read("silver_products")
    
    return (
        orders.alias("o")
        .join(customers.alias("c"), col("o.customer_id") == col("c.customer_id"), "left")
        .join(products.alias("p"), col("o.product_id") == col("p.product_id"), "left")
        .select(
            "o.order_id",
            "o.order_ts",
            "o.order_date",
            "o.order_hour",
            "o.order_amount",
            "o.qty",
            "o.status",
            "o.region",
            "c.customer_id",
            "c.name.alias('customer_name')",
            "c.loyalty_tier",
            "p.product_id",
            "p.name.alias('product_name')",
            "p.category"
        )
    )
