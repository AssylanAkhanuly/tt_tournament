from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Club, ClubAdmin, ClubTable
from .serializers import ClubAdminSerializer, ClubSerializer, ClubTableSerializer

User = get_user_model()


def _is_club_admin(user, club):
    return user.is_authenticated and club.is_admin(user)


# ─── Club CRUD ────────────────────────────────────────────────────────────────

class ClubListCreateView(generics.ListCreateAPIView):
    """GET: public list · POST: is_staff only"""
    serializer_class   = ClubSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Club.objects.prefetch_related('admin_memberships', 'tables', 'tournaments')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def create(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response(
                {"detail": "Только суперадминистраторы могут создавать клубы."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = ClubSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        club = serializer.save(created_by=request.user)
        # Auto-add creator as club admin
        ClubAdmin.objects.create(club=club, user=request.user, added_by=request.user)
        return Response(
            ClubSerializer(club, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class ClubDetailView(APIView):
    """GET: public · PATCH: club admin · DELETE: is_staff"""

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_object(self, pk):
        return get_object_or_404(Club, pk=pk)

    def get(self, request, pk):
        club = self.get_object(pk)
        return Response(ClubSerializer(club, context={'request': request}).data)

    def patch(self, request, pk):
        club = self.get_object(pk)
        if not _is_club_admin(request.user, club):
            return Response({"detail": "Только администраторы клуба."}, status=status.HTTP_403_FORBIDDEN)
        serializer = ClubSerializer(club, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ClubSerializer(club, context={'request': request}).data)

    def delete(self, request, pk):
        club = self.get_object(pk)
        if not request.user.is_staff:
            return Response({"detail": "Только суперадминистраторы."}, status=status.HTTP_403_FORBIDDEN)
        club.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Table management ─────────────────────────────────────────────────────────

class ClubTableListCreateView(APIView):
    """GET: public · POST: club admin"""

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_club(self, pk):
        return get_object_or_404(Club, pk=pk)

    def get(self, request, pk):
        club = self.get_club(pk)
        tables = club.tables.all().order_by('number')
        return Response(ClubTableSerializer(tables, many=True).data)

    def post(self, request, pk):
        club = self.get_club(pk)
        if not _is_club_admin(request.user, club):
            return Response({"detail": "Только администраторы клуба."}, status=status.HTTP_403_FORBIDDEN)

        number = request.data.get('number')
        name   = request.data.get('name', '').strip()

        if number is None:
            return Response({"detail": "Укажите номер стола."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            number = int(number)
            if number < 1:
                raise ValueError
        except (TypeError, ValueError):
            return Response({"detail": "Номер стола должен быть положительным числом."}, status=400)

        if ClubTable.objects.filter(club=club, number=number).exists():
            return Response({"detail": f"Стол №{number} уже существует в этом клубе."}, status=400)

        table = ClubTable.objects.create(club=club, number=number, name=name)
        return Response(ClubTableSerializer(table).data, status=status.HTTP_201_CREATED)


class ClubTableDetailView(APIView):
    """PATCH / DELETE: club admin"""
    permission_classes = [IsAuthenticated]

    def get_objects(self, club_pk, table_pk):
        club  = get_object_or_404(Club, pk=club_pk)
        table = get_object_or_404(ClubTable, pk=table_pk, club=club)
        return club, table

    def patch(self, request, pk, table_id):
        club, table = self.get_objects(pk, table_id)
        if not _is_club_admin(request.user, club):
            return Response({"detail": "Только администраторы клуба."}, status=status.HTTP_403_FORBIDDEN)
        serializer = ClubTableSerializer(table, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ClubTableSerializer(table).data)

    def delete(self, request, pk, table_id):
        club, table = self.get_objects(pk, table_id)
        if not _is_club_admin(request.user, club):
            return Response({"detail": "Только администраторы клуба."}, status=status.HTTP_403_FORBIDDEN)
        table.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Admin management ─────────────────────────────────────────────────────────

class ClubAdminListCreateView(APIView):
    """GET / POST: club admin"""
    permission_classes = [IsAuthenticated]

    def get_club(self, pk):
        return get_object_or_404(Club, pk=pk)

    def get(self, request, pk):
        club = self.get_club(pk)
        if not _is_club_admin(request.user, club):
            return Response({"detail": "Только администраторы клуба."}, status=status.HTTP_403_FORBIDDEN)
        admins = club.admin_memberships.select_related('user').order_by('added_at')
        return Response(ClubAdminSerializer(admins, many=True).data)

    def post(self, request, pk):
        club = self.get_club(pk)
        if not _is_club_admin(request.user, club):
            return Response({"detail": "Только администраторы клуба."}, status=status.HTTP_403_FORBIDDEN)

        phone = request.data.get('phone', '').strip()
        if not phone:
            return Response({"detail": "Укажите номер телефона."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(phone=phone).first()
        if not user:
            return Response({"detail": "Пользователь с таким номером не найден."}, status=status.HTTP_404_NOT_FOUND)

        membership, created = ClubAdmin.objects.get_or_create(
            club=club, user=user,
            defaults={'added_by': request.user},
        )
        return Response(
            ClubAdminSerializer(membership).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class ClubAdminRemoveView(APIView):
    """DELETE: club admin (cannot remove last admin)"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk, admin_id):
        club = get_object_or_404(Club, pk=pk)
        if not _is_club_admin(request.user, club):
            return Response({"detail": "Только администраторы клуба."}, status=status.HTTP_403_FORBIDDEN)
        membership = get_object_or_404(ClubAdmin, pk=admin_id, club=club)
        if club.admin_memberships.count() <= 1:
            return Response(
                {"detail": "Нельзя удалить последнего администратора клуба."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        membership.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── My clubs ─────────────────────────────────────────────────────────────────

class MyClubsView(generics.ListAPIView):
    """GET /api/clubs/my/ — clubs where current user is admin"""
    serializer_class   = ClubSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Club.objects.all()
        club_ids = user.club_admin_roles.values_list('club_id', flat=True)
        return Club.objects.filter(id__in=club_ids)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx
