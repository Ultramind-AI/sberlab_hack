from django.db import models
from django.contrib.auth.models import AbstractUser
from ckeditor.fields import RichTextField


class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Студент'),
        ('mentor', 'Ментор (Сбер)'),
        ('teacher', 'Преподаватель (НГУ)'),
        ('hr', 'HR')
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    fio = models.CharField(max_length=255, verbose_name="ФИО", blank=True)

    # Верификация
    group_number = models.CharField(max_length=20, blank=True)
    gpa = models.FloatField(default=0.0, verbose_name="Средний балл")
    is_verified = models.BooleanField(default=False)

    # Профиль
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    about = models.TextField(blank=True)
    tech_stack = models.CharField(max_length=500, blank=True)
    telegram = models.CharField(max_length=100, blank=True)
    github = models.URLField(blank=True)
    resume = models.FileField(upload_to='resumes/', null=True, blank=True)

    def __str__(self):
        return self.fio or self.username


class Project(models.Model):
    STATUS_CHOICES = (('open', 'Набор открыт'), ('in_progress', 'В работе'), ('done', 'Завершен'))
    COMPLEXITY_CHOICES = (('easy', '🟢 Легкий'), ('medium', '🟡 Средний'), ('hard', '🔴 Сложный'))
    URGENCY_CHOICES = (('low', 'Спокойно'), ('medium', 'Срочно'), ('high', '🔥 Горит'))

    title = models.CharField(max_length=200)
    description = models.TextField(verbose_name="Краткое описание")
    full_description = RichTextField(blank=True)
    tech_stack = models.CharField(max_length=200)

    # КОМАНДА ПРОЕКТА
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_projects')
    mentors = models.ManyToManyField(User, related_name='mentored_projects', verbose_name="Менторы")

    # НАСТРОЙКИ
    max_students = models.IntegerField(default=3)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    complexity = models.CharField(max_length=10, choices=COMPLEXITY_CHOICES, default='medium')
    urgency = models.CharField(max_length=10, choices=URGENCY_CHOICES, default='medium')
    deadline = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # НОВЫЕ ПОЛЯ (БИЗНЕС-ЛОГИКА)
    is_nda_required = models.BooleanField(default=False, verbose_name="Требуется NDA")
    is_diploma_allowed = models.BooleanField(default=False, verbose_name="Можно как диплом")

    def __str__(self):
        return self.title


class ProjectImage(models.Model):
    project = models.ForeignKey(Project, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='project_gallery/')


# ССЫЛКИ НА РЕСУРСЫ (ВИДНЫ ТОЛЬКО ПОСЛЕ NDA)
class ProjectResource(models.Model):
    project = models.ForeignKey(Project, related_name='resources', on_delete=models.CASCADE)
    title = models.CharField(max_length=100)  # "Jira", "GitHub", "Макеты"
    url = models.URLField()

    def __str__(self):
        return f"{self.title} -> {self.project.title}"


# ЗАЯВКА И УЧАСТИЕ
class Participation(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Заявка подана'),
        ('accepted', 'Принят в команду'),
        ('rejected', 'Отклонен'),
        ('completed', 'Успешно завершил')
    )

    project = models.ForeignKey(Project, related_name='participations', on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name='participations', on_delete=models.CASCADE)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # Данные заявки
    cover_letter = models.TextField(verbose_name="Мотивационное письмо", blank=True)
    is_diploma_request = models.BooleanField(default=False, verbose_name="Хочу как диплом")

    # Юридическая часть
    is_nda_signed = models.BooleanField(default=False, verbose_name="NDA Подписан")

    # Итоги (для портфолио)
    mentor_review = models.TextField(blank=True, verbose_name="Отзыв ментора")
    grade = models.IntegerField(null=True, blank=True, verbose_name="Оценка (1-5)")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('project', 'user')  # Один юзер - одна заявка на проект