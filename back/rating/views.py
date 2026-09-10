"""API Национального рейтинга.

Ручки: список, карточка, неявка, исправление, объединение дублей и протоколы
турниров (уровень, места, пересчёт).
Расчёта здесь нет — он в `engine.py`, сборка в `services.py`; вьюха только
принимает запрос и отдаёт ответ.

Рейтинг открыт без входа (ТЗ §3, экран Э0.4): таблица и карточка спортсмена —
публичные страницы. Править рейтинговые данные — неявки, исправления, дубли,
протоколы — может только председатель ГСК ✳ (10.09.2026, решение
владельца продукта): по Положению он ведёт базу и историю рейтинга (п. 8.3, 22).
"""
from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import AllowAny

from users.permissions import IsGskChairman
from rest_framework.response import Response
from rest_framework.views import APIView

from . import engine, services
from .models import RatingEntry, RatingProfile
from .serializers import RatingEntrySerializer, RatingProfileSerializer

#: Э0.4: «таблица с фильтрами, постранично до 500 строк».
PAGE_SIZE_MAX = 500
PAGE_SIZE_DEFAULT = 100


class RatingListView(APIView):
    """Рейтинг-лист.

    Значение живое: посчитали — сразу действует ✳ (11.09.2026 выпуски сняты
    решением владельца продукта). Возрастные категории — выборка из общего
    рейтинга, а не отдельный рейтинг (п. 7.2–7.3): фильтр `age` сужает список,
    значения при этом те же.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        qs = RatingProfile.objects.select_related("user")

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
                "results": RatingProfileSerializer(rows, many=True).data,
                "updated_at": qs.order_by("-updated_at").values_list("updated_at", flat=True).first(),
            }
        )


def _apply_filters(qs, params):
    """Пол, регион, статус, поиск, возраст."""
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
    """Строка списка протоколов: уровень, участники, учтён ли турнир."""
    from django.utils import timezone

    applied = RatingEntry.objects.filter(tournament=t, is_reverted=False).exists()
    when = t.starts_at or t.created_at
    return {
        "id": t.pk,
        "name": t.name,
        "date": timezone.localdate(when) if when else None,
        "level": t.level,
        "level_label": engine.LEVEL_LABELS.get(t.level, t.level),
        "no_third_place_match": t.no_third_place_match,
        "applied": applied,
        "editable": t.format == "manual" and not applied,
        "manual": t.format == "manual",
        "status": t.status,
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


def _tournament_or_none(pk):
    from django.core.exceptions import ValidationError
    from tournaments.models import Tournament

    try:
        return Tournament.objects.filter(pk=pk).first()
    except (ValueError, ValidationError):
        return None


def _user_or_none(pk):
    from django.contrib.auth import get_user_model
    from django.core.exceptions import ValidationError

    try:
        return get_user_model().objects.filter(pk=pk).first()
    except (ValueError, ValidationError):
        return None


def _places_from(data):
    """{user_id: место} из запроса; пустые значения — без места."""
    places = {}
    for uid, place in (data.get("places") or {}).items():
        if place in (None, ""):
            continue
        places[str(uid)] = int(place)
    return places


def _bad(e) -> Response:
    return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


def _missing(what: str = "Турнир не найден") -> Response:
    return Response({"detail": what}, status=status.HTTP_404_NOT_FOUND)


class RatingProtocolsView(APIView):
    """Рейтинговые турниры (п. 10, 13) и заведение турнира протоколом вручную.

    В списке — завершённые рейтинговые турниры и черновики протоколов вручную
    ✳ (11.09.2026): их заводит председатель ГСК, вносит участников и матчи.
    """

    permission_classes = [IsGskChairman]

    def get(self, request):
        from django.db.models import Q
        from tournaments.models import Tournament

        qs = Tournament.objects.filter(is_rating=True).filter(
            Q(status=Tournament.STATUS_FINISHED) | Q(format=Tournament.FORMAT_MANUAL)
        ).order_by("-starts_at", "-created_at")
        return Response([_protocol(t) for t in qs])

    def post(self, request):
        from django.utils.dateparse import parse_date

        from . import manual

        raw = request.data.get("date")
        try:
            t = manual.create_tournament(
                name=request.data.get("name") or "",
                when=parse_date(raw) if raw else None,
                level=request.data.get("level") or "republic",
                actor=request.user,
            )
        except manual.ManualError as e:
            return _bad(e)
        return Response(services.protocol_detail(t), status=status.HTTP_201_CREATED)


class RatingProtocolView(APIView):
    """Страница протокола (GET) и утверждение (POST): уровень, места, пересчёт.
    У турнира вручную утверждение ещё и завершает его и учитывает в рейтинге."""

    permission_classes = [IsGskChairman]

    def get(self, request, pk):
        t = _tournament_or_none(pk)
        if not t:
            return _missing()
        return Response(services.protocol_detail(t))

    def post(self, request, pk):
        from . import manual

        t = _tournament_or_none(pk)
        if not t:
            return _missing()
        try:
            places = _places_from(request.data)
        except (TypeError, ValueError):
            return _bad("Место — целое число")
        try:
            manual.approve(
                t,
                level=request.data.get("level") or t.level,
                places=places,
                no_third_place_match=bool(request.data.get("no_third_place_match")),
                actor=request.user,
            )
        except (services.ProtocolError, manual.ManualError) as e:
            return _bad(e)
        t.refresh_from_db()
        return Response(services.protocol_detail(t))


class RatingProtocolPreviewView(APIView):
    """Предпросмотр утверждения: те же числа, что даст сохранение, но ничего
    не сохраняется. Если утвердить нельзя — в `blocked` причина."""

    permission_classes = [IsGskChairman]

    def post(self, request, pk):
        t = _tournament_or_none(pk)
        if not t:
            return _missing()
        try:
            places = _places_from(request.data)
        except (TypeError, ValueError):
            return _bad("Место — целое число")
        from . import manual

        return Response(
            manual.preview(
                t,
                level=request.data.get("level") or t.level,
                places=places,
                no_third_place_match=bool(request.data.get("no_third_place_match")),
            )
        )


class RatingProtocolParticipantsView(APIView):
    """Добавить участника: существующего (`user_id`) или нового (`new`: имя,
    регион, пол, год рождения, прежний рейтинг или позиция ITTF)."""

    permission_classes = [IsGskChairman]

    def post(self, request, pk):
        from . import manual

        t = _tournament_or_none(pk)
        if not t:
            return _missing()
        try:
            new = request.data.get("new")
            if new:
                origin = new.get("origin") or (
                    engine.ORIGIN_LEGACY if new.get("legacy") not in (None, "") else engine.ORIGIN_NEW
                )
                manual._check_editable(t)
                user = services.create_athlete(
                    name=new.get("name") or "",
                    region=new.get("region") or "",
                    sex=new.get("sex") or "",
                    birth_year=new.get("birth_year"),
                    origin=origin,
                    legacy=new.get("legacy"),
                    ittf_position=new.get("ittf_position"),
                )
            else:
                user = _user_or_none(request.data.get("user_id"))
                if not user:
                    return _missing("Спортсмен не найден")
            manual.add_participant(t, user)
        except (manual.ManualError, services.AthleteError) as e:
            return _bad(e)
        return Response(services.protocol_detail(t))


class RatingProtocolParticipantView(APIView):
    """Убрать участника — пока у него нет матчей в турнире."""

    permission_classes = [IsGskChairman]

    def delete(self, request, pk, user_id):
        from . import manual

        t = _tournament_or_none(pk)
        user = _user_or_none(user_id)
        if not t or not user:
            return _missing()
        try:
            manual.remove_participant(t, user)
        except manual.ManualError as e:
            return _bad(e)
        return Response(services.protocol_detail(t))


class RatingProtocolMatchesView(APIView):
    """Внести матч: кто с кем (`a`, `b`) и счёт (`score_a`, `score_b`)."""

    permission_classes = [IsGskChairman]

    def post(self, request, pk):
        from . import manual

        t = _tournament_or_none(pk)
        a = _user_or_none(request.data.get("a"))
        b = _user_or_none(request.data.get("b"))
        if not t:
            return _missing()
        if not a or not b:
            return _missing("Спортсмен не найден")
        try:
            manual.add_match(t, a, b, request.data.get("score_a"), request.data.get("score_b"))
        except manual.ManualError as e:
            return _bad(e)
        return Response(services.protocol_detail(t))


class RatingProtocolMatchView(APIView):
    """Удалить матч. Идентификатор — как в странице протокола («b12») или число."""

    permission_classes = [IsGskChairman]

    def delete(self, request, pk, mid):
        from . import manual

        t = _tournament_or_none(pk)
        if not t:
            return _missing()
        raw = str(mid)
        try:
            match_pk = int(raw[1:] if raw[:1] in ("b", "g") else raw)
        except ValueError:
            return _missing("Матч не найден")
        try:
            manual.remove_match(t, match_pk)
        except manual.ManualError as e:
            return _bad(e)
        return Response(services.protocol_detail(t))


class RatingProtocolReworkView(APIView):
    """Вернуть протокол на доработку: снять учёт турнира, чтобы поправить
    участников и матчи. Отказ — если после турнира были другие изменения."""

    permission_classes = [IsGskChairman]

    def post(self, request, pk):
        from . import manual

        t = _tournament_or_none(pk)
        if not t:
            return _missing()
        try:
            manual.return_for_rework(t, actor=request.user)
        except manual.ManualError as e:
            return _bad(e)
        t.refresh_from_db()
        return Response(services.protocol_detail(t))


class RatingAthletesView(APIView):
    """Завести спортсмена в рейтинге ✳ (11.09.2026) — председатель ГСК.

    Старт считает сервер: новый — 1,00 (п. 6.1), перенос прежнего (п. 6.3),
    позиция ITTF (п. 17.4).
    """

    permission_classes = [IsGskChairman]

    def post(self, request):
        try:
            user = services.create_athlete(
                name=request.data.get("name") or "",
                region=request.data.get("region") or "",
                sex=request.data.get("sex") or "",
                birth_year=request.data.get("birth_year"),
                origin=request.data.get("origin") or engine.ORIGIN_NEW,
                legacy=request.data.get("legacy"),
                ittf_position=request.data.get("ittf_position"),
            )
        except services.AthleteError as e:
            return _bad(e)
        profile = RatingProfile.objects.select_related("user").get(user=user)
        return Response(RatingProfileSerializer(profile).data, status=status.HTTP_201_CREATED)
