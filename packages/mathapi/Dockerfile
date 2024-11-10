# Gebruik een lichte Python-basisimage
FROM python:3.10-slim

WORKDIR /app

# Kopieer de vereiste bestanden
COPY requirements.txt ./
RUN pip install -r requirements.txt

# Kopieer de applicatiecode
COPY . .

# Stel de standaardpoort in
EXPOSE 5000

# Start de applicatie (bijv. met Flask)
CMD ["python", "app.py"]
