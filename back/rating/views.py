"""API Национального рейтинга.

Ручки: список (живой или выпуск), карточка, коэффициенты (чтение и правка),
предпросчёт для калибровки, неявка, исправление, выпуски и черновик выпуска.
Расчёта здесь нет — он в `engine.py`, сборка в `services.py`; вьюха только
принимает запрос и отдаёт ответ.

Рейтинг открыт без входа (ТЗ §3, экран Э0.4): таблица и карточка спортсмена —
публичные страницы. Править рейтинговые данные — коэффициенты, неявки,
исправления, выпуски — может только председатель ГСК ✳ (10.09.2026, решение
владельца продукта): по Положению он ведёт базу и историю рейтинга (п. 8.3, 22).
"""
from dataclasses import asdict

from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import AllowAny

from users.permissions import IsGskChairman
from rest_framework.response import Response
from rest_framework.views import APIView

from . import analysis, engine, services
from .models import RatingEdition, RatingEntry, RatingParams, RatingProfile
from .serializers import (
    EditionDraftRowSerializer,
    PreviewRequestSerializer,
    RatingEditionRowSerializer,
    RatingEditionSerializer,
    RatingEntrySerializer,
    RatingParamsSerializer,
    RatingProfileSerializer,
)

#: Э0.4: «таблица с фильтрами, постранично до 500 строк».
PAGE_SIZE_MAX = 500
PAGE_SIZE_DEFAULT = 100


def _edition_from(param):
    """Какой выпуск показывать. Без параметра — последний; `live` — живые
    значения; иначе номер записи выпуска. Выпусков ещё нет — лист живой."""
    if param == "live":
        return None
    if param:
        try:
            return RatingEdition.objects.filter(pk=int(param)).first()
        except (TypeError, ValueError):
            return None
    return RatingEdition.objects.order_by("-number").first()


class RatingListView(APIView):
    """Рейтинг-лист.

    Публичный лист — последний опубликованный выпуск (п. 8.2): спорят и
    обжалуют опубликованное число, а не то, что успело пересчитаться. До
    первого выпуска лист живой. Возрастные категории — выборка из общего
    рейтинга, а не отдельный рейтинг (п. 7.2–7.3): фильтр `age` сужает список,
    значения при этом те же. Поля выборок у строки выпуска те же, что у
    карточки, поэтому фильтры одни.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        edition = _edition_from(request.query_params.get("edition"))
        if edition:
            qs = edition.rows.select_related("user")
            row_serializer = RatingEditionRowSerializer
        else:
            qs = RatingProfile.objects.select_related("user")
            row_serializer = RatingProfileSerializer

        qs = _apply_filters(qs, request.query_params).order_by("-value", "user__name")
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
                "results": row_serializer(rows, many=True).data,
                "edition": RatingEditionSerializer(edition).data if edition else None,
                "updated_at": (
                    edition.published_at
                    if edition
                    else qs.order_by("-updated_at").values_list("updated_at", flat=True).first()
                ),
            }
        )


def _apply_filters(qs, params):
    """Пол, регион, статус, поиск, возраст — одинаково для живого листа и выпуска."""
    sex = params.get("sex")
    if sex:
        qs = qs.filter(sex=sex)

    region = params.get("region")
    if region:
        qs = qs.filter(region__icontains=region)

    state = params.get("status")
    if state:
        qs = qs.filter(status=state)
    elif params.get("all") != "1":
        # По умолчанию лист активный: неактивные исключаются из текущей
        # таблицы (п. 18.2), но остаются доступны через ?status=inactive.
        qs = qs.exclude(status__in=[engine.STATUS_INACTIVE, engine.STATUS_VOID])

    search = params.get("q")
    if search:
        qs = qs.filter(Q(user__name__icontains=search) | Q(region__icontains=search))

    age = params.get("age")
    if age:
        qs = _filter_age(qs, age)
    return qs


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
    """Коэффициенты расчёта: читать может любой, править — председатель ГСК.

    Читать открыто намеренно: рядом с рейтингом должно быть видно, по каким
    числам он посчитан, иначе «прозрачность» из п. 4.6 не работает.
    """

    def get_permissions(self):
        return [AllowAny()] if self.request.method == "GET" else [IsGskChairman()]

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

    permission_classes = [IsGskChairman]

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


class RatingCorrectionView(APIView):
    """Исправить рейтинговое значение — техническая ошибка (п. 21.5–21.6).

    Ничего не переписывает: разница дописывается отдельной строкой журнала с
    основанием и автором, прежние записи остаются. Основание обязательно —
    исправление без объяснения ничем не отличается от подкрутки.
    """

    permission_classes = [IsGskChairman]

    def post(self, request):
        from django.contrib.auth import get_user_model

        user_id = request.data.get("user_id")
        reason = (request.data.get("reason") or "").strip()
        value = request.data.get("value")

        if not user_id:
            return Response({"detail": "Не указан спортсмен"}, status=status.HTTP_400_BAD_REQUEST)
        if not reason:
            return Response(
                {"detail": "Основание обязательно (п. 21.6)"}, status=status.HTTP_400_BAD_REQUEST
            )
        try:
            value = float(value)
        except (TypeError, ValueError):
            return Response(
                {"detail": "Нужно исправленное значение рейтинга"}, status=status.HTTP_400_BAD_REQUEST
            )

        user = get_user_model().objects.filter(pk=user_id).first()
        if not user:
            return Response({"detail": "Спортсмен не найден"}, status=status.HTTP_404_NOT_FOUND)

        entry = services.register_correction(user, value, reason=reason, actor=request.user)
        return Response(RatingEntrySerializer(entry).data, status=status.HTTP_201_CREATED)


class RatingEditionsView(APIView):
    """Выпуски (п. 8.2): список открыт всем, публикует председатель ГСК.

    Список открыт, потому что по нему выбирают, какую таблицу смотреть, и от
    даты выпуска считают срок апелляции (п. 21.2).
    """

    def get_permissions(self):
        return [AllowAny()] if self.request.method == "GET" else [IsGskChairman()]

    def get(self, request):
        return Response(RatingEditionSerializer(RatingEdition.objects.all(), many=True).data)

    def post(self, request):
        edition = services.publish_edition(actor=request.user)
        return Response(RatingEditionSerializer(edition).data, status=status.HTTP_201_CREATED)


class RatingEditionDraftView(APIView):
    """Черновик следующего выпуска: кто сдвинулся с прошлого и кто новый."""

    permission_classes = [IsGskChairman]

    def get(self, request):
        return Response(EditionDraftRowSerializer(services.edition_draft(), many=True).data)


#: Журнал постранично: строк много, а смотрят обычно последние.
JOURNAL_PAGE_DEFAULT = 50
JOURNAL_PAGE_MAX = 200


class RatingJournalView(APIView):
    """Журнал изменений (п. 20, 21.6, 22.2): все строки истории всех
    спортсменов, новые первыми, с автором и основанием. Отменённые остаются с
    пометкой — история хранится без удаления. Только чтение, только
    председателю ГСК: он обеспечивает сохранность базы и истории (п. 22.2)."""

    permission_classes = [IsGskChairman]

    def get(self, request):
        from .serializers import RatingJournalEntrySerializer

        qs = RatingEntry.objects.select_related("profile__user", "tournament", "opponent", "created_by")
        kind = request.query_params.get("kind")
        if kind:
            qs = qs.filter(kind=kind)
        search = request.query_params.get("q")
        if search:
            qs = qs.filter(profile__user__name__icontains=search)
        user_id = request.query_params.get("user_id")
        if user_id:
            qs = qs.filter(profile__user_id=user_id)

        qs = qs.order_by("-created_at", "-id")
        total = qs.count()
        try:
            size = min(int(request.query_params.get("page_size", JOURNAL_PAGE_DEFAULT)), JOURNAL_PAGE_MAX)
            page = max(1, int(request.query_params.get("page", 1)))
        except (TypeError, ValueError):
            size, page = JOURNAL_PAGE_DEFAULT, 1

        rows = qs[(page - 1) * size: page * size]
        return Response(
            {
                "count": total,
                "page": page,
                "page_size": size,
                "results": RatingJournalEntrySerializer(rows, many=True).data,
            }
        )


class RatingAppealsView(APIView):
    """Апелляции (п. 21): очередь и регистрация — председатель ГСК.

    Апелляция подаётся письменно в Федерацию (п. 21.2), в систему её вносит
    председатель. Выпуск по умолчанию — последний: обжалуют опубликованное.
    """

    permission_classes = [IsGskChairman]

    def get(self, request):
        from .models import RatingAppeal
        from .serializers import RatingAppealSerializer

        qs = RatingAppeal.objects.select_related("user", "edition", "decided_by", "correction")
        state = request.query_params.get("status")
        if state:
            qs = qs.filter(status=state)
        return Response(RatingAppealSerializer(qs, many=True).data)

    def post(self, request):
        from django.contrib.auth import get_user_model
        from django.core.exceptions import ValidationError
        from django.utils.dateparse import parse_date

        from .serializers import RatingAppealSerializer

        try:
            user = get_user_model().objects.filter(pk=request.data.get("user_id")).first()
        except (ValueError, ValidationError):
            user = None
        if not user:
            return Response({"detail": "Спортсмен не найден"}, status=status.HTTP_404_NOT_FOUND)

        edition_id = request.data.get("edition_id")
        edition = (
            RatingEdition.objects.filter(pk=edition_id).first()
            if edition_id
            else RatingEdition.objects.order_by("-number").first()
        )
        if not edition:
            return Response(
                {"detail": "Выпусков ещё нет — обжаловать нечего"}, status=status.HTTP_400_BAD_REQUEST
            )

        received = request.data.get("received_at")
        try:
            appeal = services.register_appeal(
                edition,
                user,
                received_at=parse_date(received) if received else None,
                applicant=request.data.get("applicant") or "",
                subject=request.data.get("subject") or "",
                circumstances=request.data.get("circumstances") or "",
                demand=request.data.get("demand") or "",
                documents=request.data.get("documents") or "",
                actor=request.user,
            )
        except services.AppealError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(RatingAppealSerializer(appeal).data, status=status.HTTP_201_CREATED)


class RatingAppealDecisionView(APIView):
    """Решение по апелляции (п. 21.4): удовлетворить с исправленным значением
    или отклонить. Обоснование обязательно, решение окончательное."""

    permission_classes = [IsGskChairman]

    def post(self, request, pk):
        from .models import RatingAppeal
        from .serializers import RatingAppealSerializer

        appeal = RatingAppeal.objects.filter(pk=pk).first()
        if not appeal:
            return Response({"detail": "Апелляция не найдена"}, status=status.HTTP_404_NOT_FOUND)

        raw = request.data.get("value")
        try:
            value = float(raw) if raw not in (None, "") else None
        except (TypeError, ValueError):
            return Response({"detail": "Значение рейтинга — число"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            services.decide_appeal(
                appeal,
                upheld=bool(request.data.get("upheld")),
                decision=request.data.get("decision") or "",
                value=value,
                actor=request.user,
            )
        except services.AppealError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(RatingAppealSerializer(appeal).data)


class RatingMergeView(APIView):
    """Объединить дублирующие карточки (п. 5.3) — председатель ГСК.

    `keep_user_id` — чья карточка остаётся, `drop_user_id` — дубль, `reason`
    обязателен: объединение без основания ничем не отличается от подмены.
    """

    permission_classes = [IsGskChairman]

    def post(self, request):
        from django.contrib.auth import get_user_model
        from django.core.exceptions import ValidationError

        users = get_user_model().objects
        try:
            keep = users.filter(pk=request.data.get("keep_user_id")).first()
            drop = users.filter(pk=request.data.get("drop_user_id")).first()
        except (ValueError, ValidationError):
            keep = drop = None
        if not keep or not drop:
            return Response({"detail": "Спортсмен не найден"}, status=status.HTTP_404_NOT_FOUND)

        try:
            profile = services.merge_profiles(
                keep, drop, reason=request.data.get("reason") or "", actor=request.user
            )
        except services.MergeError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(RatingProfileSerializer(profile).data)


def _protocol(t) -> dict:
    """Протокол для рейтинга: уровень, места, учтён ли турнир в рейтинге."""
    from django.utils import timezone

    when = t.starts_at or t.created_at
    return {
        "id": t.pk,
        "name": t.name,
        "date": timezone.localdate(when) if when else None,
        "level": t.level,
        "level_label": engine.LEVEL_LABELS.get(t.level, t.level),
        "no_third_place_match": t.no_third_place_match,
        "applied": RatingEntry.objects.filter(tournament=t, is_reverted=False).exists(),
        "participants": [
            {
                "user_id": str(p.user_id),
                "name": p.user.name,
                "place": p.place,
                "rating_change": str(p.rating_change) if p.rating_change is not None else None,
            }
            for p in t.participants.select_related("user").order_by("place", "user__name")
        ],
    }


class RatingProtocolsView(APIView):
    """Завершённые рейтинговые турниры — уровень и места для C и P (п. 10, 13).

    Председатель ГСК утверждает протокол для рейтинга: без уровня и призовой
    тройки коэффициенты в настоящих турнирах были бы 1,00.
    """

    permission_classes = [IsGskChairman]

    def get(self, request):
        from tournaments.models import Tournament

        qs = Tournament.objects.filter(status=Tournament.STATUS_FINISHED, is_rating=True).order_by(
            "-starts_at", "-created_at"
        )
        return Response([_protocol(t) for t in qs])


class RatingProtocolView(APIView):
    """Утвердить протокол: уровень, места, «матча за 3-е место не было» — и пересчёт."""

    permission_classes = [IsGskChairman]

    def post(self, request, pk):
        from django.core.exceptions import ValidationError
        from tournaments.models import Tournament

        try:
            t = Tournament.objects.filter(pk=pk).first()
        except (ValueError, ValidationError):
            t = None
        if not t:
            return Response({"detail": "Турнир не найден"}, status=status.HTTP_404_NOT_FOUND)

        places = {}
        for uid, place in (request.data.get("places") or {}).items():
            if place in (None, ""):
                continue
            try:
                places[str(uid)] = int(place)
            except (TypeError, ValueError):
                return Response({"detail": "Место — целое число"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            services.set_protocol(
                t,
                level=request.data.get("level") or t.level,
                places=places,
                no_third_place_match=bool(request.data.get("no_third_place_match")),
                actor=request.user,
            )
        except services.ProtocolError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        t.refresh_from_db()
        return Response(_protocol(t))
