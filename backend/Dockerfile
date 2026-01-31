# backend/Dockerfile
FROM python:3.11-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем зависимости и устанавливаем их
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Добавляем gunicorn для продакшн-запуска (или используем runserver для простоты)
RUN pip install gunicorn

# Копируем код проекта
COPY . .

# Создаем папку для медиа (аватарок)
RUN mkdir -p media

# Открываем порт
EXPOSE 8000

# Запускаем сервер (слушаем все интерфейсы 0.0.0.0)
# Используем runserver для хакатона, чтобы не возиться со статикой админки через nginx
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
