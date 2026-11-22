"""УМО — динамика углублённого медицинского осмотра ✳ (22.11.2026, NATIONAL.md «Медкарта: УМО»).

Шаблон — таблица «Динамика спортсмена: УМО» врача сборной (присланный файл
`УМО3_динамика_спортсмена.xlsx`; в нём результаты живой спортсменки, поэтому
сам файл в репозиторий не кладём — оцифрован только шаблон: блоки, параметры,
единицы, референсы лаборатории и пояснения). Осмотр — раз в 3 месяца.

Здесь чистая часть без базы: каталог (9 блоков; 1–6 — рычаги, 7–9 — допуск и
контроль), расчётные параметры (ИМТ, объём нагрузки, кортизол/тестостерон,
ориентир воды), «последнее значение», Δ к базе (%) и к предыдущему (в единицах),
статус по референсу. Правила — как в шаблоне: значения идут по осмотрам без
пропусков, «последнее» и Δ — от первого до последнего заполненного, статус —
по последнему.

**Референсы** — из карточки УМО лаборатории НЦСМиР, по которой сделан шаблон;
карточка женская. У параметров, где норма зависит от пола (`female_ref`),
мужчине референс не показывается и статус не считается: мужских значений в
присланном нет — открытый вопрос (QUESTIONS.md 23.1). Сменилась лаборатория —
референсы правятся здесь."""
from dataclasses import dataclass, field
from typing import Callable, Dict, List, Optional, Sequence, Tuple

NUM = "num"
TEXT = "text"


@dataclass(frozen=True)
class Param:
    code: str
    name: str
    unit: str = ""
    ref: Tuple[Optional[float], Optional[float]] = (None, None)
    kind: str = NUM
    key: bool = False  # ★ — ключевой минимум для сравнения между осмотрами
    reflects: str = ""
    signal: str = ""
    female_ref: bool = False  # референс из женской карточки — мужчине не показываем
    female_only: bool = False  # параметр только у женщин (цикл)
    calc: Optional[Callable[[Dict[str, Optional[float]], Dict[str, Optional[float]]], Optional[float]]] = None


@dataclass(frozen=True)
class Block:
    code: str
    n: int
    title: str
    about: str
    impact: str  # «на что влияет → что делаем» для сводки
    control: bool  # блоки 7–9 — допуск и контроль, 1–6 — рычаги
    params: Tuple[str, ...] = field(default_factory=tuple)


def _div(a, b):
    return a / b if a is not None and b else None


P: Dict[str, Param] = {}


def _p(*items: Param):
    for x in items:
        P[x.code] = x


_p(
    # 1. Питание и энергия
    Param("weight", "Вес", "кг", key=True, reflects="Базовый маркер энергобаланса.",
          signal="Устойчивое снижение веса при неизменной или растущей нагрузке."),
    Param("bmi", "ИМТ", "кг/м²", reflects="Контекст к весу (рост — из сведений осмотра).",
          signal="Снижение ИМТ до <18,5 — риск дефицита энергии.",
          calc=lambda v, c: _div(v.get("weight"), ((c.get("height") or 0) / 100) ** 2) if c.get("height") else None),
    Param("menstrual", "Менструальный цикл", kind=TEXT, female_only=True, reflects="Клинический маркер энергодоступности.",
          signal="Любое нарушение цикла (нерегулярность, задержки, аменорея)."),
    Param("appetite", "Аппетит", kind=TEXT, reflects="Субъективный маркер энергетического баланса.",
          signal="Устойчивое снижение аппетита."),
    Param("tsh", "ТТГ", "мкМЕ/мл", (0.3, 4.0), key=True,
          reflects="Регуляция щитовидной железы; при дефиците энергии снижается или остаётся низконормальным.",
          signal="Смещение вниз от базы вместе со снижением fT4."),
    Param("ft4", "fT4 свободный", "пмоль/л", (10.0, 25.0), reflects="Активность щитовидной железы («метаболический тормоз»).",
          signal="Снижение между осмотрами при стабильном или падающем весе."),
    Param("testosterone", "Тестостерон", "нмоль/л", (0.0, 4.6), key=True, female_ref=True,
          reflects="Анаболический фон; у женщин чувствителен к дефициту энергии и перетренированности.",
          signal="Падение от базы при растущей нагрузке."),
    Param("glucose", "Глюкоза", "ммоль/л", (3.33, 6.1), reflects="Доступность топлива.",
          signal="Низконормальные значения при высокой нагрузке."),
    Param("protein", "Общий белок", "г/л", (66.0, 83.0), reflects="Белковый статус и питание.", signal="Снижение ниже референса."),
    Param("cholesterol", "Холестерин общий", "ммоль/л", (None, 5.16), reflects="Жировой компонент питания.",
          signal="Резкое изменение профиля липидов — пересмотреть питание."),
    Param("ldl", "ЛПНП", "ммоль/л", (2.6, 4.1), reflects="Низкие значения у спортсменов — маложировое питание или много клетчатки.",
          signal="Дальнейшее снижение при ограничении питания."),
    Param("hdl", "ЛПВП", "ммоль/л", (1.04, 1.55), reflects="Обычно благоприятный профиль у тренированных.", signal="Резкие колебания."),
    Param("ketones", "Кетоны в моче", kind=TEXT, reflects="Появляются при голодании или низкоуглеводном питании.",
          signal="Любое положительное значение."),
    # 2. Кислород
    Param("ferritin", "Ферритин", "нг/мл", (20.0, 110.0), key=True, female_ref=True,
          reflects="Запас железа — самый ранний маркер дефицита.",
          signal="Снижение от осмотра к осмотру при росте нагрузки. Для спортсменок около 30–35 нг/мл и ниже — зона внимания (ориентир)."),
    Param("iron", "Железо сывороточное", "мкмоль/л", (7.16, 26.85),
          reflects="Транспорт железа; сильно зависит от времени суток и питания.", signal="Снижение вместе с падением ферритина."),
    Param("hemoglobin", "Гемоглобин", "г/л", (120.0, 155.0), key=True, female_ref=True,
          reflects="Ёмкость крови; снижение — поздний признак. Растёт при обезвоживании.",
          signal="Снижение от базы; рост — сверять с гидратацией (блок «Вода»)."),
    Param("rbc", "Эритроциты (RBC)", "×10¹²/л", (3.8, 5.1), female_ref=True, reflects="Количество эритроцитов.", signal="Снижение вместе с Hb."),
    Param("mcv", "MCV (средний объём эритроцитов)", "фл", (70.0, 100.0),
          reflects="Размер эритроцита: снижение — железодефицит; рост — дефицит B12/фолата.", signal="Тренд вниз при падающем ферритине."),
    Param("mch", "MCH", "пг", (25.0, 35.0), reflects="Содержание Hb в эритроците.", signal="Снижение."),
    Param("mchc", "MCHC", "г/л", (330.0, 360.0), reflects="Концентрация Hb в эритроците.", signal="Снижение."),
    Param("rdw_cv", "RDW-CV", "%", (11.7, 14.7), reflects="Разброс размеров эритроцитов — ранний признак дефицита железа.",
          signal="Рост к верхней границе и выше."),
    Param("rdw_sd", "RDW-SD", "фл", (36.4, 46.3), reflects="Разброс размеров эритроцитов (абсолютный).", signal="Рост."),
    # 3. Нагрузка и выгорание
    Param("rank", "Спортивный разряд", kind=TEXT, reflects="Спортивный анамнез.", signal="Изменение разряда."),
    Param("results", "Динамика спортивных результатов", kind=TEXT, reflects="Главный критерий эффективности подготовки.",
          signal="«Стабильно» или «ухудшается» при растущей нагрузке."),
    Param("sessions", "Тренировок в неделю", "раз", reflects="Частота нагрузки.", signal="Рост частоты без увеличения восстановления."),
    Param("session_hours", "Часов за тренировку", "ч", reflects="Длительность занятия."),
    Param("load_volume", "Объём нагрузки", "ч/нед", reflects="Расчёт: тренировок × часов.",
          signal="Рост объёма — сверять с КФК, кортизолом, ферритином.",
          calc=lambda v, c: v["sessions"] * v["session_hours"] if v.get("sessions") is not None and v.get("session_hours") is not None else None),
    Param("tolerance", "Переносимость нагрузок", kind=TEXT, reflects="Субъективная адаптация.", signal="«Снижена»."),
    Param("recovery", "Восстановление", kind=TEXT, reflects="Субъективное восстановление.", signal="«Замедленное»."),
    Param("sleep", "Сон", kind=TEXT, reflects="Восстановление, гормональная регуляция.", signal="Ухудшение сна при росте нагрузки."),
    Param("ck", "КФК", "Ед/л", (0.0, 170.0), key=True, female_ref=True,
          reflects="Повреждение мышечных волокон; зависит от времени после последней тренировки.",
          signal="Стойкое повышение при сопоставимом заборе."),
    Param("ck_mb", "КФ-МВ", "Ед/л", (None, 24.0), reflects="Сердечная фракция КФК.", signal="Рост."),
    Param("ldh", "ЛДГ", "Ед/л", (230.0, 460.0), reflects="Тканевое повреждение.", signal="Выход за верхнюю границу вместе с КФК."),
    Param("ast", "АСТ", "Ед/л", (0.0, 31.0), female_ref=True, reflects="Повреждение мышц и печени.", signal="Рост вместе с КФК."),
    Param("alt", "АЛТ", "Ед/л", (0.0, 32.0), female_ref=True, reflects="Более специфичен для печени.", signal="Рост."),
    Param("urea", "Мочевина", "ммоль/л", (2.5, 7.5), key=True,
          reflects="Распад белка; растёт при высокобелковом питании и обезвоживании.", signal="Рост при неизменной диете и гидратации."),
    Param("uric_acid", "Мочевая кислота", "мкмоль/л", (149.0, 405.0), female_ref=True, reflects="Обмен пуринов, нагрузка.", signal="Рост."),
    Param("creatinine", "Креатинин", "мкмоль/л", (53.0, 97.2), female_ref=True, reflects="Мышечная масса и функция почек.",
          signal="Рост при обезвоживании."),
    Param("cortisol", "Кортизол", "нмоль/л", (140.0, 600.0), key=True,
          reflects="Стрессовая реакция; значим при стандартном времени забора.", signal="Устойчивое смещение от базы."),
    Param("cortisol_testosterone", "Кортизол / тестостерон", "ед.",
          reflects="Расчёт: баланс катаболизм/анаболизм (оба показателя в нмоль/л).",
          signal="Рост — смещение в катаболизм. Значим только при стандартном заборе.",
          calc=lambda v, c: _div(v.get("cortisol"), v.get("testosterone"))),
    # 4. Опора и движение
    Param("pain", "Жалобы на боль (где, когда, интенсивность)", kind=TEXT, reflects="Ранний сигнал перегрузки тканей.",
          signal="Новая или усиливающаяся боль, связанная с нагрузкой."),
    Param("posture", "Осанка", kind=TEXT, reflects="Общая биомеханика, нагрузка на позвоночник.", signal="Новые или усиливающиеся асимметрии."),
    Param("spine_upper", "Шейный и грудной отдел: подвижность", kind=TEXT, reflects="Подвижность и мышечное напряжение.",
          signal="Ограничение подвижности, болезненные уплотнения мышц."),
    Param("spine_lower", "Поясничный отдел и таз", kind=TEXT, reflects="Опора и передача нагрузки при игре в стойке.",
          signal="Боль, ограничение подвижности, асимметрия таза."),
    Param("shoulder", "Плечевой пояс и рабочая рука", kind=TEXT, reflects="Основная зона перегрузки при игре.",
          signal="Боль, снижение амплитуды движений, слабость."),
    Param("legs", "Нижние конечности и стопа", kind=TEXT, reflects="Опора и работа ног при перемещениях.", signal="Боль, отёк, асимметрия нагрузки."),
    Param("balance", "Мышечный баланс (асимметрии справа и слева)", kind=TEXT, reflects="Разница между правой и левой стороной.",
          signal="Нарастание разницы между осмотрами."),
    Param("function_tests", "Функциональные тесты (по протоколу врача)", kind=TEXT, reflects="Динамика двигательных возможностей.",
          signal="Ухудшение результата от осмотра к осмотру."),
    # 5. Иммунная защита
    Param("crp", "СРБ", "мг/л", (0.0, 6.0), reflects="Острое воспаление.", signal="Рост выше референса."),
    Param("wbc", "Лейкоциты (WBC)", "×10⁹/л", (3.7, 9.5), reflects="Общий иммунный фон.", signal="Устойчивое снижение при высокой нагрузке."),
    Param("neut_abs", "Нейтрофилы абс.", "×10⁹/л", (1.56, 6.13), reflects="Бактериальный ответ.", signal="Выход за референс."),
    Param("neut_pct", "Нейтрофилы %", "%", (34.0, 71.1), reflects="Доля нейтрофилов.", signal="Выход за референс."),
    Param("lymph_abs", "Лимфоциты абс.", "×10⁹/л", (0.9, 5.0), reflects="Вирусный ответ, иммунитет.", signal="Снижение после тяжёлых блоков."),
    Param("lymph_pct", "Лимфоциты %", "%", (18.0, 40.0), reflects="Доля лимфоцитов.", signal="Выход за референс."),
    Param("mono_abs", "Моноциты абс.", "×10⁹/л", (0.24, 0.36), reflects="Фаза восстановления после воспаления.", signal="Выход за референс."),
    Param("mono_pct", "Моноциты %", "%", (3.0, 12.0), reflects="Доля моноцитов.", signal="Выход за референс."),
    Param("eos_abs", "Эозинофилы абс.", "×10⁹/л", (0.04, 0.36), reflects="Аллергия, паразиты.", signal="Рост."),
    Param("eos_pct", "Эозинофилы %", "%", (0.0, 5.0), reflects="Доля эозинофилов.", signal="Рост."),
    Param("baso_abs", "Базофилы абс.", "×10⁹/л", (0.01, 0.15), reflects="Аллергический компонент.", signal="Выход за референс."),
    Param("baso_pct", "Базофилы %", "%", (0.0, 1.0), reflects="Доля базофилов.", signal="Выход за референс."),
    Param("plt", "Тромбоциты (PLT)", "×10⁹/л", (169.1, 360.0), reflects="Свёртываемость, реакция на воспаление.", signal="Выход за референс."),
    Param("mpv", "MPV (средний объём тромбоцитов)", "фл", (9.0, 17.0),
          reflects="Средний объём тромбоцитов; при нормальных PLT значение клинически слабое.", signal="Сохраняющееся отклонение."),
    Param("esr", "СОЭ", "мм/ч", (2.0, 15.0), female_ref=True, reflects="Неспецифический маркер воспаления.", signal="Рост."),
    # 6. Зрение
    Param("visus_od", "Острота зрения, правый глаз", kind=TEXT, reflects="Базовая функция зрения.", signal="Снижение остроты."),
    Param("visus_os", "Острота зрения, левый глаз", kind=TEXT, reflects="Базовая функция зрения.", signal="Снижение остроты."),
    Param("correction", "Коррекция (очки, линзы, диоптрии)", kind=TEXT, reflects="Используется ли и достаточна ли коррекция.",
          signal="Изменение диоптрий, отсутствие нужной коррекции."),
    Param("binocular", "Бинокулярное зрение и аккомодация", kind=TEXT,
          reflects="Совместная работа глаз и быстрая фокусировка на мяче.", signal="Нарушение фокусировки или совместной работы глаз."),
    Param("iop", "Внутриглазное давление", kind=TEXT, reflects="Скрининг состояния глаза.", signal="Выход за норму."),
    Param("fundus", "Глазное дно", kind=TEXT, reflects="Состояние сетчатки и сосудов.", signal="Новые находки."),
    Param("eye_complaints", "Жалобы (утомление, двоение, головная боль к концу тренировки)", kind=TEXT,
          reflects="Субъективная нагрузка на зрение.", signal="Новые или усиливающиеся жалобы."),
    # 7. Сердце
    Param("hr_rest", "Пульс покоя (при осмотре)", "уд/мин", key=True, reflects="ЧСС в момент осмотра.", signal="Рост от базы при той же нагрузке."),
    Param("bp_sys", "АД систолическое", "мм рт. ст.", reflects="Гемодинамика покоя.", signal="Значимые отклонения от базы."),
    Param("bp_dia", "АД диастолическое", "мм рт. ст.", reflects="Гемодинамика покоя.", signal="Значимые отклонения от базы."),
    Param("ecg_hr_min", "ЭКГ: ЧСС минимальная", "уд/мин", reflects="Брадикардия — признак тренированности.", signal="Резкое изменение."),
    Param("ecg_hr_max", "ЭКГ: ЧСС максимальная", "уд/мин", reflects="Диапазон ЧСС на ЭКГ в покое.", signal="Рост верхней границы диапазона."),
    Param("ecg_rhythm", "ЭКГ: ритм", kind=TEXT, reflects="Ритм по заключению ЭКГ.", signal="Новые нарушения ритма или проводимости."),
    Param("ecg_axis", "ЭКГ: электрическая ось", kind=TEXT, reflects="Положение ЭОС.", signal="Смещение оси."),
    Param("echo_cavities", "ЭхоКГ: полости", kind=TEXT, reflects="Размеры полостей.", signal="Расширение полостей."),
    Param("echo_walls", "ЭхоКГ: стенки", kind=TEXT, reflects="Толщина стенок.", signal="Утолщение стенок."),
    Param("echo_valves", "ЭхоКГ: клапаны", kind=TEXT, reflects="Регургитация на клапанах.", signal="Рост степени регургитации."),
    Param("echo_vmax", "ЭхоКГ: Vmax на аортальном клапане", "м/с", reflects="Скорость кровотока на аортальном клапане.", signal="Рост."),
    Param("echo_pg", "ЭхоКГ: градиент давления (PG)", "мм рт. ст.", reflects="Градиент на аортальном клапане.", signal="Рост."),
    Param("echo_conclusion", "ЭхоКГ: заключение", kind=TEXT, reflects="Итог исследования.", signal="Любые новые находки."),
    # 8. Печень и желчные пути
    Param("bili_total", "Билирубин общий", "мкмоль/л", (3.4, 20.5), key=True, reflects="Общий пигментный обмен.",
          signal="Изолированный рост непрямой фракции при нормальных Hb и ЛДГ типичен для функциональной гипербилирубинемии "
                 "(усиливается при голодании, нагрузке, обезвоживании). Рост вместе с АЛТ/АСТ/ЩФ — повод для расширенного обследования."),
    Param("bili_direct", "Билирубин прямой", "мкмоль/л", (0.0, 3.42), reflects="Связанная фракция; отражает отток желчи.", signal="Рост вместе с ЩФ."),
    Param("bili_indirect", "Билирубин непрямой", "мкмоль/л", (0.0, 15.5), reflects="Несвязанная фракция; чувствительна к голоданию и гемолизу.",
          signal="Рост при падающем Hb — искать гемолиз."),
    Param("alp", "Щелочная фосфатаза", "Ед/л", (98.0, 279.0), female_ref=True, reflects="Желчевыводящие пути и костный обмен.",
          signal="Рост вместе с прямым билирубином."),
    Param("abdominal_us", "УЗИ органов брюшной полости", kind=TEXT, reflects="Состояние желчного пузыря, поджелудочной, почек.",
          signal="Появление новых находок или усиление имеющихся."),
    # 9. Вода и электролиты
    Param("sodium", "Натрий", "ммоль/л", (136.0, 146.0), reflects="Водно-электролитный баланс.", signal="Рост к верхней границе — признак недопития."),
    Param("calcium", "Кальций общий", "ммоль/л", (2.1, 2.6), reflects="Нервно-мышечная возбудимость.",
          signal="Снижение ниже референса; интерпретировать с общим белком (блок «Питание»)."),
    Param("magnesium", "Магний", "ммоль/л", (0.65, 1.03), reflects="Мышечный тонус, судороги; зависит от приёма добавок.",
          signal="Выход за верхнюю границу при приёме добавок."),
    Param("phosphorus", "Фосфор", "ммоль/л", (0.8, 1.61), reflects="Энергетический обмен (АТФ), мышечная функция.", signal="Выход за референс."),
    Param("urine_sg", "Относительная плотность мочи (SG)", "", (1.008, 1.025), reflects="Концентрация мочи — прямой маркер гидратации.",
          signal="Стойко выше 1,025 — недостаточно жидкости; ниже 1,008 — избыточно."),
    Param("urine_ph", "pH мочи", "", (4.8, 7.5), reflects="Кислотность мочи.", signal="Выход за референс."),
    Param("urine_protein", "Белок в моче", kind=TEXT, reflects="Функция почек, нагрузка.", signal="Любое положительное значение."),
    Param("urine_glucose", "Глюкоза в моче", kind=TEXT, reflects="Углеводный обмен.", signal="Любое положительное значение."),
    Param("urine_rbc", "Эритроциты в моче", kind=TEXT, reflects="Микротравма или патология мочевых путей.", signal="Любое положительное значение."),
    Param("urine_wbc", "Лейкоциты в моче", kind=TEXT, reflects="Воспаление мочевых путей.", signal="Любое положительное значение."),
    Param("water_target", "Ориентир водного режима (30 мл/кг)", "мл/сут", reflects="Расчёт по весу.",
          signal="Сверять с фактическим питьевым режимом.",
          calc=lambda v, c: v["weight"] * 30 if v.get("weight") is not None else None),
)

BLOCKS: Tuple[Block, ...] = (
    Block("nutrition", 1, "Питание и энергия", "Обеспечение организма энергией и питательными веществами (RED-S). Перестройка идёт месяцами.",
          "Сила, темп в длинном матче → питание", False,
          ("weight", "bmi", "menstrual", "appetite", "tsh", "ft4", "testosterone", "glucose", "protein", "cholesterol", "ldl", "hdl", "ketones")),
    Block("oxygen", 2, "Кислород", "Запас — транспорт — ёмкость.", "Выносливость на турнире → железо, питание", False,
          ("ferritin", "iron", "hemoglobin", "rbc", "mcv", "mch", "mchc", "rdw_cv", "rdw_sd")),
    Block("load", 3, "Нагрузка и выгорание",
          "Маркеры повреждения мышц, распада белка и стресса; кортизол/тестостерон — баланс катаболизма и анаболизма. Короткая дистанция.",
          "Концентрация, срывы → нагрузка и разгрузка", False,
          ("rank", "results", "sessions", "session_hours", "load_volume", "tolerance", "recovery", "sleep", "ck", "ck_mb", "ldh", "ast", "alt",
           "urea", "uric_acid", "creatinine", "cortisol", "cortisol_testosterone")),
    Block("support", 4, "Опора и движение", "Травматизм, хронические боли.", "Травматизм, боли → мануальная терапия, коррекция движений", False,
          ("pain", "posture", "spine_upper", "spine_lower", "shoulder", "legs", "balance", "function_tests")),
    Block("immune", 5, "Иммунная защита", "Фоновые инфекции, воспаления, перегрузка иммунной системы.",
          "Частота болезней → сон, режим, лечение очагов", False,
          ("crp", "wbc", "neut_abs", "neut_pct", "lymph_abs", "lymph_pct", "mono_abs", "mono_pct", "eos_abs", "eos_pct", "baso_abs", "baso_pct",
           "plt", "mpv", "esr")),
    Block("vision", 6, "Зрение", "Скорость реакции на мяч, концентрация.", "Скорость реакции → офтальмолог, коррекция", False,
          ("visus_od", "visus_os", "correction", "binocular", "iop", "fundus", "eye_complaints")),
    Block("heart", 7, "Сердце", "Допуск к нагрузке; при отклонениях — дообследование до сборов и соревнований.", "Допуск к нагрузке → кардиолог", True,
          ("hr_rest", "bp_sys", "bp_dia", "ecg_hr_min", "ecg_hr_max", "ecg_rhythm", "ecg_axis", "echo_cavities", "echo_walls", "echo_valves",
           "echo_vmax", "echo_pg", "echo_conclusion")),
    Block("liver", 8, "Печень", "Переносит ли организм нагрузку, питание и добавки — метаболический «фильтр».",
          "Безопасность добавок → пересмотр добавок и препаратов", True,
          ("bili_total", "bili_direct", "bili_indirect", "alt", "ast", "alp", "cholesterol", "abdominal_us")),
    Block("water", 9, "Вода", "Достаточно ли спортсмен пьёт.", "Гидратация → режим питья", True,
          ("sodium", "calcium", "magnesium", "phosphorus", "urine_sg", "urine_ph", "urine_protein", "urine_glucose", "urine_rbc", "urine_wbc",
           "water_target")),
)

INPUT_CODES = frozenset(c for c, p in P.items() if p.calc is None)


class UmoError(ValueError):
    pass


def parse_number(raw) -> Optional[float]:
    """Число из ввода врача: запятая или точка; пусто — None."""
    if raw is None:
        return None
    s = str(raw).strip().replace(",", ".").replace(" ", "")
    if not s:
        return None
    return float(s)


def clean_values(values: Dict[str, object]) -> Dict[str, str]:
    """Проверить ввод осмотра: только вводимые параметры, числа — числами.
    Пустая строка значит «стереть»."""
    out: Dict[str, str] = {}
    for code, raw in (values or {}).items():
        p = P.get(code)
        if p is None or p.calc is not None:
            raise UmoError("Неизвестный параметр: %s." % code)
        text = "" if raw is None else str(raw).strip()
        if text and p.kind == NUM:
            try:
                parse_number(text)
            except ValueError:
                raise UmoError("«%s» — нужно число." % p.name)
            text = text.replace(",", ".").replace(" ", "")
        if len(text) > 300:
            raise UmoError("«%s» — не длиннее 300 знаков." % p.name)
        out[code] = text
    return out


def _ref(p: Param, sex: str):
    if p.female_ref and sex != "f":
        return (None, None)
    return p.ref


def _status(value: Optional[float], ref) -> Optional[str]:
    lo, hi = ref
    if value is None or (lo is None and hi is None):
        return None
    if lo is not None and value < lo:
        return "low"
    if hi is not None and value > hi:
        return "high"
    return "ok"


def table(exams: Sequence[Dict], sex: str) -> List[Dict]:
    """Блоки с параметрами по осмотрам. `exams` — от старых к новым:
    `{"values": {code: str}, "height": float|None}`."""
    nums: List[Dict[str, Optional[float]]] = []
    for e in exams:
        v = {c: (parse_number(x) if P[c].kind == NUM and c in P else None) for c, x in e["values"].items() if c in P}
        ctx = {"height": e.get("height")}
        for c, p in P.items():
            if p.calc is not None:
                try:
                    v[c] = p.calc(v, ctx)
                except (TypeError, ZeroDivisionError):
                    v[c] = None
        nums.append(v)

    blocks = []
    for b in BLOCKS:
        params, numeric, low, high = [], 0, 0, 0
        for code in b.params:
            p = P[code]
            if p.female_only and sex == "m":
                continue
            if p.kind == NUM:
                series = [n.get(code) for n in nums]
            else:
                series = [(e["values"].get(code) or None) for e in exams]
            filled = [x for x in series if x is not None]
            last = filled[-1] if filled else None
            ref = _ref(p, sex)
            row = {
                "code": code, "name": p.name, "unit": p.unit, "kind": p.kind, "key": p.key, "calc": p.calc is not None,
                "ref_min": ref[0], "ref_max": ref[1], "reflects": p.reflects, "signal": p.signal,
                "values": [round(x, 4) if isinstance(x, float) else x for x in series],
                "last": round(last, 4) if isinstance(last, float) else last,
                "delta_base_pct": None, "delta_prev": None, "status": None,
                "statuses": [_status(x, ref) if p.kind == NUM else None for x in series],
            }
            if p.kind == NUM and filled:
                numeric += 1
                if len(filled) > 1:
                    base, prev = filled[0], filled[-2]
                    row["delta_base_pct"] = round((last - base) / base * 100, 1) if base else None
                    row["delta_prev"] = round(last - prev, 4)
                row["status"] = _status(last, ref)
                low += row["status"] == "low"
                high += row["status"] == "high"
            params.append(row)
        blocks.append({
            "code": b.code, "n": b.n, "title": b.title, "about": b.about, "impact": b.impact, "control": b.control,
            "params": params, "summary": {"numeric": numeric, "low": low, "high": high},
        })
    return blocks
