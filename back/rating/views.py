"""API Национального рейтинга.

Пять ручек: список, карточка, коэффициенты (чтение и правка), предпросчёт для
калибровки и фиксация неявки. Расчёта здесь нет — он в `engine.py`, сборка в
`services.py`; вьюха только принимает запрос и отдаёт ответ.

Рейтинг открыт без входа (ТЗ §3, экран Э0.4): таблица и карточка спортсмена —
публичные страницы. Правка коэффициентов и фиксация неявки — только федерация.
"""
from dataclasses import asdict

from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from . import analysis, engine, services
from .models import RatingEntry, RatingParams, RatingProfile
from .serializers import (
    PreviewRequestSerializer,
    RatingEntrySerializer,
    RatingParamsSerializer,
    RatingProfileSerializer,
)

#: Э0.4: «таблица с фильтрами, постранично до 500 строк».
PAGE_SIZE_MAX = 500
PAGE_SIZE_DEFAULT = 100


class RatingListView(APIView):
    """Рейтинг-лист.

    Возрастные категории — выборка из общего рейтинга, а не отдельный рейтинг
    (п. 7.2–7.3): фильтр `age` сужает список, значения при этом те же.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        qs = RatingProfile.objects.select_related("user")

        sex = request.query_params.get("sex")
        if sex:
            qs = qs.filter(sex=sex)

        region = request.query_params.get("region")
        if region:
            qs = qs.filter(region__icontains=region)

        state = request.query_params.get("status")
        if state:
            qs = qs.filter(status=state)
        elif request.query_params.get("all") != "1":
            # По умолчанию лист активный: неактивные исключаются из текущей
            # таблицы (п. 18.2), но остаются доступны через ?status=inactive.
            qs = qs.exclude(status__in=[engine.STATUS_INACTIVE, engine.STATUS_VOID])

        search = request.query_params.get("q")
        if search:
            qs = qs.filter(Q(user__name__icontains=search) | Q(region__icontains=search))

        age = request.query_params.get("age")
        if age:
            qs = _filter_age(qs, age)

        qs = qs.order_by("-value", "user__name")
        total = qs.count()

        try:
            size = min(int(request.query_params.get("page_size", PAGE_SIZE_DEFAULT)), PAGE_SIZE_MAX)
            page = max(1, int(request.query_params.get("page", 1)))
        except (TypeError, ValueError):
            size, page = PAGE_SIZE_DEFAULT, 1

        rows = qs[(page - 1) * size: page * size]
        return Response(
            {
                "count": total,
                "page": page,
                "page_size": size,
                "results": RatingProfileSerializer(rows, many=True).data,
                # Публикации снимками нет — решение владельца продукта
                # (10.09.2026): значение живое, «опубликовано» это дата расчёта.
                "updated_at": qs.order_by("-updated_at").values_list("updated_at", flat=True).first(),
            }
        )


def _filter_age(qs, age: str):
    """Отобрать по возрастной ступени: год соревнования минус год рождения (п. 7.4)."""
    from datetime import date

    year = date.today().year
    for name, top in (("U11", 10), ("U13", 12), ("U15", 14), ("U17", 16), ("U19", 18), ("U21", 20)):
        if name == age.upper():
            return qs.filter(birth_year__gte=year - top).exclude(birth_year__isnull=True)
    return qs


class RatingCardView(APIView):
    """Карточка спортсмена: значение, счётчики и история изменений (п. 19–20)."""

    permission_classes = [AllowAny]

    def get(self, request, user_id):
        profile = RatingProfile.objects.select_related("user").filter(user_id=user_id).first()
        if not profile:
            return Response({"detail": "Рейтинговой карточки нет"}, status=status.HTTP_404_NOT_FOUND)

        history = profile.entries.select_related("tournament", "opponent")
        if request.query_params.get("with_reverted") != "1":
            history = history.filter(is_reverted=False)

        # Место в листе: выше балл — выше место, при равенстве по алфавиту.
        better = RatingProfile.objects.filter(value__gt=profile.value).count()
        of = RatingProfile.objects.exclude(status__in=[engine.STATUS_VOID]).count()

        return Response(
            {
                "profile": RatingProfileSerializer(profile).data,
                "history": RatingEntrySerializer(history, many=True).data,
                "place": better + 1,
                "of": of,
            }
        )


class RatingParamsView(APIView):
    """Коэффициенты расчёта: читать может любой, править — федерация.

    Читать открыто намеренно: рядом с рейтингом должно быть видно, по каким
    числам он посчитан, иначе «прозрачность» из п. 4.6 не работает.
    """

    def get_permissions(self):
        return [AllowAny()] if self.request.method == "GET" else [IsAdminUser()]

    def get(self, request):
        return Response(RatingParamsSerializer(RatingParams.active()).data)

    def patch(self, request):
        params = RatingParams.active()
        serializer = RatingParamsSerializer(params, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        return Response(serializer.data)


class RatingPreviewView(APIView):
    """Предпросчёт: считает присланный набор и ничего не сохраняет.

    Ручка калибровки — федерация крутит коэффициенты и смотрит, что получится.
    Движок тот же, что и боевой: иначе подобранные числа не значили бы ничего.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PreviewRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        result, used = services.preview(
            players=data["players"],
            tournaments=data["tournaments"],
            matches=data["matches"],
            params=data.get("params"),
        )
        return Response(
            {
                "history": [asdict(r) for r in result.history],
                "table": [asdict(r) for r in result.table],
                "injected": result.injected,
                "skipped": result.skipped,
                # Что выбранные коэффициенты значат на практике: доля ожидаемых
                # побед и путь новичка до уровня КМС. Считается здесь, потому
                # что это та же формула п. 9.3 — на фронте она была бы копией.
                "insights": analysis.insights(used),
            }
        )


class RatingNoShowView(APIView):
    """Зафиксировать подтверждённую неявку без уважительной причины (п. 15).

    Только вручную и только с основанием: п. 15.13 запрещает применять
    последствие, пока обстоятельства не установлены.
    """

    permission_classes = [IsAdminUser]

    def post(self, request):
        from django.contrib.auth import get_user_model
        from tournaments.models import Tournament

        user_id = request.data.get("user_id")
        reason = (request.data.get("reason") or "").strip()
        if not user_id:
            return Response({"detail": "Не указан спортсмен"}, status=status.HTTP_400_BAD_REQUEST)
        if not reason:
            return Response(
                {"detail": "Основание обязательно (п. 15.7)"}, status=status.HTTP_400_BAD_REQUEST
            )

        user = get_user_model().objects.filter(pk=user_id).first()
        if not user:
            return Response({"detail": "Спортсмен не найден"}, status=status.HTTP_404_NOT_FOUND)

        tournament = None
        if request.data.get("tournament_id"):
            tournament = Tournament.objects.filter(pk=request.data["tournament_id"]).first()

        entry = services.register_no_show(
            user, tournament=tournament, reason=reason, actor=request.user
        )
        return Response(RatingEntrySerializer(entry).data, status=status.HTTP_201_CREATED)
