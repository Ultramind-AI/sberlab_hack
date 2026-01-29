## 🛠 Технологический стек

**Backend:**
- Python 3.10+
- Django Rest Framework (DRF)
- SQLite (Database)
- Pillow (Image Processing)
- Django CKEditor

**Frontend:**
- React (Vite)
- Axios
- Swiper.js (Gallery)
- CSS3 (Custom animations & Glassmorphism)

---

## 🚀 Как запустить проект

### 1. Запуск Backend (Сервер)

Откройте терминал в папке `backend`:

```bash
# Переходим в папку
cd backend

# Создаем виртуальное окружение
python -m venv venv

# Активируем (Windows)
venv\Scripts\activate
# Активируем (Mac/Linux)
# source venv/bin/activate

# Устанавливаем зависимости
pip install -r requirements.txt

# Применяем миграции
python manage.py migrate

# Создаем суперпользователя (для доступа в админку)
python manage.py createsuperuser

# Запускаем сервер
python manage.py runserver
```

Сервер запустится по адресу: `http://127.0.0.1:8000/`

### 2. Запуск Frontend (Клиент)

Откройте **новый** терминал в папке `frontend`:

```bash
# Переходим в папку
cd frontend

# Устанавливаем библиотеки
npm install

# Запускаем проект
npm run dev
```

Откройте ссылку, которая появится в терминале (обычно `http://localhost:5173`).