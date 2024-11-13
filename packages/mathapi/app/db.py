# MongoDB connection
import os
from pymongo import MongoClient
MONGODB_URI = os.getenv("MONGODB_URI")
client = MongoClient(MONGODB_URI)
db = client["test"]  # Replace with the actual database name

def get_DB ():
    return db