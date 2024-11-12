# Gebruik een lichte Python-basisimage
FROM python:3.10-slim

WORKDIR /app
# Copy only the app package to the container
COPY ../../packages/mathapi ./

RUN pip install -r requirements.txt


# Stel de standaardpoort in
EXPOSE 5000

# Start de applicatie
CMD ["python", "app/app.py"]
