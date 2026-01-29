from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Project, ProjectImage


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    # Добавляем новые поля (роль, фио, контакты) в список и в формы редактирования
    list_display = ('username', 'fio', 'role', 'contacts', 'is_staff')
    list_filter = ('role', 'is_staff')

    fieldsets = UserAdmin.fieldsets + (
        ('Доп. информация', {'fields': ('role', 'fio', 'about', 'contacts')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Доп. информация', {'fields': ('role', 'fio', 'about', 'contacts')}),
    )


class ProjectImageInline(admin.TabularInline):
    model = ProjectImage
    extra = 3


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    # 'student' заменяем на метод get_team_count
    list_display = ('title', 'mentor', 'get_team_count', 'max_students', 'status', 'created_at')
    inlines = [ProjectImageInline]
    list_filter = ('status',)
    search_fields = ('title', 'description', 'tech_stack')
    # Чтобы в админке удобно было выбирать студентов в команду
    filter_horizontal = ('students',)

    # Кастомная колонка для отображения текущего кол-ва человек в команде
    def get_team_count(self, obj):
        return f"{obj.students.count()}"

    get_team_count.short_description = "В команде"