from pyspark.sql import DataFrame
from pyspark.sql.functions import col, expr

def clean_and_cast_orders(df: DataFrame) -> DataFrame:
    """
    Cleans and casts the raw JSON orders dataframe to typed columns.
    """
    return df.select(
        col("order_id").cast("string"),
        col("customer_id").cast("integer"),
        col("product_id").cast("integer"),
        col("qty").cast("integer"),
        col("price").cast("double"),
        col("discount").cast("double"),
        col("order_ts").cast("timestamp"),
        col("status").cast("string"),
        col("region").cast("string"),
        col("payment_method").cast("string"),
        col("shipping_address").cast("string"),
        col("_ingested_at")
    )

def enrich_orders(df: DataFrame) -> DataFrame:
    """
    Adds derived columns to the orders dataframe.
    """
    return df.withColumn(
        "order_amount", 
        expr("(qty * price) - coalesce(discount, 0.0)")
    ).withColumn(
        "order_date", 
        expr("to_date(order_ts)")
    ).withColumn(
        "order_hour", 
        expr("hour(order_ts)")
    )
