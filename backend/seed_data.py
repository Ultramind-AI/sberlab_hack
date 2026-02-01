import os
import django
import random

# Настройка окружения Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import User, Project, Participation


def seed():
    print("🚀 Запуск генерации данных...")

    # 1. Данные для студентов
    students_data = [
        {
            "username": "ivan_pro",
            "fio": "Иванов Иван Алексеевич",
            "gpa": 4.9,
            "stack": "Python, Django, PostgreSQL, Docker",
            "about": "Занимаюсь бэкендом 2 года, участвовал в 3 хакатонах.",
            "letter": "Привет! Я эксперт в Django, сделаю бэкенд за 2 дня. Хочу этот проект в диплом."
        },
        {
            "username": "masha_js",
            "fio": "Петрова Мария Сергеевна",
            "gpa": 4.5,
            "stack": "React, JavaScript, CSS, HTML5",
            "about": "Фронтенд-разработчик. Люблю красивый UI.",
            "letter": "Я видела ваше описание, могу сделать крутой интерфейс на React. Возьмите меня!"
        },
        {
            "username": "denis_ml",
            "fio": "Сидоров Денис Викторович",
            "gpa": 3.8,
            "stack": "Python, PyTorch, Pandas, SQL",
            "about": "Интересуюсь нейросетями, но веб-разработку только осваиваю.",
            "letter": "Хочу научиться делать полноценные сервисы. Готов много работать."
        },
        {
            "username": "alex_junior",
            "fio": "Кузнецов Александр",
            "gpa": 3.2,
            "stack": "C++, Pascal, HTML",
            "about": "Первокурсник, учусь быстро.",
            "letter": "Возьмите хоть кем-нибудь, я быстро учусь и хорошо варю кофе (шутка)."
        },
        {
            "username": "elena_data",
            "fio": "Морозова Елена",
            "gpa": 4.2,
            "stack": "Python, SQL, Tableau",
            "about": "Аналитик данных. Хочу попробовать себя в разработке.",
            "letter": "Могу помочь с базой данных и аналитикой проекта."
        }
    ]

    # Находим проект (последний созданный)
    project = Project.objects.last()
    if not project:
        print("❌ Ошибка: Сначала создай хотя бы один проект через сайт или админку!")
        return

    print(f"📁 Работаем с проектом: {project.title}")

    for data in students_data:
        # Создаем или получаем пользователя
        user, created = User.objects.get_or_create(
            username=data["username"],
            defaults={
                "fio": data["fio"],
                "role": "student",
                "gpa": data["gpa"],
                "tech_stack": data["stack"],
                "about": data["about"],
                "is_verified": True
            }
        )
        if created:
            user.set_password("123")  # Дефолтный пароль
            user.save()
            print(f"✅ Создан студент: {user.fio}")
        else:
            print(f"🔘 Студент {user.fio} уже существует")

        # Создаем заявку (если еще нет)
        participation, p_created = Participation.objects.get_or_create(
            project=project,
            user=user,
            defaults={
                "cover_letter": data["letter"],
                "is_diploma_request": random.choice([True, False]),
                "status": "pending"
            }
        )

        if p_created:
            print(f"📩 Подана заявка от {user.username}")
        else:
            print(f"⚠️ Заявка от {user.username} уже есть")

    print("\n✨ Готово! Теперь заходи под ментором и запускай AI Анализ.")


if __name__ == '__main__':
    seed()