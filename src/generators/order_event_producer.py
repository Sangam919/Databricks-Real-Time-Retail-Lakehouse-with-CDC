import json
import time
import random
import os
import uuid
from datetime import datetime, timedelta, timezone
from faker import Faker
import argparse

# KAFKA_MODE: Uncomment imports below if running with Kafka
# from confluent_kafka import Producer

fake = Faker()

def generate_order(error_rate: float = 0.05) -> dict:
    """Generates a single order event."""
    is_error = random.random() < error_rate
    
    order = {
        "order_id": str(uuid.uuid4()) if not is_error else None, # Error: null order_id
        "customer_id": random.randint(1, 10000),
        "product_id": random.randint(1, 5000),
        "qty": random.randint(1, 5) if not is_error else random.randint(-5, -1), # Error: negative qty
        "price": round(random.lognormvariate(3, 1), 2) if not is_error else -10.0, # Error: negative price
        "discount": round(random.uniform(0, 20), 2),
        "order_ts": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "status": random.choices(["PLACED", "SHIPPED", "DELIVERED", "CANCELLED", "UNKNOWN"], weights=[60, 20, 10, 5, 5])[0] if not is_error else "INVALID_STATUS",
        "region": random.choice(["NA", "EMEA", "APAC", "LATAM"]),
        "payment_method": random.choice(["CREDIT_CARD", "PAYPAL", "STRIPE", "CRYPTO"]),
        "shipping_address": fake.address().replace("\n", ", ")
    }
    
    if is_error and random.random() < 0.5:
        # Simulate malformed JSON logic upstream or missing required fields
        del order["order_ts"]
        
    return order

def write_to_file(batch: list, output_dir: str):
    """Writes a batch of orders to a JSON lines file for Auto Loader."""
    os.makedirs(output_dir, exist_ok=True)
    filename = os.path.join(output_dir, f"orders_{int(time.time()*1000)}_{uuid.uuid4().hex[:8]}.json")
    
    with open(filename, 'w') as f:
        for order in batch:
            f.write(json.dumps(order) + '\n')
    
    return filename

def run(events_per_sec: int, duration_sec: int, output_dir: str, error_rate: float):
    print(f"Starting order generator. Target EPS: {events_per_sec}, Duration: {duration_sec}s")
    start_time = time.time()
    total_events = 0
    batch = []
    batch_size = 100
    
    while (time.time() - start_time) < duration_sec:
        batch_start = time.time()
        
        for _ in range(events_per_sec):
            order = generate_order(error_rate)
            batch.append(order)
            total_events += 1
            
            if len(batch) >= batch_size:
                write_to_file(batch, output_dir)
                batch = []
                
        # Handle remainder of batch if any
        if len(batch) > 0:
             write_to_file(batch, output_dir)
             batch = []
             
        elapsed = time.time() - batch_start
        if elapsed < 1.0:
            time.sleep(1.0 - elapsed)
            
    print(f"Finished generating {total_events} orders in {output_dir}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--eps", type=int, default=10, help="Events per second")
    parser.add_argument("--duration", type=int, default=60, help="Duration in seconds")
    parser.add_argument("--outdir", type=str, default="/tmp/landing/dev/orders", help="Output directory for Auto Loader")
    parser.add_argument("--error-rate", type=float, default=0.05, help="Error injection rate")
    args = parser.parse_args()
    
    # In a real environment, outdir would map to a DBFS mount or ADLS path.
    # For local testing without DBFS access, we write to a local temp dir or the specified outdir.
    run(args.eps, args.duration, args.outdir, args.error_rate)
