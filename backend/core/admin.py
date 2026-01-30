from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Project, ProjectImage, Participation, ProjectResource


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    # Убираем 'contacts' из list_display, так как такого поля нет в модели
    list_display = ('username', 'fio', 'role', 'group_number', 'gpa', 'is_verified', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_verified')

    fieldsets = UserAdmin.fieldsets + (
        ('Доп. информация',
         {'fields': ('role', 'fio', 'about', 'tech_stack', 'telegram', 'github', 'resume', 'avatar')}),
        ('Академическая информация', {'fields': ('group_number', 'gpa', 'is_verified')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Доп. информация',
         {'fields': ('role', 'fio', 'about', 'tech_stack', 'telegram', 'github', 'resume', 'avatar')}),
        ('Академическая информация', {'fields': ('group_number', 'gpa', 'is_verified')}),
    )


class ProjectImageInline(admin.TabularInline):
    model = ProjectImage
    extra = 3


class ProjectResourceInline(admin.TabularInline):
    model = ProjectResource
    extra = 1


class ParticipationInline(admin.TabularInline):
    model = Participation
    extra = 0
    readonly_fields = ('created_at', 'cover_letter', 'is_diploma_request', 'is_nda_signed')
    can_delete = False


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    # Обновляем list_display согласно новой модели
    list_display = ('title', 'get_creator', 'get_students_count', 'max_students', 'status', 'created_at')
    inlines = [ProjectImageInline, ProjectResourceInline, ParticipationInline]
    list_filter = ('status', 'complexity', 'urgency')
    search_fields = ('title', 'description', 'tech_stack')

    # Убираем filter_horizontal для students, так как его больше нет
    # Вместо этого добавляем filter_horizontal для mentors
    filter_horizontal = ('mentors',)

    # Кастомные методы для отображения
    def get_creator(self, obj):
        return obj.creator.fio if obj.creator else '-'

    get_creator.short_description = "Создатель"

    def get_students_count(self, obj):
        # Считаем количество принятых студентов через Participation
        return obj.participations.filter(status='accepted').count()

    get_students_count.short_description = "Студентов"


# Регистрируем остальные модели
admin.site.register(Participation)
admin.site.register(ProjectResource)