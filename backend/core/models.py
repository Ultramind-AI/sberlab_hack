from ckeditor.fields import RichTextField
from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    ROLE_CHOICES = (('student', 'Студент'), ('mentor', 'Ментор'))
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    fio = models.CharField(max_length=255, verbose_name="ФИО", blank=True)

    # --- НОВЫЕ ПОЛЯ ПРОФИЛЯ ---
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True, verbose_name="Аватар")
    about = models.TextField(verbose_name="О себе", blank=True)
    tech_stack = models.CharField(max_length=500, verbose_name="Стек (Python, React...)", blank=True)

    # Соцсети
    telegram = models.CharField(max_length=100, verbose_name="Telegram (@user)", blank=True)
    github = models.URLField(verbose_name="GitHub / Portfolio", blank=True)

    # Контакты (старое поле можно оставить или убрать, telegram теперь приоритетнее)
    contacts = models.CharField(max_length=255, verbose_name="Другие контакты", blank=True)

    def __str__(self):
        return self.username


class Project(models.Model):
    STATUS_CHOICES = (('open', 'Набор открыт'), ('in_progress', 'В работе'), ('done', 'Архив'))

    # Новые Enums
    COMPLEXITY_CHOICES = (
        ('easy', '🟢 Легкий'),
        ('medium', '🟡 Средний'),
        ('hard', '🔴 Сложный'),
    )
    URGENCY_CHOICES = (
        ('low', 'Спокойно'),
        ('medium', 'Срочно'),
        ('high', '🔥 Горит'),
    )

    title = models.CharField(max_length=200, verbose_name="Название")

    description = models.TextField(verbose_name="Краткое описание")
    full_description = RichTextField(verbose_name="Полное ТЗ", blank=True)
    video_url = models.URLField(blank=True, verbose_name="Ссылка на YouTube")
    tech_stack = models.CharField(max_length=200, verbose_name="Стек")
    mentor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_projects')
    students = models.ManyToManyField(User, related_name='joined_projects', blank=True)
    max_students = models.IntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)

    # --- НОВЫЕ ПОЛЯ ---
    complexity = models.CharField(max_length=10, choices=COMPLEXITY_CHOICES, default='medium', verbose_name="Сложность")
    urgency = models.CharField(max_length=10, choices=URGENCY_CHOICES, default='medium', verbose_name="Срочность")
    deadline = models.DateField(null=True, blank=True, verbose_name="Дедлайн (пусто = бессрочно)")

    def __str__(self):
        return self.title


class ProjectImage(models.Model):
    project = models.ForeignKey(Project, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='project_gallery/')

    def __str__(self):
        return f"Фото для {self.project.title}"