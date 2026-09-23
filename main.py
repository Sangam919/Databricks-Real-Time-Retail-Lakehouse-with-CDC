import sys
import os

# Add the backend directory to the Python path
# This allows imports like 'from api.router import router' to work correctly.
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from backend.main import app
