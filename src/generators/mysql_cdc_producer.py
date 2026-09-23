import json
import time
import random
import os
import uuid
from datetime import datetime, timezone
from faker import Faker
import argparse

fake = Faker()

# In-memory state to simulate updates/deletes on existing records
customers_state = {}
products_state = {}

def create_customer(customer_id: int):
    return {
        "customer_id": customer_id,
        "name": fake.name(),
        "email": fake.email(),
        "phone": fake.phone_number(),
        "address": fake.street_address(),
        "city": fake.city(),
        "state": fake.state_abbr(),
        "zip_code": fake.zipcode(),
        "country": fake.country(),
        "loyalty_tier": random.choice(["BRONZE", "SILVER", "GOLD", "PLATINUM"]),
        "created_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "updated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    }

def create_product(product_id: int):
    return {
        "product_id": product_id,
        "name": fake.word().capitalize() + " " + fake.word().capitalize(),
        "category": random.choice(["Electronics", "Apparel", "Home", "Toys", "Sports"]),
        "subcategory": fake.word(),
        "brand": fake.company(),
        "price": round(random.uniform(5.0, 500.0), 2),
        "weight": round(random.uniform(0.1, 10.0), 2),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "updated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    }

def generate_cdc_event(table: str, error_rate: float = 0.05):
    """Generates a Debezium-style CDC envelope."""
    is_error = random.random() < error_rate
    state_dict = customers_state if table == "customers" else products_state
    create_func = create_customer if table == "customers" else create_product
    
    # 60% Insert, 30% Update, 10% Delete
    op_rand = random.random()
    if not state_dict or op_rand < 0.6:
        op = "c" # create
    elif op_rand < 0.9:
        op = "u" # update
    else:
        op = "d" # delete
        
    before = None
    after = None
    ts_ms = int(time.time() * 1000)
    
    if is_error and random.random() < 0.3:
        op = None # Error: missing operation
        
    if op == "c":
        record_id = len(state_dict) + 1
        after = create_func(record_id)
        state_dict[record_id] = after
        if is_error and random.random() < 0.5:
            after = None # Error: missing after state on insert
    elif op == "u":
        record_id = random.choice(list(state_dict.keys()))
        before = state_dict[record_id].copy()
        after = state_dict[record_id].copy()
        after["updated_at"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        if table == "customers":
            after["loyalty_tier"] = random.choice(["BRONZE", "SILVER", "GOLD", "PLATINUM"])
        else:
            after["price"] = round(after["price"] * random.uniform(0.9, 1.1), 2)
        state_dict[record_id] = after
        
        # Error: schema drift (extra field)
        if is_error:
            after["_unexpected_column"] = "malformed_data"
    elif op == "d":
        record_id = random.choice(list(state_dict.keys()))
        before = state_dict[record_id]
        del state_dict[record_id]

    envelope = {
        "op": op,
        "before": before,
        "after": after,
        "source": {
            "version": "1.9.5.Final",
            "connector": "mysql",
            "name": "mysql_server",
            "ts_ms": ts_ms,
            "snapshot": "false",
            "db": "retail_db",
            "table": table
        },
        "ts_ms": ts_ms
    }
    
    return envelope

def write_to_file(batch: list, output_dir: str, prefix: str):
    os.makedirs(output_dir, exist_ok=True)
    filename = os.path.join(output_dir, f"{prefix}_{int(time.time()*1000)}_{uuid.uuid4().hex[:8]}.json")
    with open(filename, 'w') as f:
        for event in batch:
            f.write(json.dumps(event) + '\n')

def run(events_per_sec: int, duration_sec: int, out_customers: str, out_products: str, error_rate: float):
    print(f"Starting CDC generator. EPS: {events_per_sec}, Duration: {duration_sec}s")
    start_time = time.time()
    
    while (time.time() - start_time) < duration_sec:
        batch_start = time.time()
        
        cust_batch = []
        prod_batch = []
        
        for _ in range(events_per_sec):
            if random.random() < 0.7:
                cust_batch.append(generate_cdc_event("customers", error_rate))
            else:
                prod_batch.append(generate_cdc_event("products", error_rate))
                
        if cust_batch:
            write_to_file(cust_batch, out_customers, "cdc_customers")
        if prod_batch:
            write_to_file(prod_batch, out_products, "cdc_products")
            
        elapsed = time.time() - batch_start
        if elapsed < 1.0:
            time.sleep(1.0 - elapsed)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--eps", type=int, default=5, help="Events per second")
    parser.add_argument("--duration", type=int, default=60, help="Duration in seconds")
    parser.add_argument("--out-cust", type=str, default="/tmp/landing/dev/cdc_customers", help="Output dir for customers CDC")
    parser.add_argument("--out-prod", type=str, default="/tmp/landing/dev/cdc_products", help="Output dir for products CDC")
    parser.add_argument("--error-rate", type=float, default=0.05, help="Error injection rate")
    args = parser.parse_args()
    
    run(args.eps, args.duration, args.out_cust, args.out_prod, args.error_rate)
