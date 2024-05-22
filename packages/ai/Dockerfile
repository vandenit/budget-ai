FROM python:3.8-slim

WORKDIR /app

# Copy the requirements.txt file from the root context
COPY packages/ai/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the app directory from the root context
COPY packages/ai/app ./app

# Set the working directory to the app directory
WORKDIR /app/app

# Debugging: List the contents of the app directory
RUN ls -la

# Set the command to run the application
CMD ["fastapi", "run", "app/app/main.py", "--proxy-headers", "--port", "5000"]
