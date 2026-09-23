import dlt
from pyspark.sql.functions import col, md5, concat_ws, date_format, dayofweek, month, year, quarter, expr, window

# ==============================================================================
# GOLD DIMENSIONS
# ==============================================================================

@dlt.table(
    name="dim_customers",
    comment="Customer dimension (SCD Type 2) with surrogate keys.",
    table_properties={
        "quality": "gold",
        "delta.autoOptimize.optimizeWrite": "true",
        "delta.autoOptimize.autoCompact": "true"
    }
)
def dim_customers():
    """
    Reads from silver_customers (SCD2).
    Generates a surrogate key based on natural key + start time for unique history row identification.
    Optimization: Small dimension, no partitioning needed. Auto compaction enabled.
    """
    return (
        dlt.read("silver_customers")
        .withColumn("customer_key", md5(concat_ws("|", col("customer_id"), col("__START_AT"))))
        .select(
            "customer_key",
            "customer_id",
            "name",
            "email",
            "phone",
            "address",
            "city",
            "state",
            "zip_code",
            "country",
            "loyalty_tier",
            "__START_AT",
            "__END_AT",
            "__IS_CURRENT"
        )
    )

@dlt.table(
    name="dim_products",
    comment="Product dimension (SCD Type 1) with surrogate keys.",
    table_properties={
        "quality": "gold",
        "delta.autoOptimize.optimizeWrite": "true",
        "delta.autoOptimize.autoCompact": "true"
    }
)
def dim_products():
    """
    Reads from silver_products (SCD1).
    """
    return (
        dlt.read("silver_products")
        .withColumn("product_key", md5(col("product_id").cast("string")))
        .select(
            "product_key",
            "product_id",
            "name",
            "category",
            "subcategory",
            "brand",
            "price",
            "weight",
            "is_active"
        )
    )

@dlt.table(
    name="dim_date",
    comment="Static calendar table.",
    table_properties={"quality": "gold"}
)
def dim_date():
    """
    Generates a calendar dimension dynamically. In a real scenario, this might 
    be pre-populated from a static file with holiday flags.
    """
    # Create a small dataframe with a sequence of dates
    df = spark.sql("""
        SELECT explode(sequence(to_date('2020-01-01'), to_date('2030-12-31'), interval 1 day)) as date_key
    """)
    
    return df.select(
        col("date_key"),
        year("date_key").alias("year"),
        quarter("date_key").alias("quarter"),
        month("date_key").alias("month"),
        date_format("date_key", "MMMM").alias("month_name"),
        dayofweek("date_key").alias("day_of_week"),
        expr("dayofweek(date_key) IN (1, 7)").alias("is_weekend")
    )

# ==============================================================================
# GOLD FACTS
# ==============================================================================

@dlt.table(
    name="fact_orders",
    comment="Fact table for order lines. Grain: one row per order.",
    table_properties={
        "quality": "gold",
        "pipelines.autoOptimize.zOrderCols": "customer_key,product_key"
    },
    partition_cols=["order_date"]
)
def fact_orders():
    """
    Joins silver_orders_enriched with dimension keys.
    Z-Ordering: Z-ordered by customer_key and product_key to accelerate multidimensional filtering.
    Partitioning: Partitioned by order_date (daily partition is standard for event facts).
    """
    orders = dlt.read("silver_orders_enriched")
    customers = dlt.read("dim_customers").filter(col("__IS_CURRENT") == True)
    products = dlt.read("dim_products")
    
    return (
        orders.alias("o")
        .join(customers.alias("c"), col("o.customer_id") == col("c.customer_id"), "left")
        .join(products.alias("p"), col("o.product_id") == col("p.product_id"), "left")
        .select(
            col("o.order_id"),
            col("c.customer_key"),
            col("p.product_key"),
            col("o.order_date").alias("date_key"),
            col("o.order_ts"),
            col("o.qty"),
            col("o.price"),
            col("o.discount"),
            col("o.order_amount"),
            col("o.status"),
            col("o.region")
        )
    )

@dlt.table(
    name="fact_daily_sales",
    comment="Daily aggregated sales KPIs.",
    table_properties={"quality": "gold"}
)
def fact_daily_sales():
    """
    Pre-aggregated metrics for faster dashboard loads.
    """
    return (
        dlt.read("fact_orders")
        .groupBy("date_key", "region")
        .agg(
            expr("count(distinct order_id)").alias("total_orders"),
            expr("sum(order_amount)").alias("total_revenue"),
            expr("count(distinct customer_key)").alias("unique_customers"),
            expr("sum(order_amount) / count(distinct order_id)").alias("average_order_value")
        )
    )

# ==============================================================================
# GOLD STREAMING: Real-Time KPIs & Alerts
# ==============================================================================

@dlt.table(
    name="gold_realtime_kpis",
    comment="Streaming aggregates over a sliding window (1 minute, slide 10s).",
    table_properties={"quality": "gold"}
)
def gold_realtime_kpis():
    """
    Uses Structured Streaming Window functions to calculate real-time velocity.
    """
    # Read as stream from silver_orders
    stream = dlt.read_stream("silver_orders")
    
    return (
        stream
        .withWatermark("order_ts", "1 minutes")
        .groupBy(
            window("order_ts", "1 minute", "10 seconds"),
            "region"
        )
        .agg(
            expr("count(order_id)").alias("orders_per_minute"),
            expr("sum(order_amount)").alias("revenue_per_minute")
        )
        .select("window.start", "window.end", "region", "orders_per_minute", "revenue_per_minute")
    )
