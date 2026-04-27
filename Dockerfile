FROM python:3.10-slim

# Install libmagic for python-magic file validation (Critical for Linux environments)
RUN apt-get update && apt-get install -y libmagic1 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

# Install dependencies and add gunicorn for our production ASGI/WSGI web server
RUN pip install --no-cache-dir -r requirements.txt gunicorn

COPY . .

EXPOSE 8000

# Automatically run migrations prior to starting the production server bound to 0.0.0.0
CMD ["sh", "-c", "python manage.py migrate && python seed.py && gunicorn config.wsgi:application --bind 0.0.0.0:8000"]
