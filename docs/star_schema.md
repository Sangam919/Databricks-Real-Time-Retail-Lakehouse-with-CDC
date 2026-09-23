# Star Schema Design

This document visualizes the dimensional modeling applied in the Gold layer of the Databricks Real-Time Retail Lakehouse with CDC.

## Diagram

```mermaid
erDiagram
    fact_orders {
        string order_id PK
        string customer_key FK
        string product_key FK
        date date_key FK
        timestamp order_ts
        int qty
        double price
        double discount
        double order_amount
        string status
        string region
    }
    
    dim_customers {
        string customer_key PK
        int customer_id
        string name
        string loyalty_tier
        timestamp __START_AT
        timestamp __END_AT
        boolean __IS_CURRENT
    }
    
    dim_products {
        string product_key PK
        int product_id
        string name
        string category
        double price
        boolean is_active
    }
    
    dim_date {
        date date_key PK
        int year
        int quarter
        int month
        string month_name
        int day_of_week
        boolean is_weekend
    }

    dim_customers ||--o{ fact_orders : "1 to Many"
    dim_products ||--o{ fact_orders : "1 to Many"
    dim_date ||--o{ fact_orders : "1 to Many"
```

## Optimization Strategy

- **`fact_orders`**: Partitioned by `order_date` (efficient for time-series queries). Z-Ordered by `customer_key` and `product_key` to skip data effectively during slice-and-dice aggregations.
- **Dimensions**: Small enough that partitioning is anti-pattern. Auto compaction is enabled.
