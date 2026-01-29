from rest_framework import serializers
from .models import User, Project, ProjectImage


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'fio', 'role', 'email', 'avatar', 'about', 'tech_stack', 'telegram', 'github']


class ProjectImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectImage
        fields = ['id', 'image']


class ProjectSerializer(serializers.ModelSerializer):
    mentor_info = UserSerializer(source='mentor', read_only=True)
    students_info = UserSerializer(source='students', many=True, read_only=True)
    images = ProjectImageSerializer(many=True, read_only=True)
    is_joined = serializers.SerializerMethodField()
    match_score = serializers.SerializerMethodField()  # <--- AI Match

    class Meta:
        model = Project
        fields = '__all__'
        extra_kwargs = {'mentor': {'read_only': True}}

    def get_is_joined(self, obj):
        user = self.context.get('request').user
        if user and user.is_authenticated:
            return obj.students.filter(id=user.id).exists()
        return False

    # ЛОГИКА РЕКОМЕНДАЦИЙ
    def get_match_score(self, obj):
        user = self.context.get('request').user
        if not user or not user.is_authenticated or not user.tech_stack:
            return 0

        # Нормализуем теги (в нижний регистр, убираем пробелы)
        user_tags = set(t.strip().lower() for t in user.tech_stack.split(',') if t.strip())
        project_tags = set(t.strip().lower() for t in obj.tech_stack.split(',') if t.strip())

        if not project_tags:
            return 0

        # Считаем пересечение
        intersection = user_tags.intersection(project_tags)
        # Формула: (совпавшие / всего_в_проекте) * 100
        score = int((len(intersection) / len(project_tags)) * 100)
        return min(100, score)