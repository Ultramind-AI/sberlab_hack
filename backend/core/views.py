import json
import ast
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from .models import User, Project
from .serializers import UserSerializer, ProjectSerializer
from gigachat import GigaChat

GIGACHAT_CREDENTIALS = "MDE5YWM1ZGYtMTRlYy03NmVjLTllYzAtOTY4OGU3MGVkMjU5OjllZDEyMDBhLTkxY2QtNGVlMy1iNTg1LWI3ZmQ3ZDg3NjVlMA=="


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

    # --- НОВЫЙ МЕТОД ДЛЯ AI ГЕНЕРАЦИИ ---
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def generate_ai(self, request):
        user_prompt = request.data.get('prompt', '')
        if not user_prompt:
            return Response({'error': 'Опишите идею'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            giga = GigaChat(credentials=GIGACHAT_CREDENTIALS, verify_ssl_certs=False)

            # Обновленный промпт с жестким требованием двойных кавычек
            system_prompt = (
                "Ты — Tech Lead. Твоя задача — создать структуру проекта для хакатона на основе идеи. "
                "Верни ответ ТОЛЬКО в формате JSON. Не пиши никакого вступительного текста.\n"
                "Используй ДВОЙНЫЕ кавычки для ключей и значений.\n"
                "Структура:\n"
                "{\n"
                "  \"title\": \"Короткое название\",\n"
                "  \"description\": \"Краткое описание (1-2 предложения)\",\n"
                "  \"full_description\": \"<p>Подробное описание с HTML тегами.</p><ul><li>Задача 1</li><li>Задача 2</li></ul>\",\n"
                "  \"tech_stack\": \"Python, React, PostgreSQL\",\n"
                "  \"complexity\": \"medium\",\n"
                "  \"urgency\": \"medium\",\n"
                "  \"max_students\": 3\n"
                "}\n"
                f"Идея: {user_prompt}"
            )

            response = giga.chat(system_prompt)
            content = response.choices[0].message.content

            # 1. Очистка от Markdown (если ИИ обернул в ```json ... ```)
            clean_json = content.replace('```json', '').replace('```', '').strip()

            # 2. Попытка парсинга
            try:
                # Сначала пробуем как стандартный JSON
                data = json.loads(clean_json)
            except json.JSONDecodeError:
                # Если ИИ использовал одинарные кавычки (частая ошибка), пробуем ast.literal_eval
                try:
                    data = ast.literal_eval(clean_json)
                except Exception:
                    # Если совсем всё плохо, возвращаем ошибку, но печатаем ответ в консоль сервера
                    print(f"FAILED TO PARSE JSON: {clean_json}")
                    return Response({'error': 'Не удалось обработать ответ ИИ'},
                                    status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Убедимся, что все поля есть (ставим дефолтные, если ИИ забыл)
            final_data = {
                'title': data.get('title', 'Новый проект'),
                'description': data.get('description', ''),
                'full_description': data.get('full_description', ''),
                'tech_stack': data.get('tech_stack', ''),
                'complexity': data.get('complexity', 'medium'),
                'urgency': data.get('urgency', 'medium'),
                'max_students': data.get('max_students', 3),
            }

            return Response(final_data)

        except Exception as e:
            print(f"GigaChat Error: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def join(self, request, pk=None):
        project = self.get_object()
        user = request.user

        if user.role != 'student':
            return Response({'error': 'Только студенты могут вступать в команды'}, status=status.HTTP_400_BAD_REQUEST)

        if project.students.filter(id=user.id).exists():
            return Response({'error': 'Вы уже участник этого проекта'}, status=status.HTTP_400_BAD_REQUEST)

        if project.students.count() >= project.max_students:
            return Response({'error': 'В команде больше нет мест'}, status=status.HTTP_400_BAD_REQUEST)

        project.students.add(user)

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

        if project.status == 'in_progress':
            project.status = 'open'

        project.save()
        return Response({'status': 'success', 'message': 'Вы покинули команду'})