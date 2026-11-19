"""Ручки национальной команды ✳ (19.11.2026, NATIONAL.md) — только переводят
`services.py` в HTTP. Права проверяют сервисы; здесь — только «вошёл ли»."""
from datetime import date

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.models import User

from . import services
from .models import MedicalRecord, NationalTeamMember, PlanItem, TrainingPlan


def _refused(e: services.NationalError) -> Response:
    return Response({"detail": e.detail}, status=e.status)


def _date(value, label):
    """Дата из строки ISO; пусто — None; не дата — отказ."""
    if value in (None, ""):
        return None
    try:
        return date.fromisoformat(str(value))
    except ValueError:
        raise services.NationalError("«%s» — не дата." % label)


def _iso(d):
    return d.isoformat() if d else None


def _person(u: User) -> dict:
    card = getattr(u, "rating_profile", None)
    return {
        "id": str(u.id), "name": u.name,
        "region": card.region if card else "",
        "birth_year": card.birth_year if card else None,
        "rating": str(card.value) if card else None,
    }


def _member(m: NationalTeamMember, viewer) -> dict:
    c = services.clearance(m)
    data = {
        "id": str(m.id), "person": _person(m.user), "squad": m.squad, "age_group": m.age_group,
        "clearance": {"status": c["status"], "until": _iso(c["until"])},
        "limits": len(services.active_limits(m)),
    }
    if services.is_head_coach(viewer):
        data["plan"] = services.plan_progress(m)
    return data


def _record(r: MedicalRecord) -> dict:
    return {
        "id": str(r.id), "kind": r.kind, "date": _iso(r.date), "title": r.title, "note": r.note,
        "load_limit": r.load_limit, "until": _iso(r.until),
        "created_by": r.created_by.name if r.created_by else "",
    }


def _item(i: PlanItem) -> dict:
    return {"id": str(i.id), "kind": i.kind, "title": i.title, "due": _iso(i.due), "done": i.done}


def _plan(p: TrainingPlan) -> dict:
    items = list(p.items.all())
    return {
        "id": str(p.id), "starts_on": _iso(p.starts_on), "ends_on": _iso(p.ends_on), "goal": p.goal,
        "items": [_item(i) for i in items], "done": sum(i.done for i in items), "total": len(items),
        "updated_at": p.updated_at.isoformat(),
    }


class Base(APIView):
    permission_classes = [IsAuthenticated]

    def handle_exception(self, exc):
        if isinstance(exc, services.NationalError):
            return _refused(exc)
        return super().handle_exception(exc)


class MembersView(Base):
    def get(self, request):
        services.require_staff(request.user)
        qs = NationalTeamMember.objects.select_related("user__rating_profile")
        return Response([_member(m, request.user) for m in qs])

    def post(self, request):
        m = services.add_member(
            request.data.get("user_id"), request.data.get("squad") or NationalTeamMember.SQUAD_MAIN,
            request.data.get("age_group") or NationalTeamMember.AGE_ADULT, request.user,
        )
        return Response(_member(m, request.user), status=status.HTTP_201_CREATED)


class CandidatesView(Base):
    def get(self, request):
        return Response([_person(u) for u in services.candidates(request.query_params.get("q", ""), request.user)])


class MemberView(Base):
    def get(self, request, pk):
        services.require_staff(request.user)
        return Response(_member(get_object_or_404(NationalTeamMember, pk=pk), request.user))

    def patch(self, request, pk):
        m = services.update_member(get_object_or_404(NationalTeamMember, pk=pk), request.data, request.user)
        return Response(_member(m, request.user))

    def delete(self, request, pk):
        services.remove_member(get_object_or_404(NationalTeamMember, pk=pk), request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MedicalView(Base):
    """Врачу — карта целиком; главному тренеру — допуск и действующие
    ограничения нагрузки без диагнозов (флоу Э11.2)."""

    def get(self, request, pk):
        m = get_object_or_404(NationalTeamMember, pk=pk)
        c = services.clearance(m)
        head = {"clearance": {"status": c["status"], "until": _iso(c["until"])}}
        if services.is_doctor(request.user):
            return Response({**head, "full": True, "records": [_record(r) for r in m.medical_records.select_related("created_by")]})
        services.require_coach(request.user)
        limits = [{"load_limit": r.load_limit, "until": _iso(r.until)} for r in services.active_limits(m)]
        return Response({**head, "full": False, "limits": limits})

    def post(self, request, pk):
        m = get_object_or_404(NationalTeamMember, pk=pk)
        d = request.data
        data = {
            "kind": d.get("kind"), "date": _date(d.get("date"), "Дата"), "until": _date(d.get("until"), "Действует до"),
            "title": d.get("title"), "note": d.get("note"), "load_limit": d.get("load_limit"),
        }
        return Response(_record(services.add_medical(m, data, request.user)), status=status.HTTP_201_CREATED)


class MedicalRecordView(Base):
    def delete(self, request, pk):
        services.delete_medical(get_object_or_404(MedicalRecord, pk=pk), request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlansView(Base):
    def get(self, request, pk):
        services.require_coach(request.user)
        m = get_object_or_404(NationalTeamMember, pk=pk)
        return Response([_plan(p) for p in m.plans.prefetch_related("items")])

    def post(self, request, pk):
        m = get_object_or_404(NationalTeamMember, pk=pk)
        d = request.data
        data = {"starts_on": _date(d.get("starts_on"), "С"), "ends_on": _date(d.get("ends_on"), "По"), "goal": d.get("goal")}
        return Response(_plan(services.create_plan(m, data, request.user)), status=status.HTTP_201_CREATED)


class PlanView(Base):
    def patch(self, request, pk):
        d = request.data
        data = {"starts_on": _date(d.get("starts_on"), "С"), "ends_on": _date(d.get("ends_on"), "По")}
        if "goal" in d:
            data["goal"] = d.get("goal")
        return Response(_plan(services.update_plan(get_object_or_404(TrainingPlan, pk=pk), data, request.user)))

    def delete(self, request, pk):
        services.delete_plan(get_object_or_404(TrainingPlan, pk=pk), request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlanItemsView(Base):
    def post(self, request, pk):
        plan = get_object_or_404(TrainingPlan, pk=pk)
        d = request.data
        data = {"kind": d.get("kind"), "title": d.get("title"), "due": _date(d.get("due"), "Срок")}
        return Response(_item(services.add_item(plan, data, request.user)), status=status.HTTP_201_CREATED)


class PlanItemView(Base):
    def patch(self, request, pk):
        item = services.set_item_done(get_object_or_404(PlanItem, pk=pk), request.data.get("done"), request.user)
        return Response(_item(item))

    def delete(self, request, pk):
        services.delete_item(get_object_or_404(PlanItem, pk=pk), request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
