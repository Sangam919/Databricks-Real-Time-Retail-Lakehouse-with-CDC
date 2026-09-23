import os
import json
import pytest
from src.generators import order_event_producer, mysql_cdc_producer

def test_order_generator_schema():
    """Validates the order event contains the required schema elements."""
    order = order_event_producer.generate_order(error_rate=0.0)
    
    assert "order_id" in order
    assert "customer_id" in order
    assert "price" in order
    assert order["order_id"] is not None
    assert order["price"] >= 0

def test_order_generator_error_injection():
    """Validates error injection works by forcing an error."""
    order = order_event_producer.generate_order(error_rate=1.0)
    
    # Check for at least one error condition
    errors = [
        order.get("order_id") is None,
        order.get("qty", 1) < 0,
        order.get("price", 1.0) < 0.0,
        order.get("status") == "INVALID_STATUS",
        "order_ts" not in order
    ]
    assert any(errors), "Expected at least one error to be injected"

def test_cdc_customer_generator():
    """Validates Debezium CDC envelope structure for customers."""
    event = mysql_cdc_producer.generate_cdc_event("customers", error_rate=0.0)
    
    assert "op" in event
    assert event["op"] in ["c", "u", "d"]
    assert "source" in event
    assert event["source"]["table"] == "customers"
    assert "ts_ms" in event
    
    if event["op"] == "c":
        assert event["after"] is not None
        assert "customer_id" in event["after"]
        assert "email" in event["after"]
    elif event["op"] == "u":
        assert event["before"] is not None
        assert event["after"] is not None

def test_cdc_product_generator():
    """Validates Debezium CDC envelope structure for products."""
    event = mysql_cdc_producer.generate_cdc_event("products", error_rate=0.0)
    
    assert event["source"]["table"] == "products"
    
    if event["op"] == "c":
        assert event["after"] is not None
        assert "product_id" in event["after"]
        assert "category" in event["after"]
        assert "price" in event["after"]
