import json
import ast
import re

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.db import connection
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_GET
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from gigachat import GigaChat
from rest_framework import generics
from rest_framework.permissions import AllowAny

from .models import User, Project, ProjectComment, Participation, ProjectResource
from .serializers import UserSerializer, ProjectSerializer, ParticipationSerializer, UserRegistrationSerializer


@require_GET
def health(request):
    """Return 200 only when Django can execute a query against its database."""
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
            cursor.fetchone()
    except Exception:
        return JsonResponse({'status': 'error', 'database': 'unavailable'}, status=503)

    return JsonResponse({'status': 'ok', 'database': 'ok'})


def get_gigachat_credentials():
    credentials = getattr(settings, 'GIGACHAT_CREDENTIALS', '').strip()
    if not credentials:
        raise ImproperlyConfigured('GIGACHAT_CREDENTIALS must be set in .env')
    return credentials


class CustomAuthToken(ObtainAuthToken):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

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

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def verify_student(self, request, pk=None):
        if request.user.role != 'teacher' and not request.user.is_staff:
            return Response({'error': 'Только сотрудники ВУЗа могут верифицировать студентов'},
                            status=status.HTTP_403_FORBIDDEN)

        student = self.get_object()

        new_gpa = request.data.get('gpa')
        if new_gpa:
            student.gpa = float(new_gpa)

        student.is_verified = True
        student.save()

        return Response({'status': 'success', 'message': f'Студент {student.fio} подтвержден', 'gpa': student.gpa})


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        project = serializer.save(creator=self.request.user)
        project.mentors.add(self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def apply(self, request, pk=None):
        project = self.get_object()
        user = request.user

        if user.role != 'student':
            return Response({'error': 'Только студенты подают заявки'}, status=400)

        if Participation.objects.filter(project=project, user=user).exists():
            return Response({'error': 'Заявка уже подана'}, status=400)

        Participation.objects.create(
            project=project,
            user=user,
            cover_letter=request.data.get('cover_letter', ''),
            is_diploma_request=request.data.get('is_diploma', False),
            status='pending'
        )
        return Response({'status': 'success', 'message': 'Заявка отправлена ментору'})

    @action(detail=True, methods=['post'])
    def sign_nda(self, request, pk=None):
        project = self.get_object()
        part = get_object_or_404(Participation, project=project, user=request.user)

        if part.status != 'accepted':
            return Response({'error': 'Вас еще не приняли в команду'}, status=400)

        part.is_nda_signed = True
        part.save()
        return Response({'status': 'success', 'message': 'NDA подписан. Доступы открыты.'})

    @action(detail=True, methods=['get'])
    def candidates(self, request, pk=None):
        project = self.get_object()
        if request.user not in project.mentors.all() and request.user != project.creator:
            return Response({'error': 'Доступ запрещен'}, status=403)

        parts = Participation.objects.filter(project=project).order_by('created_at')
        serializer = ParticipationSerializer(parts, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path=r'manage_candidate/(?P<part_id>\d+)')
    def manage_candidate(self, request, pk=None, part_id=None):
        project = self.get_object()
        if request.user not in project.mentors.all():
            return Response({'error': 'Вы не ментор этого проекта'}, status=403)

        part = get_object_or_404(Participation, id=part_id, project=project)
        action_type = request.data.get('action')

        if action_type == 'accept':
            current_count = project.participations.filter(status='accepted').count()
            if current_count >= project.max_students:
                return Response({'error': 'Команда уже полная'}, status=400)

            part.status = 'accepted'
        elif action_type == 'reject':
            part.status = 'rejected'
        else:
            return Response({'error': 'Неверное действие'}, status=400)

        part.save()
        return Response({'status': 'success', 'new_status': part.status})

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def generate_ai(self, request):
        user_prompt = request.data.get('prompt', '')
        if not user_prompt:
            return Response({'error': 'Опишите идею'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            giga = GigaChat(credentials=get_gigachat_credentials(), verify_ssl_certs=False)

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

            clean_json = content.replace('```json', '').replace('```', '').strip()

            try:
                data = json.loads(clean_json)
            except json.JSONDecodeError:
                try:
                    data = ast.literal_eval(clean_json)
                except Exception:
                    print(f"FAILED TO PARSE JSON: {clean_json}")
                    return Response({'error': 'Не удалось обработать ответ ИИ'},
                                    status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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

    @action(detail=True, methods=['post'])
    def add_resource(self, request, pk=None):
        project = self.get_object()
        if request.user != project.creator and request.user not in project.mentors.all():
            return Response({'error': 'Нет прав'}, status=403)

        ProjectResource.objects.create(
            project=project,
            title=request.data.get('title'),
            url=request.data.get('url')
        )
        return Response({'status': 'added'})

    @action(detail=True, methods=['post'])
    def kick_student(self, request, pk=None):
        project = self.get_object()
        if request.user != project.creator and request.user not in project.mentors.all():
            return Response({'error': 'Нет прав'}, status=403)

        student_id = request.data.get('student_id')
        Participation.objects.filter(project=project, user_id=student_id).delete()

        return Response({'status': 'kicked', 'message': 'Студент исключен из команды'})

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        project = self.get_object()
        if request.user != project.creator:
            return Response({'error': 'Только создатель может архивировать'}, status=403)

        project.status = 'done'
        project.save()
        return Response({'status': 'archived'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def add_comment(self, request, pk=None):
        project = self.get_object()
        text = request.data.get('text')
        if not text: return Response({'error': 'Пустой текст'}, status=400)

        ProjectComment.objects.create(project=project, author=request.user, text=text)
        return Response({'status': 'comment added'})

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        project = self.get_object()
        if request.user != project.creator: return Response({'error': 'Нет прав'}, status=403)
        project.status = 'open'
        project.save()
        return Response({'status': 'restored'})

    @action(detail=True, methods=['post'])
    def complete_project(self, request, pk=None):
        project = self.get_object()
        if request.user != project.creator and request.user not in project.mentors.all():
            return Response({'error': 'Нет прав'}, status=403)

        reviews_data = request.data.get('reviews', [])

        for item in reviews_data:
            try:
                part = Participation.objects.get(project=project, user_id=item['user_id'], status='accepted')
                part.grade = item['grade']
                part.mentor_review = item['review']
                part.status = 'completed'
                part.save()
            except Participation.DoesNotExist:
                continue

        project.status = 'done'
        project.save()
        return Response({'status': 'project completed'})

    @action(detail=True, methods=['post'])
    def analyze_candidates(self, request, pk=None):
        project = self.get_object()
        candidates = Participation.objects.filter(project=project, status='pending')

        if not candidates.exists():
            return Response({'error': 'Нет заявок для анализа'}, status=400)

        candidates_list_str = ""
        for p in candidates:
            candidates_list_str += (
                f"- ID {p.id}: {p.user.fio}, Стек: {p.user.tech_stack}, GPA: {p.user.gpa}, Письмо: {p.cover_letter}\n"
            )

        system_prompt = (
            f"Ты — AI-рекрутер Сбера. Проанализируй кандидатов для проекта: {project.title}.\n"
            f"Стек проекта: {project.tech_stack}.\n\n"
            f"КАНДИДАТЫ:\n{candidates_list_str}\n"
            "Верни СТРОГО JSON список объектов без лишнего текста, пояснений и ковычек кода.\n"
            "Используй ДВОЙНЫЕ кавычки для ключей и значений.\n"
            "Формат: [{\"id\": 1, \"score\": 85, \"reason\": \"Кратко почему\"}, ...]"
        )

        try:
            giga = GigaChat(credentials=get_gigachat_credentials(), verify_ssl_certs=False)
            response = giga.chat(system_prompt)
            content = response.choices[0].message.content

            match = re.search(r'\[.*\]', content, re.DOTALL)
            if match:
                clean_json = match.group()
            else:
                clean_json = content.replace('```json', '').replace('```', '').strip()

            try:
                analysis_data = json.loads(clean_json)
            except json.JSONDecodeError:
                try:
                    analysis_data = ast.literal_eval(clean_json)
                except Exception:
                    print(f"RAW CONTENT FROM AI: {content}")
                    raise ValueError("AI вернул нечитаемый формат")

            return Response(analysis_data)

        except Exception as e:
            print(f"GigaChat Analysis Error: {e}")
            return Response({'error': f'Ошибка AI: {str(e)}'}, status=500)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer
