from django.core.management.base import BaseCommand

from core.models import Participation, Project, ProjectResource, User


DEMO_USERS = (
    {
        'username': 'admin',
        'password': 'admin',
        'role': 'hr',
        'fio': 'Администратор SberLab',
        'is_staff': True,
        'is_superuser': True,
    },
    {
        'username': 'mentor',
        'password': 'Aa12345678!',
        'role': 'mentor',
        'fio': 'Алексей Смирнов',
        'tech_stack': 'Python, Django, Docker, PostgreSQL',
    },
    {
        'username': 'student',
        'password': 'Aa12345678',
        'role': 'student',
        'fio': 'Мария Петрова',
        'group_number': '23201',
        'gpa': 4.7,
        'is_verified': True,
        'tech_stack': 'React, JavaScript, Python',
    },
    {
        'username': 'hr',
        'password': 'Aa12345678',
        'role': 'hr',
        'fio': 'Елена Волкова',
    },
    {
        'username': 'teacher',
        'password': 'Aa12345678',
        'role': 'teacher',
        'fio': 'Сергей Кузнецов',
    },
)


class Command(BaseCommand):
    help = 'Create deterministic demo users, projects, and participation data.'

    def handle(self, *args, **options):
        users = {}
        for user_data in DEMO_USERS:
            password = user_data['password']
            defaults = {key: value for key, value in user_data.items() if key not in {'username', 'password'}}
            user, _ = User.objects.update_or_create(
                username=user_data['username'],
                defaults=defaults,
            )
            user.set_password(password)
            user.save(update_fields=['password'])
            users[user.username] = user

        projects = (
            {
                'title': 'Безопасный учебный API',
                'description': 'Тренировочный сервис для изучения API и практики безопасного тестирования.',
                'full_description': '<p>Разработать API, документацию и набор сценариев проверки.</p>',
                'tech_stack': 'Python, Django REST Framework, Docker',
                'status': 'open',
                'complexity': 'medium',
                'urgency': 'medium',
                'max_students': 4,
                'is_nda_required': False,
                'is_diploma_allowed': True,
                'scientific_value': 'Сравнение подходов к автоматизированной проверке безопасности API.',
            },
            {
                'title': 'Аналитика проектных команд',
                'description': 'Дашборд для анализа навыков и участия студентов в проектах.',
                'full_description': '<p>Подготовить интерфейс аналитики и демонстрационный набор данных.</p>',
                'tech_stack': 'React, Django, Recharts',
                'status': 'in_progress',
                'complexity': 'hard',
                'urgency': 'low',
                'max_students': 3,
                'is_nda_required': True,
                'is_diploma_allowed': True,
                'scientific_value': 'Исследование факторов успешности студенческих проектных команд.',
            },
        )

        created_projects = []
        for project_data in projects:
            project, _ = Project.objects.update_or_create(
                title=project_data['title'],
                defaults={**project_data, 'creator': users['mentor']},
            )
            project.mentors.set([users['mentor']])
            created_projects.append(project)

        Participation.objects.update_or_create(
            project=created_projects[0],
            user=users['student'],
            defaults={
                'status': 'pending',
                'cover_letter': 'Хочу помочь с API и автоматизацией проверок.',
                'is_diploma_request': True,
                'is_nda_signed': False,
            },
        )
        Participation.objects.update_or_create(
            project=created_projects[1],
            user=users['student'],
            defaults={
                'status': 'accepted',
                'cover_letter': 'Готова разработать интерфейс аналитики.',
                'is_diploma_request': False,
                'is_nda_signed': True,
            },
        )
        ProjectResource.objects.update_or_create(
            project=created_projects[1],
            title='Учебный репозиторий',
            defaults={'url': 'https://example.com/sberlab-demo'},
        )

        self.stdout.write(self.style.SUCCESS('Demo data is ready.'))
