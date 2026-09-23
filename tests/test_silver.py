import pytest
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, DoubleType, TimestampType
from chispa.dataframe_comparer import assert_df_equality
from src.transformations.silver_transforms import clean_and_cast_orders, enrich_orders
from datetime import datetime, timezone

def test_clean_and_cast_orders(spark):
    """Tests that the raw strings from JSON are correctly cast to typed columns."""
    
    # Raw incoming data matching JSON inference (often everything is a string or roughly guessed)
    data = [
        ("123", 1, 100, 2, 25.5, 5.0, "2024-01-01T10:00:00Z", "PLACED", "NA", "CREDIT", "Address 1", "2024-01-01T10:01:00Z"),
        ("124", 2, 200, 1, 10.0, None, "2024-01-01T11:00:00Z", "SHIPPED", "EMEA", "PAYPAL", "Address 2", "2024-01-01T11:01:00Z")
    ]
    columns = ["order_id", "customer_id", "product_id", "qty", "price", "discount", "order_ts", "status", "region", "payment_method", "shipping_address", "_ingested_at"]
    
    df_raw = spark.createDataFrame(data, columns)
    
    # The cast logic under test
    df_clean = clean_and_cast_orders(df_raw)
    
    # Define expected schema
    expected_schema = StructType([
        StructField("order_id", StringType(), True),
        StructField("customer_id", IntegerType(), True),
        StructField("product_id", IntegerType(), True),
        StructField("qty", IntegerType(), True),
        StructField("price", DoubleType(), True),
        StructField("discount", DoubleType(), True),
        StructField("order_ts", TimestampType(), True),
        StructField("status", StringType(), True),
        StructField("region", StringType(), True),
        StructField("payment_method", StringType(), True),
        StructField("shipping_address", StringType(), True),
        StructField("_ingested_at", StringType(), True) # Leaving as is since we didn't cast it in clean_and_cast
    ])
    
    # Create expected df
    expected_data = [
        ("123", 1, 100, 2, 25.5, 5.0, datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc), "PLACED", "NA", "CREDIT", "Address 1", "2024-01-01T10:01:00Z"),
        ("124", 2, 200, 1, 10.0, None, datetime(2024, 1, 1, 11, 0, 0, tzinfo=timezone.utc), "SHIPPED", "EMEA", "PAYPAL", "Address 2", "2024-01-01T11:01:00Z")
    ]
    df_expected = spark.createDataFrame(expected_data, expected_schema)
    
    # Use chispa for descriptive inequality messages
    assert_df_equality(df_clean, df_expected, ignore_nullable=True)

def test_enrich_orders(spark):
    """Tests the derived columns (amount, date, hour) in Silver orders."""
    
    schema = StructType([
        StructField("qty", IntegerType(), True),
        StructField("price", DoubleType(), True),
        StructField("discount", DoubleType(), True),
        StructField("order_ts", TimestampType(), True)
    ])
    
    data = [
        (2, 25.0, 5.0, datetime(2024, 1, 1, 10, 30, 0, tzinfo=timezone.utc)),
        (1, 10.0, None, datetime(2024, 1, 2, 22, 15, 0, tzinfo=timezone.utc)) # Test null discount
    ]
    df_input = spark.createDataFrame(data, schema)
    
    df_enriched = enrich_orders(df_input)
    
    # Collect results to verify derived logic
    results = df_enriched.collect()
    
    # 2 * 25.0 - 5.0 = 45.0
    assert results[0]["order_amount"] == 45.0
    assert results[0]["order_date"].isoformat() == "2024-01-01"
    assert results[0]["order_hour"] == 10
    
    # 1 * 10.0 - 0.0 (coalesce null) = 10.0
    assert results[1]["order_amount"] == 10.0
    assert results[1]["order_date"].isoformat() == "2024-01-02"
    assert results[1]["order_hour"] == 22
