FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn

COPY . .

RUN mkdir -p media

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
