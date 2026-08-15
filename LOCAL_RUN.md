# Локальный запуск SberLab target

## 1. Требования

- Docker Desktop либо Docker Engine с Compose v2.
- Свободные порты `8080` и `8000` на компьютере.
- Запуск команд из каталога, где расположен `docker-compose.yml`.

GigaChat-ключ для основного запуска не нужен. Он требуется только для AI-функций.

## 2. Одна команда запуска

```bash
docker compose up --build -d
```

При первом запуске Docker скачает базовые образы, поэтому сборка займёт больше времени. Backend автоматически:

1. применит миграции;
2. создаст воспроизводимые тестовые данные;
3. запустит Django на порту `8000`;
4. пройдёт healthcheck с реальным запросом к SQLite.

Frontend запускается только после успешного healthcheck backend.

## 3. Проверка готовности

```bash
docker compose ps
curl http://localhost:8080/health/
```

Ожидается состояние `healthy` у `sberlab_backend` и `sberlab_frontend` и ответ:

```json
{"status": "ok", "database": "ok"}
```

Откройте `http://localhost:8080` в браузере. Backend также опубликован напрямую: `http://localhost:8000`.

Nginx внутри frontend-контейнера продолжает использовать порт `80`, а Compose по умолчанию публикует его как `8080:80`. Внешний порт можно переопределить: `FRONTEND_PORT=9090 docker compose up --build -d`.

## 4. Тестовые учётные записи

| Роль | Логин | Пароль |
| :--- | :--- | :--- |
| Admin | `admin` | `admin` |
| Ментор | `mentor` | `Aa12345678!` |
| Студент | `student` | `Aa12345678` |
| HR | `hr` | `Aa12345678` |
| Деканат | `teacher` | `Aa12345678` |

## 5. Диагностика и остановка

Посмотреть логи всех сервисов:

```bash
docker compose logs -f
```

Посмотреть только backend:

```bash
docker compose logs -f backend
```

Остановить контейнеры, сохранив данные:

```bash
docker compose down
```

Полностью сбросить тестовую среду, включая SQLite и загруженные файлы:

```bash
docker compose down -v
```

Если порт `8080` или `8000` занят, `docker compose up` сообщит `port is already allocated`. Для frontend задайте другой внешний порт: `FRONTEND_PORT=9090 docker compose up --build -d`.

## 6. Где хранятся данные

- `db_volume` подключён в backend как `/app/data`; там находится `db.sqlite3`.
- `media_volume` подключён как `/app/media`; там находятся загруженные файлы.
- Отдельного сервиса DB и сетевого порта базы нет.
- Файл `db_backup.sqlite3` в корне — историческая резервная копия и при запуске Compose не используется.
- `backend/.dockerignore` не позволяет случайно включить локальную SQLite, `.env`, медиа и Python-кэш в образ backend.
