import pytest
from pyspark.sql import SparkSession
from delta import configure_spark_with_delta_pip
import shutil
import os

os.environ["PYSPARK_PYTHON"] = "python"
os.environ["PYSPARK_DRIVER_PYTHON"] = "python"

@pytest.fixture(scope="session")
def spark():
    """
    Creates a local Spark session for testing.
    Includes Delta Lake configuration to support Delta formats.
    """
    builder = (
        SparkSession.builder.master("local[1]")
        .appName("local-tests")
        .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension")
        .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog")
        .config("spark.sql.session.timeZone", "UTC")
    )
    spark = configure_spark_with_delta_pip(builder).getOrCreate()
    yield spark
    spark.stop()

@pytest.fixture(scope="session")
def test_dir():
    """
    Creates a temporary directory for test outputs, cleans it up after.
    """
    path = "/tmp/retail_lakehouse_tests"
    os.makedirs(path, exist_ok=True)
    yield path
    shutil.rmtree(path)
