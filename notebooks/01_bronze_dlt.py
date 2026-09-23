import dlt
from pyspark.sql.functions import col, current_timestamp, lit

# Configuration params injected by Databricks Asset Bundles
landing_path_orders = spark.conf.get("landing_path_orders", "/mnt/landing/dev/orders")
landing_path_cdc_customers = spark.conf.get("landing_path_cdc_customers", "/mnt/landing/dev/cdc_customers")
landing_path_cdc_products = spark.conf.get("landing_path_cdc_products", "/mnt/landing/dev/cdc_products")
pipeline_id = spark.conf.get("pipelines.id", "unknown_pipeline")

# ==============================================================================
# BRONZE: Orders Stream
# ==============================================================================
@dlt.table(
    name="bronze_orders",
    comment="Raw order events ingested from landing zone via Auto Loader",
    table_properties={"quality": "bronze"}
)
@dlt.expect_or_drop("valid_json", "_rescued_data IS NULL")
@dlt.expect("has_order_id", "order_id IS NOT NULL")
def bronze_orders():
    """
    Ingests orders using Auto Loader. Uses schemaEvolutionMode='rescue' to
    safely capture unexpected columns without breaking the pipeline.
    """
    return (
        spark.readStream.format("cloudFiles")
        .option("cloudFiles.format", "json")
        .option("cloudFiles.inferColumnTypes", "true")
        .option("cloudFiles.schemaEvolutionMode", "rescue")
        .load(landing_path_orders)
        .select(
            "*",
            col("_metadata.file_path").alias("_source_file"),
            current_timestamp().alias("_ingested_at"),
            lit(pipeline_id).alias("_batch_id")
        )
    )

# ==============================================================================
# KAFKA_MODE Alternative for Bronze Orders (Uncomment to use)
# ==============================================================================
# @dlt.table(name="bronze_orders_kafka", comment="Raw order events from Kafka")
# def bronze_orders_kafka():
#     kafka_brokers = spark.conf.get("kafka_brokers")
#     kafka_topic = "orders_stream"
#     return (
#         spark.readStream
#         .format("kafka")
#         .option("kafka.bootstrap.servers", kafka_brokers)
#         .option("subscribe", kafka_topic)
#         .option("startingOffsets", "earliest")
#         .load()
#         .selectExpr("CAST(value AS STRING) as raw_json", "timestamp as _kafka_ts", "offset as _kafka_offset")
#     )

# ==============================================================================
# BRONZE: Customers CDC Stream
# ==============================================================================
@dlt.table(
    name="bronze_customers_cdc",
    comment="Raw Debezium CDC events for customers",
    table_properties={"quality": "bronze"}
)
@dlt.expect_or_drop("valid_operation", "op IS NOT NULL AND op IN ('c', 'u', 'd')")
def bronze_customers_cdc():
    """
    Ingests raw customer CDC data. Keeps the Debezium envelope for downstream 
    APPLY CHANGES logic.
    """
    return (
        spark.readStream.format("cloudFiles")
        .option("cloudFiles.format", "json")
        .option("cloudFiles.inferColumnTypes", "true")
        .option("cloudFiles.schemaEvolutionMode", "rescue")
        .load(landing_path_cdc_customers)
        .select(
            "*",
            col("_metadata.file_path").alias("_source_file"),
            current_timestamp().alias("_ingested_at"),
            lit(pipeline_id).alias("_batch_id")
        )
    )

# ==============================================================================
# BRONZE: Products CDC Stream
# ==============================================================================
@dlt.table(
    name="bronze_products_cdc",
    comment="Raw Debezium CDC events for products",
    table_properties={"quality": "bronze"}
)
@dlt.expect_or_drop("valid_operation", "op IS NOT NULL AND op IN ('c', 'u', 'd')")
def bronze_products_cdc():
    return (
        spark.readStream.format("cloudFiles")
        .option("cloudFiles.format", "json")
        .option("cloudFiles.inferColumnTypes", "true")
        .option("cloudFiles.schemaEvolutionMode", "rescue")
        .load(landing_path_cdc_products)
        .select(
            "*",
            col("_metadata.file_path").alias("_source_file"),
            current_timestamp().alias("_ingested_at"),
            lit(pipeline_id).alias("_batch_id")
        )
    )
