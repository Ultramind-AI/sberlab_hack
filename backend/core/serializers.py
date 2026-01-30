from rest_framework import serializers
from .models import User, Project, ProjectImage, ProjectResource, Participation, ProjectComment


class UserSerializer(serializers.ModelSerializer):
    portfolio = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'fio', 'role', 'email', 'avatar',
            'about', 'tech_stack', 'telegram', 'github', 'resume', 'portfolio',
            'group_number', 'gpa', 'is_verified'
        ]
        read_only_fields = ['is_verified']

    def get_portfolio(self, obj):
        # ИСПРАВЛЕНИЕ: Ищем через модель Participation
        # Берем проекты, где статус 'accepted' (в команде) или 'completed' (завершил)
        participations = obj.participations.filter(status__in=['accepted', 'completed'])

        return [
            {
                'id': p.project.id,
                'title': p.project.title,
                'status': p.project.status,
                'complexity': p.project.complexity,
                'tech_stack': p.project.tech_stack,
                'grade': p.grade,  # Оценка ментора
                'review': p.mentor_review  # Отзыв ментора
            }
            for p in participations
        ]


class ProjectImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectImage
        fields = ['id', 'image']


class UserShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'fio', 'avatar', 'role', 'gpa', 'group_number', 'tech_stack']


class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectResource
        fields = ['id', 'title', 'url']


class ParticipationSerializer(serializers.ModelSerializer):
    user = UserShortSerializer(read_only=True)

    class Meta:
        model = Participation
        fields = '__all__'



class CommentSerializer(serializers.ModelSerializer):
    author = UserShortSerializer(read_only=True)
    class Meta:
        model = ProjectComment
        fields = ['id', 'author', 'text', 'created_at']


class ProjectSerializer(serializers.ModelSerializer):
    creator = UserShortSerializer(read_only=True)
    mentors = UserShortSerializer(many=True, read_only=True)
    images = serializers.SerializerMethodField()

    # Вычисляемые поля для текущего юзера
    my_status = serializers.SerializerMethodField()
    my_participation_id = serializers.SerializerMethodField()
    can_see_resources = serializers.SerializerMethodField()
    resources = serializers.SerializerMethodField()  # Переопределяем, чтобы скрывать

    # Статистика
    students_count = serializers.SerializerMethodField()

    # Comments
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = '__all__'

    def get_images(self, obj):
        return [{'id': i.id, 'image': i.image.url} for i in obj.images.all()]

    def get_my_status(self, obj):
        user = self.context.get('request').user
        if not user.is_authenticated: return None
        try:
            part = obj.participations.get(user=user)
            return part.status  # 'pending', 'accepted' и т.д.
        except Participation.DoesNotExist:
            return None

    def get_my_participation_id(self, obj):
        user = self.context.get('request').user
        if not user.is_authenticated: return None
        try:
            return obj.participations.get(user=user).id
        except:
            return None

    def get_students_count(self, obj):
        return obj.participations.filter(status='accepted').count()

    def get_can_see_resources(self, obj):
        user = self.context.get('request').user
        if not user.is_authenticated: return False

        # Если юзер ментор или создатель - видит всё
        if user == obj.creator or user in obj.mentors.all():
            return True

        try:
            part = obj.participations.get(user=user)
            # Видит, если принят И (NDA не нужен ИЛИ NDA подписан)
            if part.status == 'accepted':
                if not obj.is_nda_required or part.is_nda_signed:
                    return True
        except:
            pass
        return False

    def get_resources(self, obj):
        if self.get_can_see_resources(obj):
            return ResourceSerializer(obj.resources.all(), many=True).data
        return []  # Пустой список, если нет прав


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        # Поля, которые юзер заполняет при регистрации
        fields = ['username', 'password', 'fio', 'role', 'group_number', 'gpa']

    def create(self, validated_data):
        # create_user - встроенный метод Django, который хеширует пароль
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            fio=validated_data.get('fio', ''),
            role=validated_data.get('role', 'student'),
            group_number=validated_data.get('group_number', ''),
            gpa=validated_data.get('gpa', 0.0)
        )
        return user