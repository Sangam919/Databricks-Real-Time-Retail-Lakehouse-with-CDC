import os
import yaml
from typing import Dict, Any

def load_config(env: str = None) -> Dict[str, Any]:
    """
    Loads configuration from YAML file based on the environment.
    Defaults to 'dev' if not specified.
    """
    if not env:
        env = os.getenv("DATABRICKS_ENV", "dev")
        
    config_path = os.path.join(os.path.dirname(__file__), "..", "..", "configs", f"{env}.yaml")
    
    try:
        with open(config_path, "r") as f:
            config = yaml.safe_load(f)
            return config
    except FileNotFoundError:
        print(f"Warning: Configuration file {config_path} not found. Returning empty config.")
        return {}
