# MongoDB connection
import os
from pymongo import MongoClient
import logging
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
logger.info(f"Connecting to MongoDB with URI: {MONGODB_URI}")

client = MongoClient(MONGODB_URI)
db = client["test"]  # Replace with the actual database name

def get_DB():
    return db