"""
Configuration file for pytest to handle imports and common fixtures.
"""

import sys
import os

# Add the app directory to Python path so we can import app modules
app_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

# Add the mathapi root directory to Python path 
root_dir = os.path.dirname(app_dir)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

import pytest 