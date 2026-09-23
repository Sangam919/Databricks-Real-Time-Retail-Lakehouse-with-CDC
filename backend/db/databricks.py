import os
from databricks import sql
from contextlib import contextmanager
from dotenv import load_dotenv

load_dotenv()

DATABRICKS_SERVER_HOSTNAME = os.getenv("DATABRICKS_SERVER_HOSTNAME")
DATABRICKS_HTTP_PATH = os.getenv("DATABRICKS_HTTP_PATH")
DATABRICKS_TOKEN = os.getenv("DATABRICKS_TOKEN")
CATALOG_NAME = os.getenv("CATALOG_NAME", "retail_lakehouse")

@contextmanager
def get_db_connection():
    if not all([DATABRICKS_SERVER_HOSTNAME, DATABRICKS_HTTP_PATH, DATABRICKS_TOKEN]):
        # Fallback for local development if creds are missing
        yield None
        return

    connection = sql.connect(
        server_hostname=DATABRICKS_SERVER_HOSTNAME,
        http_path=DATABRICKS_HTTP_PATH,
        access_token=DATABRICKS_TOKEN,
        catalog=CATALOG_NAME
    )
    try:
        yield connection
    finally:
        connection.close()

def execute_query(query: str, params: dict = None):
    with get_db_connection() as conn:
        if not conn:
            # Return mock data or None if no connection
            return None
        with conn.cursor() as cursor:
            cursor.execute(query, params or {})
            
            # Fetch column names
            columns = [desc[0] for desc in cursor.description]
            
            # Fetch all rows
            rows = cursor.fetchall()
            
            # Convert to list of dicts
            return [dict(zip(columns, row)) for row in rows]
