"""Заявители ✳ (19.11.2026, ТЗ §8.2): кто и за кого подаёт заявку на турнир.

Каждый вид заявителя — класс с одним контрактом:

- `acts(user)` — может ли этот человек вообще подавать в этом качестве (есть
  ли у него роль);
- `owns(user, athlete)` — «его» ли это спортсмен: сам он, его регион, его клуб;
- `candidates(user)` — кого он может заявить, для экрана заявки.

Какие виды разрешены на турнире — настройка турнира (`applicant_kinds`), а не
вид соревнования. Новый способ подать заявку («директор спортшколы за своих
учеников») — новый класс здесь и строка в `REGISTRY`; проверки допуска и ручки
не меняются. Клуба (`club_admin`) пока нет: он заявляет команды Евразийской
лиги, а командной ветки ещё нет (QUESTIONS 11.x).
"""
from typing import Dict, Iterable, List, Set

from rating.models import RatingProfile
from users.models import Role, User

from .errors import AdmissionError

__all__ = ["AdmissionError", "REGISTRY", "get", "clean_kinds", "labels"]


class Applicant:
    key = ""
    label = ""
    # Отказ по спортсмену, который не «его».
    not_owned = ""

    def acts(self, user) -> bool:
        raise NotImplementedError

    def owns(self, user, athlete) -> bool:
        raise NotImplementedError

    def candidates(self, user):
        raise NotImplementedError


class Self(Applicant):
    """Спортсмен записывается сам — открытые турниры (ТЗ §8.2)."""

    key = "self"
    label = "Спортсмен сам"
    not_owned = "Спортсмен заявляет только себя."

    def acts(self, user) -> bool:
        return bool(user and user.is_authenticated)

    def owns(self, user, athlete) -> bool:
        return athlete.pk == user.pk

    def candidates(self, user):
        return User.objects.filter(pk=user.pk)


class RegionalHeadCoach(Applicant):
    """Старший тренер региона — главные старты, одна заявка списком за свой
    регион (ТЗ §8.2, ROLES.md роль 12). Регион спортсмена — из рейтинговой
    карточки; без карточки или региона спортсмен ничей."""

    key = Role.KIND_REGIONAL_HEAD_COACH
    label = "Старший тренер региона"
    not_owned = "Спортсмен не из вашего региона."

    def regions(self, user) -> Set[str]:
        if not user or not user.is_authenticated:
            return set()
        return set(
            Role.objects.filter(user=user, kind=self.key, scope=Role.SCOPE_REGION)
            .exclude(region="")
            .values_list("region", flat=True)
        )

    def acts(self, user) -> bool:
        return bool(self.regions(user))

    def owns(self, user, athlete) -> bool:
        return RatingProfile.objects.filter(user=athlete, region__in=self.regions(user)).exists()

    def candidates(self, user):
        return User.objects.filter(is_active=True, rating_profile__region__in=self.regions(user))


# Порядок — порядок показа в настройках турнира.
REGISTRY: Dict[str, Applicant] = {a.key: a for a in (Self(), RegionalHeadCoach())}


def get(key: str) -> Applicant:
    applicant = REGISTRY.get(key)
    if applicant is None:
        raise AdmissionError("Неизвестный заявитель.")
    return applicant


def clean_kinds(value, allow_empty: bool = False) -> List[str]:
    """Список ключей заявителей: только из реестра, без повторов, в порядке
    реестра. Турнир без единого заявителя не принимает заявок вовсе — это
    ошибка настройки; пустой список допустим только у шаблона командного вида,
    чей заявитель ещё не заведён."""
    if not isinstance(value, list) or any(not isinstance(k, str) for k in value):
        raise AdmissionError("Заявители — списком.")
    unknown = [k for k in value if k not in REGISTRY]
    if unknown:
        raise AdmissionError("Неизвестный заявитель: %s." % ", ".join(unknown))
    if not value and not allow_empty:
        raise AdmissionError("Укажите, кто подаёт заявку.")
    return [k for k in REGISTRY if k in value]


def labels(keys: Iterable[str]) -> str:
    return ", ".join(REGISTRY[k].label.lower() for k in keys if k in REGISTRY)
