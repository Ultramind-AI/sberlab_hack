from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from .models import User, Project
from .serializers import UserSerializer, ProjectSerializer


class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'role': user.role,
            'fio': user.fio
        })


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [TokenAuthentication]


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(mentor=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def join(self, request, pk=None):
        project = self.get_object()
        user = request.user

        # 1. Проверяем роль
        if user.role != 'student':
            return Response({'error': 'Только студенты могут вступать в команды'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Проверяем, не записан ли он уже (используем students во множественном числе)
        if project.students.filter(id=user.id).exists():
            return Response({'error': 'Вы уже участник этого проекта'}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Проверяем наличие мест
        if project.students.count() >= project.max_students:
            return Response({'error': 'В команде больше нет мест'}, status=status.HTTP_400_BAD_REQUEST)

        # 4. Добавляем в ManyToMany поле
        project.students.add(user)

        # Если места закончились — меняем статус
        if project.students.count() >= project.max_students:
            project.status = 'in_progress'

        project.save()
        return Response({'status': 'success', 'message': 'Вы добавлены в команду'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def leave(self, request, pk=None):
        project = self.get_object()
        user = request.user

        if not project.students.filter(id=user.id).exists():
            return Response({'error': 'Вы не являетесь участником этого проекта'}, status=status.HTTP_400_BAD_REQUEST)

        project.students.remove(user)

        # Если кто-то ушел, и проект был "в работе" — открываем набор снова
        if project.status == 'in_progress':
            project.status = 'open'

        project.save()
        return Response({'status': 'success', 'message': 'Вы покинули команду'})