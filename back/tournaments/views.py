import hashlib
import json
import secrets
import threading
import urllib.error
import urllib.request
from pathlib import Path

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.http import HttpResponse, StreamingHttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from users.serializers import RegisterSerializer, UserSerializer
from users.views import _set_auth_cookies

from .bracket import advance_winner, advance_winner_and_loser, generate_bracket, generate_group_bracket, generate_playoff_from_groups, reset_match
from .models import Match, Tournament, TournamentParticipant, TournamentTable, TournamentGroup, GroupMatch
from .serializers import (
    GroupMatchSerializer,
    GroupParticipantSerializer,
    GroupSerializer,
    MatchSerializer,
    ParticipantSerializer,
    TournamentCreateSerializer,
    TournamentSerializer,
    TournamentTableSerializer,
    TournamentUpdateSerializer,
)

User = get_user_model()


# ─── Permission helpers ──────────────────────────────────────────────────────

def _is_superadmin(user):
    return user.is_authenticated and user.is_staff


def _can_manage_tournament(user, tournament):
    """True for staff OR for a ClubAdmin of the tournament's club."""
    if not user.is_authenticated:
        return False
    if user.is_staff:
        return True
    if tournament.club and tournament.club.is_admin(user):
        return True
    return False


def _can_create_tournament(user, club=None):
    """True for staff (any club) or club admin of the given club."""
    if not user.is_authenticated:
        return False
    if user.is_staff:
        return True
    if club and club.is_admin(user):
        return True
    return False


def _clean_tts_name(value):
    name = " ".join(str(value or "").strip().split())
    if not name:
        raise ValueError("Player name is required.")
    return name[:80]


def _clean_elabs_voice_id(value):
    voice_id = str(value or "").strip()
    if not voice_id:
        raise ValueError("ElevenLabs voice id is required.")
    if len(voice_id) > 128 or not all(
        ch.isascii() and (ch.isalnum() or ch in "-_") for ch in voice_id
    ):
        raise ValueError("Invalid ElevenLabs voice id.")
    return voice_id


def _elabs_api_key():
    return str(getattr(settings, "ELABS_KEY", "") or "").strip()


def _elabs_model_id():
    return str(getattr(settings, "ELABS_MODEL_ID", "") or "").strip() or "eleven_flash_v2_5"


def _elabs_default_voice_id():
    return str(getattr(settings, "ELABS_VOICE_ID", "") or "").strip()


def _elabs_error_response(exc):
    detail = "ElevenLabs request failed."
    if isinstance(exc, urllib.error.HTTPError):
        body = exc.read().decode("utf-8", errors="ignore")
        try:
            parsed = json.loads(body) if body else {}
            raw_detail = parsed.get("detail")
            if isinstance(raw_detail, dict):
                detail = raw_detail.get("message") or detail
            elif isinstance(raw_detail, str):
                detail = raw_detail
        except (TypeError, ValueError):
            if body:
                detail = body[:240]
    return Response({"detail": detail}, status=status.HTTP_502_BAD_GATEWAY)


def _tts_audio_response(audio, cache_status):
    response = HttpResponse(audio, content_type="audio/mpeg")
    response["Cache-Control"] = "private, max-age=86400"
    response["X-TTS-Cache"] = cache_status
    return response


def _playoff_started(tournament):
    return tournament.matches.exists()


class ElevenLabsVoicesView(APIView):
    """GET /api/tournaments/<pk>/tts/voices/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        tournament = get_object_or_404(Tournament.objects.select_related('club'), pk=pk)
        if not _can_manage_tournament(request.user, tournament):
            return Response({"detail": "Нет прав."}, status=status.HTTP_403_FORBIDDEN)

        api_key = _elabs_api_key()
        if not api_key:
            return Response(
                {"detail": "ELABS_KEY is not configured on the backend."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        req = urllib.request.Request(
            "https://api.elevenlabs.io/v2/voices?page_size=100&include_total_count=false",
            headers={"xi-api-key": api_key},
            method="GET",
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as upstream:
                payload = json.loads(upstream.read().decode("utf-8"))
        except (urllib.error.URLError, TimeoutError, ValueError) as exc:
            return _elabs_error_response(exc)

        voices = []
        for voice in payload.get("voices", []):
            voices.append({
                "voice_id": voice.get("voice_id"),
                "name": voice.get("name"),
                "category": voice.get("category"),
                "description": voice.get("description"),
                "labels": voice.get("labels") or {},
                "preview_url": voice.get("preview_url"),
                "verified_languages": voice.get("verified_languages") or [],
            })

        return Response({
            "voices": [voice for voice in voices if voice["voice_id"] and voice["name"]],
            "default_voice_id": _elabs_default_voice_id(),
            "model_id": _elabs_model_id(),
        })


class TableCallTTSView(APIView):
    """POST /api/tournaments/<pk>/tts/table-call/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        tournament = get_object_or_404(Tournament.objects.select_related('club'), pk=pk)
        if not _can_manage_tournament(request.user, tournament):
            return Response({"detail": "Нет прав."}, status=status.HTTP_403_FORBIDDEN)

        api_key = _elabs_api_key()
        if not api_key:
            return Response(
                {"detail": "ELABS_KEY is not configured on the backend."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            player1 = _clean_tts_name(request.data.get("player1"))
            player2 = _clean_tts_name(request.data.get("player2"))
            table_number = int(request.data.get("table_number"))
            if table_number < 1:
                raise ValueError("Table number must be positive.")
            voice_id = _clean_elabs_voice_id(request.data.get("voice_id") or _elabs_default_voice_id())
        except (TypeError, ValueError) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        model_id = _elabs_model_id()
        text = f"{player1} \u0438 {player2}, \u0441\u0442\u043e\u043b {table_number}."
        cache_dir = Path(settings.MEDIA_ROOT) / "tts_cache"
        cache_dir.mkdir(parents=True, exist_ok=True)
        cache_key = hashlib.sha256(
            json.dumps(
                {"model_id": model_id, "text": text, "voice_id": voice_id, "v": 1},
                sort_keys=True,
                ensure_ascii=False,
            ).encode("utf-8")
        ).hexdigest()
        audio_path = cache_dir / f"{cache_key}.mp3"
        if audio_path.exists():
            return _tts_audio_response(audio_path.read_bytes(), "HIT")

        body = json.dumps({
            "text": text,
            "model_id": model_id,
            "language_code": "ru",
            "voice_settings": {
                "stability": 0.55,
                "similarity_boost": 0.8,
                "style": 0.15,
                "use_speaker_boost": True,
                "speed": 0.98,
            },
        }).encode("utf-8")
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128",
            data=body,
            headers={
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": api_key,
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=15) as upstream:
                audio = upstream.read()
        except (urllib.error.URLError, TimeoutError) as exc:
            return _elabs_error_response(exc)

        audio_path.write_bytes(audio)
        return _tts_audio_response(audio, "MISS")


# ─── Tournament CRUD ─────────────────────────────────────────────────────────

class TournamentListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return TournamentCreateSerializer
        return TournamentSerializer

    def get_queryset(self):
        qs = Tournament.objects.select_related('club')
        club_id = self.request.query_params.get('club_id')
        if club_id:
            qs = qs.filter(club_id=club_id)
        return qs

    def create(self, request, *args, **kwargs):
        from clubs.models import Club
        club_id = request.data.get('club_id')
        club = None
        if club_id:
            club = Club.objects.filter(pk=club_id).first()

        if not _can_create_tournament(request.user, club):
            return Response(
                {"detail": "Только администраторы клуба могут создавать турниры."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = TournamentCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        tournament = serializer.save()

        # Pre-populate tournament tables from club tables (if club assigned)
        if tournament.club_id:
            from clubs.models import ClubTable
            club_tables = ClubTable.objects.filter(
                club_id=tournament.club_id, is_active=True
            ).order_by('number')
            TournamentTable.objects.bulk_create([
                TournamentTable(
                    tournament=tournament,
                    number=ct.number,
                    name=ct.name,
                    is_active=True,
                )
                for ct in club_tables
            ])

        return Response(
            TournamentSerializer(tournament, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class TournamentDetailView(generics.RetrieveAPIView):
    queryset = Tournament.objects.select_related('club')
    serializer_class = TournamentSerializer
    permission_classes = [AllowAny]


class TournamentUpdateDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def get_tournament(self, pk):
        return get_object_or_404(Tournament.objects.select_related('club'), pk=pk)

    def patch(self, request, pk):
        tournament = self.get_tournament(pk)
        if not _can_manage_tournament(request.user, tournament):
            return Response({"detail": "Нет прав."}, status=status.HTTP_403_FORBIDDEN)
        serializer = TournamentUpdateSerializer(tournament, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(TournamentSerializer(tournament, context={"request": request}).data)

    def delete(self, request, pk):
        tournament = self.get_tournament(pk)
        if not _can_manage_tournament(request.user, tournament):
            return Response({"detail": "Нет прав."}, status=status.HTTP_403_FORBIDDEN)
        tournament.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Participants ─────────────────────────────────────────────────────────────

class TournamentJoinView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_tournament(self, join_token):
        return get_object_or_404(Tournament, join_token=join_token)

    def get(self, request, join_token):
        tournament = self.get_tournament(join_token)
        return Response(TournamentSerializer(tournament, context={"request": request}).data)

    def post(self, request, join_token):
        tournament = self.get_tournament(join_token)
        if tournament.status != Tournament.STATUS_OPEN:
            return Response(
                {"detail": "Регистрация закрыта — турнир уже начался."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        participant, created = TournamentParticipant.objects.get_or_create(
            tournament=tournament, user=request.user,
        )
        if created:
            _broadcast_roster_changed(
                tournament,
                "participant_joined",
                {"participant": ParticipantSerializer(participant).data, "groups_changed": False},
            )
        return Response(
            ParticipantSerializer(participant).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class RegisterAndJoinView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, join_token):
        tournament = get_object_or_404(Tournament, join_token=join_token)
        if tournament.status != Tournament.STATUS_OPEN:
            return Response(
                {"detail": "Регистрация закрыта — турнир уже начался."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # An existing phone can't register again — tell the frontend to switch
        # to the login-and-join flow instead of failing on the unique constraint.
        phone = (request.data.get("phone") or "").strip()
        if phone and User.objects.filter(phone=phone).exists():
            return Response(
                {"detail": "Этот номер уже зарегистрирован — войдите в аккаунт.", "phone_exists": True},
                status=status.HTTP_409_CONFLICT,
            )

        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        participant, created = TournamentParticipant.objects.get_or_create(
            tournament=tournament, user=user
        )
        if created:
            _broadcast_roster_changed(
                tournament,
                "participant_joined",
                {"participant": ParticipantSerializer(participant).data, "groups_changed": False},
            )
        refresh = RefreshToken.for_user(user)
        data = {
            "user": UserSerializer(user).data,
            "participant": ParticipantSerializer(participant).data,
        }
        response = Response(data, status=status.HTTP_201_CREATED)
        return _set_auth_cookies(response, refresh)


class TournamentParticipantsView(generics.ListAPIView):
    serializer_class   = ParticipantSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        tournament = get_object_or_404(Tournament, pk=self.kwargs["pk"])
        return TournamentParticipant.objects.filter(tournament=tournament).select_related("user")


def _is_group_stage(tournament):
    """Group stage = group_playoff with groups created but the playoff bracket
    not generated yet."""
    return (
        tournament.format == Tournament.FORMAT_GROUP
        and tournament.groups.exists()
        and not tournament.matches.exists()
    )


def _add_user_to_group_stage(tournament, user):
    """Drop a late entrant into the smallest group and create their round-robin
    matches against everyone already in that group."""
    from django.db.models import Count, Max
    from .models import TournamentGroup, GroupParticipant, GroupMatch

    group = (
        TournamentGroup.objects.filter(tournament=tournament)
        .annotate(n=Count('participants')).order_by('n', 'order').first()
    )
    if group is None:
        return
    if GroupParticipant.objects.filter(group=group, user=user).exists():
        return
    opponents = [gp.user for gp in group.participants.select_related('user')]
    GroupParticipant.objects.create(group=group, user=user)
    next_num = (GroupMatch.objects.filter(group=group)
                .aggregate(m=Max('match_number'))['m'] or 0)
    for opp in opponents:
        next_num += 1
        GroupMatch.objects.create(
            group=group, match_number=next_num,
            player1=user, player2=opp, status=GroupMatch.PENDING,
        )


class AddParticipantView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        tournament = get_object_or_404(Tournament.objects.select_related('club'), pk=pk)
        if not _can_manage_tournament(request.user, tournament):
            return Response({"detail": "Нет прав."}, status=status.HTTP_403_FORBIDDEN)

        # Late entries: allowed before start and during the group stage; a started
        # playoff bracket can't take new players without regenerating it.
        group_stage = _is_group_stage(tournament)
        if tournament.status == Tournament.STATUS_FINISHED:
            return Response({"detail": "Турнир завершён — нельзя добавить игрока."}, status=status.HTTP_400_BAD_REQUEST)
        if tournament.status == Tournament.STATUS_IN_PROGRESS and not group_stage:
            return Response(
                {"detail": "Плей-офф уже идёт — добавить игрока в готовую сетку нельзя."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        phone = request.data.get("phone", "").strip()
        if not phone:
            return Response({"detail": "Укажите номер телефона."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(phone=phone).first()
        temp_password = None
        created_user  = False

        if not user:
            name = request.data.get("name", "").strip() or f"Игрок {phone[-4:]}"
            temp_password = str(secrets.randbelow(900000) + 100000)
            try:
                rating_val = int(request.data.get("rating", 100))
            except (TypeError, ValueError):
                rating_val = 100
            user = User.objects.create_user(phone=phone, name=name, password=temp_password, rating=rating_val)
            created_user = True

        participant, joined = TournamentParticipant.objects.get_or_create(
            tournament=tournament, user=user
        )
        # New entrant during the group stage → seat them in a group and create
        # their matches against the existing members.
        if joined and group_stage:
            _add_user_to_group_stage(tournament, user)

        data = ParticipantSerializer(participant).data
        if created_user:
            data["created_user"] = True
            data["temp_password"] = temp_password
        if joined:
            _broadcast_roster_changed(
                tournament,
                "participant_joined",
                {"participant": ParticipantSerializer(participant).data, "groups_changed": group_stage},
            )
        return Response(data, status=status.HTTP_201_CREATED if joined else status.HTTP_200_OK)


class RemoveParticipantView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk, participant_id):
        tournament = get_object_or_404(Tournament.objects.select_related('club'), pk=pk)
        if not _can_manage_tournament(request.user, tournament):
            return Response({"detail": "Нет прав."}, status=status.HTTP_403_FORBIDDEN)
        if tournament.status != Tournament.STATUS_OPEN:
            return Response(
                {"detail": "Нельзя удалить участника из уже начатого турнира."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        participant = get_object_or_404(TournamentParticipant, pk=participant_id, tournament=tournament)
        participant.delete()
        _broadcast_roster_changed(
            tournament,
            "participant_removed",
            {"participant_id": participant_id, "groups_changed": False},
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class JoinTournamentSelfView(APIView):
    """POST /api/tournaments/<pk>/join-self/ - User self-registers for an open tournament"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        tournament = get_object_or_404(Tournament.objects.select_related('club'), pk=pk)
        group_stage = _is_group_stage(tournament)

        if tournament.status == Tournament.STATUS_FINISHED:
            return Response({"detail": "Турнир завершён — нельзя зарегистрироваться."}, status=status.HTTP_400_BAD_REQUEST)
        if tournament.status == Tournament.STATUS_IN_PROGRESS:
            if not group_stage:
                return Response(
                    {"detail": "Плей-офф уже идёт — присоединиться нельзя."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        participant, joined = TournamentParticipant.objects.get_or_create(
            tournament=tournament, user=request.user
        )

        # If joining during group stage, add to a group
        if joined and group_stage:
            _add_user_to_group_stage(tournament, request.user)

        if joined:
            _broadcast_roster_changed(
                tournament,
                "participant_joined",
                {"participant": ParticipantSerializer(participant).data, "groups_changed": group_stage},
            )

        return Response(ParticipantSerializer(participant).data, status=status.HTTP_201_CREATED if joined else status.HTTP_200_OK)


# SSE client registry: {tournament_id: [queue objects]}
_sse_clients = {}
_sse_lock = threading.RLock()


def _broadcast_event(tournament_id: str, event_type: str, data: dict):
    """Broadcast an event to all SSE clients watching this tournament"""
    import queue as queue_module
    event_data = {"type": event_type, "data": data}
    with _sse_lock:
        clients = list(_sse_clients.get(tournament_id, []))
        for q in clients:
            try:
                q.put_nowait(event_data)
            except queue_module.Full:
                if q in _sse_clients.get(tournament_id, []):
                    _sse_clients[tournament_id].remove(q)


def _broadcast_roster_changed(tournament, event_type: str, data: dict):
    payload = {
        **data,
        "participant_count": tournament.participants.count(),
        "tournament": TournamentSerializer(tournament).data,
    }
    _broadcast_event(str(tournament.pk), event_type, payload)


class TournamentStreamView(APIView):
    """GET /api/tournaments/<pk>/stream/ - SSE endpoint for real-time updates"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        tournament = get_object_or_404(Tournament, pk=pk)
        import queue as queue_module

        client_queue = queue_module.Queue(maxsize=100)
        tournament_id = str(pk)

        with _sse_lock:
            if tournament_id not in _sse_clients:
                _sse_clients[tournament_id] = []
            _sse_clients[tournament_id].append(client_queue)

        def event_stream():
            import json

            yield f"data: {json.dumps({'type': 'connected', 'data': {}}, ensure_ascii=False)}\n\n"
            try:
                while True:
                    try:
                        event = client_queue.get(timeout=55)
                        yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
                    except queue_module.Empty:
                        yield ": heartbeat\n\n"
            finally:
                with _sse_lock:
                    if tournament_id in _sse_clients and client_queue in _sse_clients[tournament_id]:
                        _sse_clients[tournament_id].remove(client_queue)
                    if tournament_id in _sse_clients and not _sse_clients[tournament_id]:
                        del _sse_clients[tournament_id]

        response = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
        response["Cache-Control"] = "no-cache"
        response["Connection"] = "keep-alive"
        response["X-Accel-Buffering"] = "no"
        return response


class MyTournamentsView(generics.ListAPIView):
    serializer_class   = TournamentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        joined_ids = TournamentParticipant.objects.filter(
            user=self.request.user
        ).values_list("tournament_id", flat=True)
        return Tournament.objects.filter(id__in=joined_ids).select_related('club')


class MyActiveMatchView(APIView):
    """
    GET /api/tournaments/my/active-match/
    The match the current user should be at right now (in_progress, theirs),
    across all their tournaments. Lets Home deep-link straight to the table.
    Returns {"active_match": {...}} or {"active_match": null}.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        bracket = (
            Match.objects.filter(status=Match.IN_PROGRESS)
            .filter(Q(player1=user) | Q(player2=user))
            .select_related("tournament", "player1", "player2")
            .order_by("table_number", "pk")
            .first()
        )
        if bracket:
            opponent = bracket.player2 if bracket.player1_id == user.id else bracket.player1
            return Response({"active_match": {
                "kind": "bracket",
                "tournament_id": str(bracket.tournament_id),
                "tournament_name": bracket.tournament.name,
                "match_id": bracket.pk,
                "table_number": bracket.table_number,
                "opponent_name": opponent.name if opponent else None,
            }})

        group = (
            GroupMatch.objects.filter(status=GroupMatch.IN_PROGRESS)
            .filter(Q(player1=user) | Q(player2=user))
            .select_related("group", "group__tournament", "player1", "player2")
            .order_by("table_number", "pk")
            .first()
        )
        if group:
            opponent = group.player2 if group.player1_id == user.id else group.player1
            return Response({"active_match": {
                "kind": "group",
                "tournament_id": str(group.group.tournament_id),
                "tournament_name": group.group.tournament.name,
                "match_id": group.pk,
                "group_id": group.group_id,
                "table_number": group.table_number,
                "opponent_name": opponent.name if opponent else None,
            }})

        return Response({"active_match": None})


# ─── Bracket ──────────────────────────────────────────────────────────────────

class StartTournamentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        tournament = get_object_or_404(Tournament.objects.select_related('club'), pk=pk)
        if not _can_manage_tournament(request.user, tournament):
            return Response({"detail": "Нет прав."}, status=status.HTTP_403_FORBIDDEN)
        if tournament.status != Tournament.STATUS_OPEN:
            return Response({"detail": "Турнир уже начат или завершён."}, status=status.HTTP_400_BAD_REQUEST)
        if tournament.participants.count() < 2:
            return Response({"detail": "Нужно минимум 2 участника."}, status=status.HTTP_400_BAD_REQUEST)

        if tournament.format == Tournament.FORMAT_GROUP:
            groups = generate_group_bracket(tournament)
            tournament.refresh_from_db()
            payload = {
                "tournament": TournamentSerializer(tournament).data,
                "groups": GroupSerializer(groups, many=True).data,
            }
            _broadcast_event(str(pk), "tournament_started", payload)
            return Response(payload)

        matches = generate_bracket(tournament)
        tournament.status = Tournament.STATUS_IN_PROGRESS
        tournament.save()

        payload = {
            "tournament": TournamentSerializer(tournament).data,
            "matches": MatchSerializer(matches, many=True).data,
        }
        _broadcast_event(str(pk), "tournament_started", payload)
        return Response(payload)


class MatchListView(generics.ListAPIView):
    serializer_class   = MatchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        tournament = get_object_or_404(Tournament, pk=self.kwargs["pk"])
        return (
            tournament.matches
            .select_related("player1", "player2", "winner")
            .order_by("round_number", "match_number")
        )


class AssignTableView(APIView):
    """
    PATCH /api/tournaments/<pk>/matches/<match_id>/table/
    Body: { table_number: int | null }
    Club admin assigns or clears a table. Also auto-starts the match.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, match_id):
        tournament = get_object_or_404(Tournament.objects.select_related('club'), pk=pk)
        if not _can_manage_tournament(request.user, tournament):
            return Response({"detail": "Нет прав."}, status=status.HTTP_403_FORBIDDEN)

        match = get_object_or_404(Match, pk=match_id, tournament=tournament)

        table_number = request.data.get("table_number")
        if table_number is not None:
            try:
                table_number = int(table_number)
                if table_number < 1:
                    raise ValueError
            except (TypeError, ValueError):
                return Response({"detail": "Номер стола должен быть положительным числом."}, status=400)

            # Validate table is not already occupied
            from .models import GroupMatch as GM
            table_busy_bracket = Match.objects.filter(
                tournament=tournament, table_number=table_number, status=Match.IN_PROGRESS,
            ).exclude(pk=match.pk).exists()
            table_busy_group = GM.objects.filter(
                group__tournament=tournament, table_number=table_number, status=GM.IN_PROGRESS,
            ).exists()
            if table_busy_bracket or table_busy_group:
                return Response(
                    {"detail": f"Стол {table_number} уже занят другим матчем."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        match.table_number = table_number
        # Starting match when table assigned, clearing when released
        just_started = False
        if table_number is not None and match.status == Match.PENDING:
            match.status = Match.IN_PROGRESS
            just_started = True
        elif table_number is None and match.status == Match.IN_PROGRESS:
            match.status = Match.PENDING
        match.save()
        if just_started:
            from notifications.services import notify_match_ready
            notify_match_ready(match, "bracket")
        _broadcast_event(str(pk), "match_updated", {"match": MatchSerializer(match).data})
        return Response(MatchSerializer(match).data)


class TournamentTableListCreateView(APIView):
    """GET/POST /api/tournaments/<pk>/tables/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        tournament = get_object_or_404(Tournament, pk=pk)
        tables = TournamentTable.objects.filter(tournament=tournament)
        return Response(TournamentTableSerializer(tables, many=True).data)

    def post(self, request, pk):
        tournament = get_object_or_404(Tournament.objects.select_related('club'), pk=pk)
        if not _can_manage_tournament(request.user, tournament):
            return Response({"detail": "Нет прав."}, status=status.HTTP_403_FORBIDDEN)
        serializer = TournamentTableSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        table = serializer.save(tournament=tournament)
        return Response(TournamentTableSerializer(table).data, status=status.HTTP_201_CREATED)


class TournamentTableDetailView(APIView):
    """PATCH/DELETE /api/tournaments/<pk>/tables/<table_id>/"""
    permission_classes = [IsAuthenticated]

    def _get(self, pk, table_id):
        tournament = get_object_or_404(Tournament.objects.select_related('club'), pk=pk)
        table = get_object_or_404(TournamentTable, pk=table_id, tournament=tournament)
        return tournament, table

    def patch(self, request, pk, table_id):
        tournament, table = self._get(pk, table_id)
        if not _can_manage_tournament(request.user, tournament):
            return Response({"detail": "Нет прав."}, status=status.HTTP_403_FORBIDDEN)
        serializer = TournamentTableSerializer(table, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(TournamentTableSerializer(table).data)

    def delete(self, request, pk, table_id):
        tournament, table = self._get(pk, table_id)
        if not _can_manage_tournament(request.user, tournament):
            return Response({"detail": "Нет прав."}, status=status.HTTP_403_FORBIDDEN)
        table.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SubmitScoreView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, match_id):
        tournament = get_object_or_404(Tournament.objects.select_related('club'), pk=pk)
        match = get_object_or_404(Match, pk=match_id, tournament=tournament)

        # Permission: club admin or one of the two players
        if not _can_manage_tournament(request.user, tournament):
            if request.user != match.player1 and request.user != match.player2:
                return Response({"detail": "Нет прав."}, status=status.HTTP_403_FORBIDDEN)

        if match.status == Match.FINISHED:
            return Response({"detail": "Матч уже завершён."}, status=status.HTTP_400_BAD_REQUEST)
        if match.status != Match.IN_PROGRESS:
            return Response({"detail": "Матч ещё не начался."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            score1 = int(request.data["score1"])
            score2 = int(request.data["score2"])
        except (KeyError, TypeError, ValueError):
            return Response({"detail": "Укажите score1 и score2."}, status=status.HTTP_400_BAD_REQUEST)

        if score1 < 0 or score2 < 0:
            return Response({"detail": "Счёт не может быть отрицательным."}, status=400)
        if score1 == score2:
            return Response({"detail": "Ничья недопустима."}, status=400)

        match.score1  = score1
        match.score2  = score2
        match.winner  = match.player1 if score1 > score2 else match.player2
        match.status  = Match.FINISHED
        match.table_number = None
        match.save()

        loser = match.player1 if match.winner == match.player2 else match.player2
        advance_winner_and_loser(match, match.winner, loser)

        total_matches = tournament.matches.count()
        finished_matches = tournament.matches.filter(status=Match.FINISHED).count()
        if total_matches > 0 and total_matches == finished_matches:
            tournament.status = Tournament.STATUS_FINISHED
            tournament.save()
            from .rating import apply_tournament_ratings
            apply_tournament_ratings(tournament)

        _broadcast_event(
            str(pk),
            "match_updated",
            {"match": MatchSerializer(match).data, "tournament": TournamentSerializer(tournament).data},
        )

        return Response(MatchSerializer(match).data)


class MatchResetView(APIView):
    """
    POST /api/tournaments/<pk>/matches/<match_id>/reset/
    Admin-only: undo a finished bracket match (wrong score). Pulls the
    propagated players back out and reopens the match for re-scoring.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, match_id):
        tournament = get_object_or_404(Tournament.objects.select_related('club'), pk=pk)
        if not _can_manage_tournament(request.user, tournament):
            return Response({"detail": "Нет прав."}, status=status.HTTP_403_FORBIDDEN)
        match = get_object_or_404(Match, pk=match_id, tournament=tournament)

        was_finished = tournament.status == Tournament.STATUS_FINISHED
        try:
            reset_match(match)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if was_finished:
            from .rating import revert_tournament_ratings
            revert_tournament_ratings(tournament)
            tournament.status = Tournament.STATUS_IN_PROGRESS
            tournament.save()

        _broadcast_event(
            str(pk),
            "match_updated",
            {"match": MatchSerializer(match).data, "tournament": TournamentSerializer(tournament).data},
        )
        return Response(MatchSerializer(match).data)


# ─── Group stage ─────────────────────────────────────────────────────────────

class GroupListView(generics.ListAPIView):
    """GET /api/tournaments/<pk>/groups/"""
    serializer_class   = GroupSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        tournament = get_object_or_404(Tournament, pk=self.kwargs["pk"])
        return TournamentGroup.objects.filter(tournament=tournament).prefetch_related(
            'participants__user', 'matches__player1', 'matches__player2', 'matches__winner'
        )


class GroupMatchScoreView(APIView):
    """POST /api/tournaments/<pk>/groups/<group_id>/matches/<match_id>/score/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, group_id, match_id):
        tournament = get_object_or_404(Tournament.objects.select_related('club'), pk=pk)
        group = get_object_or_404(TournamentGroup, pk=group_id, tournament=tournament)
        match = get_object_or_404(GroupMatch, pk=match_id, group=group)

        # Permission: club admin or one of the two players (own match only)
        if not _can_manage_tournament(request.user, tournament):
            if request.user != match.player1 and request.user != match.player2:
                return Response({"detail": "Нет прав."}, status=status.HTTP_403_FORBIDDEN)
            # Players may only score a match that is actually in progress.
            if match.status != GroupMatch.IN_PROGRESS:
                return Response({"detail": "Матч ещё не начался."}, status=status.HTTP_400_BAD_REQUEST)

        if _playoff_started(tournament):
            return Response({"detail": "Плей-офф уже начат — групповые результаты заблокированы."}, status=status.HTTP_400_BAD_REQUEST)

        if match.status == GroupMatch.FINISHED:
            return Response({"detail": "Матч уже завершён."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            score1 = int(request.data["score1"])
            score2 = int(request.data["score2"])
        except (KeyError, TypeError, ValueError):
            return Response({"detail": "Укажите score1 и score2."}, status=status.HTTP_400_BAD_REQUEST)

        if score1 < 0 or score2 < 0:
            return Response({"detail": "Счёт не может быть отрицательным."}, status=400)
        if score1 == score2:
            return Response({"detail": "Ничья недопустима."}, status=400)

        match.score1 = score1
        match.score2 = score2
        match.winner = match.player1 if score1 > score2 else match.player2
        match.status = GroupMatch.FINISHED
        match.save()

        # Update GroupParticipant standings
        from .models import GroupParticipant as GP
        winner_user = match.winner
        loser_user = match.player2 if score1 > score2 else match.player1
        winner_score = max(score1, score2)
        loser_score  = min(score1, score2)

        try:
            gp_winner = GP.objects.get(group=group, user=winner_user)
            gp_winner.wins   += 1
            gp_winner.points += 3
            gp_winner.diff   += (winner_score - loser_score)
            gp_winner.save()
        except GP.DoesNotExist:
            pass

        try:
            gp_loser = GP.objects.get(group=group, user=loser_user)
            gp_loser.losses += 1
            gp_loser.diff   -= (winner_score - loser_score)
            gp_loser.save()
        except GP.DoesNotExist:
            pass

        _broadcast_event(
            str(pk),
            "group_match_updated",
            {"group_id": group.pk, "match": GroupMatchSerializer(match).data},
        )

        return Response(GroupMatchSerializer(match).data)


class GroupMatchResetView(APIView):
    """
    POST /api/tournaments/<pk>/groups/<group_id>/matches/<match_id>/reset/
    Admin-only: undo a finished group match (wrong score), rolling back the
    standings and reopening it for re-entry.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, group_id, match_id):
        tournament = get_object_or_404(Tournament.objects.select_related('club'), pk=pk)
        if not _can_manage_tournament(request.user, tournament):
            return Response({"detail": "Нет прав."}, status=status.HTTP_403_FORBIDDEN)
        if _playoff_started(tournament):
            return Response({"detail": "Плей-офф уже начат — групповые результаты заблокированы."}, status=status.HTTP_400_BAD_REQUEST)
        group = get_object_or_404(TournamentGroup, pk=group_id, tournament=tournament)
        match = get_object_or_404(GroupMatch, pk=match_id, group=group)

        if match.status != GroupMatch.FINISHED or match.score1 is None:
            return Response({"detail": "Матч не сыгран — отменять нечего."}, status=status.HTTP_400_BAD_REQUEST)

        from .models import GroupParticipant as GP
        diff = abs(match.score1 - match.score2)
        winner = match.winner
        loser = match.player2 if match.winner_id == match.player1_id else match.player1

        gp_w = GP.objects.filter(group=group, user=winner).first()
        if gp_w:
            gp_w.wins -= 1
            gp_w.points -= 3
            gp_w.diff -= diff
            gp_w.save()
        gp_l = GP.objects.filter(group=group, user=loser).first()
        if gp_l:
            gp_l.losses -= 1
            gp_l.diff += diff
            gp_l.save()

        match.score1 = None
        match.score2 = None
        match.winner = None
        match.status = GroupMatch.PENDING
        match.table_number = None
        match.save()
        _broadcast_event(
            str(pk),
            "group_match_updated",
            {"group_id": group.pk, "match": GroupMatchSerializer(match).data},
        )
        return Response(GroupMatchSerializer(match).data)


class GroupMatchTableView(APIView):
    """PATCH /api/tournaments/<pk>/groups/<group_id>/matches/<match_id>/table/
    Body: { table_number: int | null }
    Assigns or clears a table on a group match. Also auto-starts/stops the match.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, group_id, match_id):
        from .models import TournamentGroup, GroupMatch
        tournament = get_object_or_404(Tournament.objects.select_related('club'), pk=pk)
        if not _can_manage_tournament(request.user, tournament):
            return Response({"detail": "Нет прав."}, status=status.HTTP_403_FORBIDDEN)
        if _playoff_started(tournament):
            return Response({"detail": "Плей-офф уже начат — групповые результаты заблокированы."}, status=status.HTTP_400_BAD_REQUEST)
        group = get_object_or_404(TournamentGroup, pk=group_id, tournament=tournament)
        match = get_object_or_404(GroupMatch, pk=match_id, group=group)

        table_number = request.data.get("table_number")
        if table_number is not None:
            try:
                table_number = int(table_number)
                if table_number < 1:
                    raise ValueError
            except (TypeError, ValueError):
                return Response({"detail": "Номер стола должен быть положительным числом."}, status=400)

            # Validate the table isn't already occupied by another in-progress match
            from .models import GroupMatch as GM
            table_busy_group = (
                GM.objects.filter(
                    group__tournament=tournament,
                    table_number=table_number,
                    status=GM.IN_PROGRESS,
                ).exclude(pk=match.pk).exists()
            )
            table_busy_bracket = Match.objects.filter(
                tournament=tournament,
                table_number=table_number,
                status=Match.IN_PROGRESS,
            ).exists()
            if table_busy_group or table_busy_bracket:
                return Response(
                    {"detail": f"Стол {table_number} уже занят другим матчем."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        match.table_number = table_number
        just_started = False
        if table_number is not None and match.status == GroupMatch.PENDING:
            match.status = GroupMatch.IN_PROGRESS
            just_started = True
        elif table_number is None and match.status == GroupMatch.IN_PROGRESS:
            match.status = GroupMatch.PENDING
        match.save()
        if just_started:
            from notifications.services import notify_match_ready
            notify_match_ready(match, "group")

        from .serializers import GroupMatchSerializer
        _broadcast_event(
            str(pk),
            "group_match_updated",
            {"group_id": group.pk, "match": GroupMatchSerializer(match).data},
        )
        return Response(GroupMatchSerializer(match).data)


class StartPlayoffView(APIView):
    """POST /api/tournaments/<pk>/playoff/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        tournament = get_object_or_404(Tournament.objects.select_related('club'), pk=pk)
        if not _can_manage_tournament(request.user, tournament):
            return Response({"detail": "Нет прав."}, status=status.HTTP_403_FORBIDDEN)
        if tournament.format != Tournament.FORMAT_GROUP:
            return Response({"detail": "Плей-офф доступен только для группового формата."}, status=status.HTTP_400_BAD_REQUEST)

        # advance_count=None → advance ALL players from groups (розыгрыш всех мест)
        advance_count_raw = request.data.get("advance_count")
        advance_count = int(advance_count_raw) if advance_count_raw is not None else None
        matches = generate_playoff_from_groups(tournament, advance_count=advance_count)

        payload = {
            "tournament": TournamentSerializer(tournament).data,
            "matches": MatchSerializer(matches, many=True).data,
        }
        _broadcast_event(str(pk), "playoff_started", payload)
        return Response(payload)
