"""Ручки национальной команды ✳ (19.11.2026, NATIONAL.md) — только переводят
`services.py` в HTTP. Права проверяют сервисы; здесь — только «вошёл ли».

Ответы несут `access` / `can_*`: что этому человеку можно. Экраны по ним
решают, какие кнопки показать, и не повторяют правила у себя."""
from bisect import bisect_right
from datetime import date

from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.models import User

from . import services as s
from .models import (
    MedicalRecord, NationalTeamMember, PlanItem, SportRecord, TrainingEvent, TrainingPlan, TravelReport,
)


def _date(value, label):
    """Дата из строки ISO; пусто — None; не дата — отказ."""
    if value in (None, ""):
        return None
    try:
        return date.fromisoformat(str(value))
    except ValueError:
        raise s.NationalError("«%s» — не дата." % label)


def _iso(d):
    return d.isoformat() if d else None


def _avatar(m) -> "str | None":
    if m.avatar:
        return m.avatar.url
    return m.user.avatar.url if m.user.avatar else None


def _person(u: User) -> dict:
    card = getattr(u, "rating_profile", None)
    return {
        "id": str(u.id), "name": u.name,
        "region": card.region if card else "",
        "birth_year": card.birth_year if card else None,
        "rating": str(card.value) if card else None,
        # Пол — для заглушки фигуры в карточке состава ✳ (22.11.2026).
        "sex": card.sex if card else "",
    }


def _access(m: NationalTeamMember, viewer) -> dict:
    return {
        "roster": s.is_head_staff(viewer),
        "plans": s.can_see_plans(m, viewer),
        # Может завести план: штаб или личный тренер этого спортсмена.
        "plan_author": s.is_head_staff(viewer) or bool(m.personal_coach_id and m.personal_coach_id == viewer.id),
        "medical": "full" if s.is_doctor(viewer) else ("summary" if s.can_read_medical_summary(m, viewer) else None),
        "sport": s.is_psychologist(viewer),
    }


def _member(m: NationalTeamMember, viewer) -> dict:
    c = s.clearance(m)
    access = _access(m, viewer)
    data = {
        "id": str(m.id), "person": _person(m.user), "squad": m.squad, "age_group": m.age_group,
        # Снимки ✳ (22.11.2026): аватар — лицо (свой у члена сборной, иначе фото
        # учётки), фигура — по пояс для баннера. Нет — заглушка на экране.
        "avatar": _avatar(m),
        "figure": m.figure.url if m.figure else None,
        "personal_coach": {"id": str(m.personal_coach_id), "name": m.personal_coach.name} if m.personal_coach_id else None,
        "clearance": {"status": c["status"], "until": _iso(c["until"])},
        "limits": len(s.active_limits(m)),
        "access": access,
    }
    if access["plans"]:
        data["plan"] = s.plan_progress(m)
    return data


def _record(r: MedicalRecord) -> dict:
    return {
        "id": str(r.id), "kind": r.kind, "date": _iso(r.date), "title": r.title, "note": r.note,
        "load_limit": r.load_limit, "until": _iso(r.until),
        "created_by": r.created_by.name if r.created_by else "",
    }


def _event(e: TrainingEvent) -> dict:
    return {
        "id": str(e.id), "kind": e.kind, "title": e.title, "city": e.city, "starts_on": _iso(e.starts_on),
        "ends_on": _iso(e.ends_on), "age_group": e.age_group,
        "tournament": {"id": str(e.tournament_id), "name": e.tournament.name} if e.tournament_id else None,
    }


def _item(i: PlanItem) -> dict:
    # Где пункт во времени и в каком он состоянии — те же правила, что у доски
    # (`board.item_dates`, `board.item_state`): профиль и доска не расходятся.
    from . import board

    s_, e_ = board.item_dates(i)
    return {
        "period": {"from": _iso(s_), "to": _iso(e_)} if s_ else None,
        "state": board.item_state(i, s_, e_, date.today()) if s_ else ("done" if i.done else "planned"),
        "city": i.event.city if i.event_id else "",
        "id": str(i.id), "kind": i.kind, "title": i.title, "starts_on": _iso(i.starts_on), "due": _iso(i.due),
        "done": i.done,
        "event_id": str(i.event_id) if i.event_id else None,
    }


def _plan(p: TrainingPlan, viewer) -> dict:
    items = list(p.items.all())
    member = p.member
    personal = bool(member.personal_coach_id and member.personal_coach_id == viewer.id)
    open_ = p.status in (TrainingPlan.STATUS_DRAFT, TrainingPlan.STATUS_RETURNED)
    return {
        "id": str(p.id), "starts_on": _iso(p.starts_on), "ends_on": _iso(p.ends_on), "goal": p.goal,
        "status": p.status, "review_comment": p.review_comment,
        "reviewed_by": p.reviewed_by.name if p.reviewed_by_id else "",
        "items": [_item(i) for i in items], "done": sum(i.done for i in items), "total": len(items),
        "can_edit": s.is_head_staff(viewer) or (personal and open_),
        "can_mark": s.is_head_staff(viewer) or personal,
        "can_submit": personal and open_,
        "can_review": s.is_head_staff(viewer) and p.status == TrainingPlan.STATUS_SUBMITTED,
    }


def _report(r: TravelReport, viewer) -> dict:
    return {
        "id": str(r.id), "event": _event(r.event), "age_group": r.age_group, "status": r.status,
        "author": {"id": str(r.author_id), "name": r.author.name},
        "athletes": [_person(u) for u in r.athletes.all()],
        "text": r.text, "file_name": r.file.name.rsplit("/", 1)[-1] if r.file else None,
        "created_at": r.created_at.isoformat(), "updated_at": r.updated_at.isoformat(),
        "history": [
            {"action": a.action, "by": a.by.name if a.by_id else "", "comment": a.comment, "at": a.at.isoformat()}
            for a in r.actions.all()
        ],
        "can_decide": s.is_head_staff(viewer) and r.status == TravelReport.STATUS_SUBMITTED,
        "can_resubmit": r.author_id == viewer.id and r.status == TravelReport.STATUS_RETURNED,
    }


def _ids(data, key):
    if hasattr(data, "getlist"):
        values = data.getlist(key)
        if len(values) == 1 and isinstance(values[0], str) and "," in values[0]:
            values = values[0].split(",")
        return [v for v in values if v]
    return data.get(key) or []


class Base(APIView):
    permission_classes = [IsAuthenticated]

    def handle_exception(self, exc):
        if isinstance(exc, s.NationalError):
            return Response({"detail": exc.detail}, status=exc.status)
        return super().handle_exception(exc)


def _visible(request, pk) -> NationalTeamMember:
    m = get_object_or_404(NationalTeamMember, pk=pk)
    s.require_member(m, request.user)
    return m


# ── Состав ──────────────────────────────────────────────────────────────────

class MeView(Base):
    """Что этому человеку доступно в сборной — для меню кабинетов."""

    def get(self, request):
        u = request.user
        return Response({
            "head_staff": s.is_head_staff(u), "team_coach_groups": s.team_coach_groups(u),
            "personal_coach": s.is_personal_coach(u), "doctor": s.is_doctor(u), "psychologist": s.is_psychologist(u),
            "calendar": s.can_read_calendar(u), "reports": s.can_write_reports(u),
        })


class MembersView(Base):
    def get(self, request):
        # Место в рейтинг-листе — для огромной цифры карточки состава ✳ (22.11.2026):
        # то же правило, что у карточки рейтинга (1 + сколько выше баллом), но
        # одним запросом на весь список, а не по запросу на строку.
        from rating.models import RatingProfile

        values = sorted(RatingProfile.objects.values_list("value", flat=True))

        def place(m):
            card = getattr(m.user, "rating_profile", None)
            return len(values) - bisect_right(values, card.value) + 1 if card else None

        return Response([{**_member(m, request.user), "place": place(m)} for m in s.visible_members(request.user)])

    def post(self, request):
        m = s.add_member(
            request.data.get("user_id"), request.data.get("squad") or NationalTeamMember.SQUAD_MAIN,
            request.data.get("age_group") or NationalTeamMember.AGE_ADULT, request.user,
        )
        return Response(_member(m, request.user), status=status.HTTP_201_CREATED)


class CandidatesView(Base):
    def get(self, request):
        return Response([_person(u) for u in s.candidates(request.query_params.get("q", ""), request.user)])


class PersonalCoachesView(Base):
    def get(self, request):
        return Response([{"id": str(u.id), "name": u.name} for u in s.personal_coaches(request.user)])


def _profile(m: NationalTeamMember) -> dict:
    """Профиль спортсмена ✳ (22.11.2026, образец владельца продукта): фото,
    контакты, дата рождения, с какого дня в сборной. Телефон у заведённых из
    рейтинг-листа — служебный («ath-…»), такой не показываем."""
    u = m.user
    card = getattr(u, "rating_profile", None)
    phone = u.phone if u.phone and not u.phone.startswith("ath-") else ""
    return {
        "avatar": _avatar(m), "email": u.email or "", "phone": phone,
        "birth_date": _iso(card.birth_date) if card and card.birth_date else None,
        "joined": _iso(timezone.localtime(m.added_at).date()),
    }


class MemberView(Base):
    def get(self, request, pk):
        m = _visible(request, pk)
        return Response({**_member(m, request.user), "profile": _profile(m)})

    def patch(self, request, pk):
        m = s.update_member(get_object_or_404(NationalTeamMember, pk=pk), request.data, request.user)
        return Response(_member(m, request.user))

    def delete(self, request, pk):
        s.remove_member(get_object_or_404(NationalTeamMember, pk=pk), request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Медкарта и спортивная карточка ──────────────────────────────────────────

class MedicalView(Base):
    """Врачу — карта целиком; тем, кто ведёт подготовку, — допуск и
    действующие ограничения нагрузки без диагнозов (флоу Э11.2)."""

    def get(self, request, pk):
        m = get_object_or_404(NationalTeamMember, pk=pk)
        c = s.clearance(m)
        head = {"clearance": {"status": c["status"], "until": _iso(c["until"])}}
        if s.is_doctor(request.user):
            return Response({**head, "full": True, "records": [_record(r) for r in m.medical_records.select_related("created_by")]})
        if not s.can_read_medical_summary(m, request.user):
            raise s.NationalError("Медицинская карта вам не видна.", 403)
        limits = [{"load_limit": r.load_limit, "until": _iso(r.until)} for r in s.active_limits(m)]
        return Response({**head, "full": False, "limits": limits})

    def post(self, request, pk):
        m = get_object_or_404(NationalTeamMember, pk=pk)
        d = request.data
        data = {
            "kind": d.get("kind"), "date": _date(d.get("date"), "Дата"), "until": _date(d.get("until"), "Действует до"),
            "title": d.get("title"), "note": d.get("note"), "load_limit": d.get("load_limit"),
        }
        return Response(_record(s.add_medical(m, data, request.user)), status=status.HTTP_201_CREATED)


class MedicalRecordView(Base):
    def delete(self, request, pk):
        s.delete_medical(get_object_or_404(MedicalRecord, pk=pk), request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


def _sport(r: SportRecord) -> dict:
    return {"id": str(r.id), "date": _iso(r.date), "text": r.text, "created_by": r.created_by.name if r.created_by else ""}


class SportView(Base):
    def get(self, request, pk):
        s.require_psychologist(request.user)
        m = get_object_or_404(NationalTeamMember, pk=pk)
        return Response([_sport(r) for r in m.sport_records.select_related("created_by")])

    def post(self, request, pk):
        m = get_object_or_404(NationalTeamMember, pk=pk)
        data = {"date": _date(request.data.get("date"), "Дата"), "text": request.data.get("text")}
        return Response(_sport(s.add_sport_record(m, data, request.user)), status=status.HTTP_201_CREATED)


class SportRecordView(Base):
    def delete(self, request, pk):
        s.delete_sport_record(get_object_or_404(SportRecord, pk=pk), request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class HistoryView(Base):
    def get(self, request, pk):
        rows = s.history(get_object_or_404(NationalTeamMember, pk=pk), request.user)
        out = []
        for r in rows:
            out.append({**r, "date": _iso(r["date"]), "ends_on": _iso(r["ends_on"]),
                        "delta": str(r["delta"]) if r["delta"] is not None else None})
        return Response(out)


# ── Планы ───────────────────────────────────────────────────────────────────

class PlansView(Base):
    def get(self, request, pk):
        m = get_object_or_404(NationalTeamMember, pk=pk)
        s.require_plans(m, request.user)
        return Response([_plan(p, request.user) for p in m.plans.prefetch_related("items").select_related("reviewed_by")])

    def post(self, request, pk):
        m = get_object_or_404(NationalTeamMember, pk=pk)
        d = request.data
        data = {"starts_on": _date(d.get("starts_on"), "С"), "ends_on": _date(d.get("ends_on"), "По"), "goal": d.get("goal")}
        return Response(_plan(s.create_plan(m, data, request.user), request.user), status=status.HTTP_201_CREATED)


class PlanBoardView(Base):
    """Доска планов ✳ (21.11.2026): `?from=&to=` — окно дат (без них — текущая
    неделя), строка на спортсмена с пунктами его планов (`national/board.py`)."""

    def get(self, request):
        from datetime import date as _d

        from . import board

        u = request.user
        if not (s.is_head_staff(u) or s.team_coach_groups(u) or s.is_personal_coach(u)):
            raise s.NationalError("Планы подготовки видят тренерский штаб и личный тренер.", 403)
        today = _d.today()
        start, end = board.window(_date(request.query_params.get("from"), "С"), _date(request.query_params.get("to"), "По"), today)
        rows = board.plan_board(request.user, start, end, today)
        return Response({
            "from": _iso(start), "to": _iso(end), "today": _iso(today),
            "rows": [{
                "member": {"id": str(r["member"].id), "person": _person(r["member"].user), "squad": r["member"].squad,
                           "age_group": r["member"].age_group, "avatar": _avatar(r["member"])},
                # Отметку «выполнено» ставит штаб или личный тренер спортсмена — как `can_mark` у плана.
                "can_mark": s.is_head_staff(u) or r["member"].personal_coach_id == u.id,
                # Создание с доски ✳ (21.11.2026): пункт — тем, кто правит план сейчас
                # (`require_plan_editor`), новый план — штабу и личному тренеру (`create_plan`).
                "can_add": bool(r["plan"]) and (s.is_head_staff(u) or (
                    r["member"].personal_coach_id == u.id and r["plan"].status in ("draft", "returned"))),
                "can_create_plan": s.is_head_staff(u) or r["member"].personal_coach_id == u.id,
                "plan": {"id": str(r["plan"].id), "status": r["plan"].status, "starts_on": _iso(r["plan"].starts_on),
                         "ends_on": _iso(r["plan"].ends_on), "goal": r["plan"].goal,
                         "done": r["plan"].items.filter(done=True).count(), "total": r["plan"].items.count()}
                if r["plan"] else None,
                "items": [{"id": str(i["item"].id), "title": i["title"], "kind": i["kind"], "starts_on": _iso(i["starts_on"]),
                           "ends_on": _iso(i["ends_on"]), "state": i["state"], "plan_status": i["plan_status"],
                           # Растянуть и сдвинуть на доске можно работу того плана, который правит этот человек.
                           "can_move": i["kind"] == "work" and s.can_edit_plan(i["item"].plan, u),
                           "city": i["item"].event.city if i["item"].event_id else ""} for i in r["items"]],
            } for r in rows],
        })


class PlanView(Base):
    def patch(self, request, pk):
        d = request.data
        data = {"starts_on": _date(d.get("starts_on"), "С"), "ends_on": _date(d.get("ends_on"), "По")}
        if "goal" in d:
            data["goal"] = d.get("goal")
        plan = s.update_plan(get_object_or_404(TrainingPlan, pk=pk), data, request.user)
        return Response(_plan(plan, request.user))

    def delete(self, request, pk):
        s.delete_plan(get_object_or_404(TrainingPlan, pk=pk), request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlanSubmitView(Base):
    def post(self, request, pk):
        return Response(_plan(s.submit_plan(get_object_or_404(TrainingPlan, pk=pk), request.user), request.user))


class PlanReviewView(Base):
    def post(self, request, pk):
        plan = s.review_plan(
            get_object_or_404(TrainingPlan, pk=pk), bool(request.data.get("approve")), request.data.get("comment"),
            request.user,
        )
        return Response(_plan(plan, request.user))


class PlanItemsView(Base):
    def post(self, request, pk):
        plan = get_object_or_404(TrainingPlan, pk=pk)
        d = request.data
        data = {"kind": d.get("kind"), "title": d.get("title"), "due": _date(d.get("due"), "Срок"),
                "starts_on": _date(d.get("starts_on"), "Начало"), "event_id": d.get("event_id")}
        return Response(_item(s.add_item(plan, data, request.user)), status=status.HTTP_201_CREATED)


class PlanItemView(Base):
    def patch(self, request, pk):
        item = get_object_or_404(PlanItem, pk=pk)
        d = request.data
        if "due" in d or "starts_on" in d:
            item = s.move_item(item, _date(d.get("starts_on"), "Начало"), _date(d.get("due"), "Срок"), request.user)
        if "done" in d:
            item = s.set_item_done(item, d.get("done"), request.user)
        return Response(_item(item))

    def delete(self, request, pk):
        s.delete_item(get_object_or_404(PlanItem, pk=pk), request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Календарь подготовки ────────────────────────────────────────────────────

def _event_data(d) -> dict:
    data = {k: d.get(k) for k in ("kind", "title", "city", "age_group", "tournament_id") if k in d}
    for k, label in (("starts_on", "С"), ("ends_on", "По")):
        if k in d:
            data[k] = _date(d.get(k), label)
    return data


class EventsView(Base):
    def get(self, request):
        return Response({"can_edit": s.is_head_staff(request.user), "events": [_event(e) for e in s.events(request.user)]})

    def post(self, request):
        return Response(_event(s.create_event(_event_data(request.data), request.user)), status=status.HTTP_201_CREATED)


class EventView(Base):
    def patch(self, request, pk):
        return Response(_event(s.update_event(get_object_or_404(TrainingEvent, pk=pk), _event_data(request.data), request.user)))

    def delete(self, request, pk):
        s.delete_event(get_object_or_404(TrainingEvent, pk=pk), request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Рапорты ─────────────────────────────────────────────────────────────────

class ReportsView(Base):
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        return Response([_report(r, request.user) for r in s.visible_reports(request.user)])

    def post(self, request):
        d = request.data
        data = {"event_id": d.get("event_id"), "age_group": d.get("age_group"), "text": d.get("text"),
                "athlete_ids": _ids(d, "athlete_ids")}
        report = s.create_report(data, request.FILES.get("file"), request.user)
        return Response(_report(report, request.user), status=status.HTTP_201_CREATED)


class ReportCandidatesView(Base):
    def get(self, request):
        return Response([_person(u) for u in s.report_candidates(request.query_params.get("q", ""), request.user)])


class ReportView(Base):
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def _get(self, request, pk) -> TravelReport:
        report = s.visible_reports(request.user).filter(pk=pk).first()
        if report is None:
            raise s.NationalError("Рапорт не найден.", 404)
        return report

    def get(self, request, pk):
        return Response(_report(self._get(request, pk), request.user))

    def patch(self, request, pk):
        d = request.data
        data = {"comment": d.get("comment")}
        if "text" in d:
            data["text"] = d.get("text")
        if "athlete_ids" in d:
            data["athlete_ids"] = _ids(d, "athlete_ids")
        report = s.resubmit_report(self._get(request, pk), data, request.FILES.get("file"), request.user)
        return Response(_report(TravelReport.objects.get(pk=report.pk), request.user))


class ReportDecideView(ReportView):
    def post(self, request, pk):
        report = s.decide_report(self._get(request, pk), request.data.get("decision"), request.data.get("comment"), request.user)
        # Перечитать: история в выборке закэширована до решения.
        return Response(_report(TravelReport.objects.get(pk=report.pk), request.user))


class ReportFileView(ReportView):
    """Файл рапорта — через ручку с проверкой прав, а не публичной ссылкой."""

    def get(self, request, pk):
        report = self._get(request, pk)
        if not report.file:
            raise s.NationalError("Файла у рапорта нет.", 404)
        name = report.file.name.rsplit("/", 1)[-1]
        return FileResponse(report.file.open("rb"), filename=name)


# ── УМО ✳ (22.11.2026, NATIONAL.md «Медкарта: УМО») — только врачу ───────────

def _umo(m: NationalTeamMember) -> dict:
    from . import umo

    exams = list(m.umo_exams.prefetch_related("values").select_related("created_by"))
    card = getattr(m.user, "rating_profile", None)
    sex = card.sex if card else ""
    rows = [{"values": {x.code: x.value for x in e.values.all()}, "height": float(e.height_cm) if e.height_cm else None} for e in exams]
    last = exams[-1].date if exams else None
    nxt = None
    if last:
        # Следующий — через 3 месяца после последнего (шаблон: раз в 3 месяца).
        y, mo = divmod(last.month - 1 + 3, 12)
        import calendar

        day = min(last.day, calendar.monthrange(last.year + y, mo + 1)[1])
        nxt = date(last.year + y, mo + 1, day)
    return {
        "sex": sex,
        "next_planned": _iso(nxt),
        "exams": [
            {
                "id": str(e.id), "date": _iso(e.date), "height_cm": float(e.height_cm) if e.height_cm else None,
                "stage": e.stage, "load_note": e.load_note, "illnesses": e.illnesses, "conditions": e.conditions,
                "supplements": e.supplements, "note": e.note, "created_by": e.created_by.name if e.created_by else "",
                "values": {x.code: x.value for x in e.values.all()},
            }
            for e in exams
        ],
        "blocks": umo.table(rows, sex),
    }


def _umo_data(d) -> dict:
    out = {k: d.get(k) for k in ("stage", "load_note", "illnesses", "conditions", "supplements", "note", "height_cm") if k in d}
    if "date" in d:
        out["date"] = _date(d.get("date"), "Дата осмотра")
    if "values" in d:
        out["values"] = d.get("values") or {}
    return out


class UmoView(Base):
    def get(self, request, pk):
        s.require_doctor(request.user)
        return Response(_umo(get_object_or_404(NationalTeamMember, pk=pk)))

    def post(self, request, pk):
        m = get_object_or_404(NationalTeamMember, pk=pk)
        s.add_umo_exam(m, _umo_data(request.data), request.user)
        return Response(_umo(m), status=status.HTTP_201_CREATED)


class UmoExamView(Base):
    def patch(self, request, pk):
        from .models import UmoExam

        exam = get_object_or_404(UmoExam, pk=pk)
        s.update_umo_exam(exam, _umo_data(request.data), request.user)
        return Response(_umo(exam.member))

    def delete(self, request, pk):
        from .models import UmoExam

        exam = get_object_or_404(UmoExam, pk=pk)
        member = exam.member
        s.delete_umo_exam(exam, request.user)
        return Response(_umo(member))


# ── Снимки члена сборной ✳ (22.11.2026) ─────────────────────────────────────

class MemberImageView(Base):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, pk, kind):
        m = get_object_or_404(NationalTeamMember, pk=pk)
        f = request.FILES.get("file")
        if not f:
            raise s.NationalError("Нет файла.")
        s.set_member_image(m, kind, f, request.user)
        return Response(_member(m, request.user))

    def delete(self, request, pk, kind):
        m = get_object_or_404(NationalTeamMember, pk=pk)
        s.set_member_image(m, kind, None, request.user)
        return Response(_member(m, request.user))
