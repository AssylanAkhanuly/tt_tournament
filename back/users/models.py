import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, phone, name, password=None):
        if not phone:
            raise ValueError("Номер телефона обязателен")
        user = self.model(phone=phone, name=name)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, name, password):
        user = self.create_user(phone, name, password)
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField(max_length=20, unique=True, verbose_name="Телефон")
    name = models.CharField(max_length=150, verbose_name="Имя")
    # Почта — для ВРЕМЕННОГО входа по паролю ✳ (10.09.2026). По ТЗ §2 личность
    # подтверждает Smart Bridge по ИИН и паролей система не хранит; пока он не
    # подключён, председателю ГСК нужен способ войти. Вход по почте открыт только
    # тем, у кого есть роль (см. `LoginEmailView`).
    email = models.EmailField(unique=True, null=True, blank=True, verbose_name="Эл. почта")
    # Рейтинга здесь больше нет ✳ (10.09.2026): он один на систему и живёт в
    # рейтинговой карточке `rating.RatingProfile` — со своим происхождением,
    # журналом изменений и двумя знаками после запятой (TZ.md §7.1). Прежнее
    # целое поле было второй копией из прототипа SpinCoach и разъезжалось с ней.
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS = ["name"]

    objects = UserManager()

    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"

    def __str__(self):
        return f"{self.name} ({self.phone})"

    def has_role(self, kind: str) -> bool:
        return self.roles.filter(kind=kind).exists()


class Role(models.Model):
    """Роль пользователя — связка «пользователь → роль → область» (ТЗ §2,
    `ROLE` в `diagrams/domain.d2`).

    Роль не флажок на пользователе: у одного человека их бывает несколько, и
    каждая действует в своей области — во всей системе, в турнире, в клубе, за
    столом. Первой заведена роль председателя ГСК ✳ (10.09.2026); остальные
    роли из перечня федерации добавляются строками в `KIND_CHOICES`.
    """

    KIND_GSK_CHAIRMAN = "gsk_chairman"
    # Роль 1 ✳ (28.10.2026). Экранов Э1.x ещё нет: пока это права председателя
    # ГСК плюс Django-админка (`users/permissions.py`, `create_federation_admin`).
    # Кабинет на фронте — `/dashboard`, разделы задаст владелец продукта.
    KIND_FEDERATION_ADMIN = "federation_admin"
    # Спортсмен и судья ✳ (28.10.2026): роли заведены, кабинеты пустые
    # (`/player`, `/referee` на фронте), прав сверх входа у них пока нет.
    KIND_PLAYER = "player"
    KIND_REFEREE = "referee"
    # Судейские должности турнира ✳ (28.10.2026, ТЗ §2, роли 6–8): у каждого
    # турнира по одному главному судье, заместителю и главному секретарю —
    # роль с областью «турнир». Судья стола — `KIND_REFEREE` (роль 9) с той же
    # областью, их сколько угодно. Правила — `tournaments/roster.py`.
    KIND_CHIEF_REFEREE = "chief_referee"
    KIND_DEPUTY_CHIEF_REFEREE = "deputy_chief_referee"
    KIND_CHIEF_SECRETARY = "chief_secretary"
    KIND_CHOICES = [
        (KIND_GSK_CHAIRMAN, "Председатель Главной судейской коллегии"),
        (KIND_FEDERATION_ADMIN, "Администратор федерации"),
        (KIND_PLAYER, "Спортсмен"),
        (KIND_REFEREE, "Судья"),
        (KIND_CHIEF_REFEREE, "Главный судья соревнований"),
        (KIND_DEPUTY_CHIEF_REFEREE, "Заместитель главного судьи"),
        (KIND_CHIEF_SECRETARY, "Главный секретарь соревнований"),
    ]

    SCOPE_SYSTEM = "system"
    SCOPE_CHOICES = [
        (SCOPE_SYSTEM, "Система"),
        ("tournament", "Турнир"),
        ("club", "Клуб"),
        ("table", "Стол"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="roles")
    kind = models.CharField(max_length=32, choices=KIND_CHOICES, verbose_name="Роль")
    scope = models.CharField(
        max_length=16, choices=SCOPE_CHOICES, default=SCOPE_SYSTEM, verbose_name="Область"
    )
    scope_id = models.UUIDField(null=True, blank=True, verbose_name="Объект области")
    granted_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="roles_granted",
        verbose_name="Кем выдана",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Роль"
        verbose_name_plural = "Роли"
        unique_together = ("user", "kind", "scope", "scope_id")

    def __str__(self):
        return "%s — %s" % (self.user.name, self.get_kind_display())
