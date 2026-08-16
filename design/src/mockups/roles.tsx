/* Кто пользователь и что у него в сайдбаре — по каждой из четырнадцати ролей.

   Пункты навигации повторяют экраны роли из `flows/` (и её схемы), поэтому
   макет читается вместе с флоу: пункт меню = экран Э№.№. */

import {
  BarChart3, Bell, CalendarDays, ClipboardCheck, ClipboardList, Eye, FileSpreadsheet,
  FileText, Gavel, Grid3x3, History, LayoutDashboard, ListChecks, Newspaper, Scale,
  Scroll, Search, Shield, Table2, Timer, Trophy, User, UserCog, Users, Wallet,
} from 'lucide-react';
import { A, AW, type RoleUI } from './shell';

const FED_BRAND = { brandName: 'Сезон 2026', brandSub: 'Календарь ФНТ РК · 8 главных стартов' };
/* Значок «ИДЁТ» уместен только у ролей внутри турнира — у остальных его нет. */
const TOUR_BRAND = {
  brandName: 'Чемпионат Казахстана 2026',
  brandSub: 'Одиночный · олимпийская · г. Астана',
  badge: 'ИДЁТ',
};

/* Сквозные экраны (вход, профиль, уведомления, публичная часть) показываем в
   оболочке администратора Федерации: она ничем не отличается от чужой — в том и
   смысл, что профиль и уведомления у всех ролей одинаковые. */
export const R00: RoleUI = {
  num: '0', title: 'Сквозные экраны',
  person: { nm: 'Абаева Д.', rl: 'Администратор Федерации', av: AW(44) },
  ...FED_BRAND,
  /* Меню — один в один как у роли 1: сквозной экран показывается в её оболочке,
     и пункт, за которым нет экрана, кликается в пустоту (так «Реестры» и висели
     после того, как реестры переехали во вкладки «Пользователей»). */
  nav: [
    [<LayoutDashboard size={18} />, 'Панель'],
    [<CalendarDays size={18} />, 'Календарь'],
    [<UserCog size={18} />, 'Пользователи'],
    [<History size={18} />, 'Журнал'],
    [<Newspaper size={18} />, 'Новости'],
  ],
  /* У человека бывает несколько ролей: под какой он работает — видно в шапке,
     там же и переключается. Роли выдаёт администратор Федерации. */
  roles: ['Администратор Федерации', 'Менеджер · только чтение'],
};

export const R01: RoleUI = {
  num: '1', title: 'Администратор Федерации',
  person: { nm: 'Абаева Д.', rl: 'Администратор Федерации', av: AW(44) },
  ...FED_BRAND,
  nav: [
    [<LayoutDashboard size={18} />, 'Панель'],
    [<CalendarDays size={18} />, 'Календарь'],
    [<UserCog size={18} />, 'Пользователи'],
    [<History size={18} />, 'Журнал'],
    [<Newspaper size={18} />, 'Новости'],
  ],
};

export const R02: RoleUI = {
  num: '2', title: 'Экономист / бухгалтер',
  person: { nm: 'Сериков Н.', rl: 'Экономист ФНТ РК', av: A(60) },
  brandName: 'Взносы 2026', brandSub: 'Годовой членский взнос федерации',
  nav: [
    [<Wallet size={18} />, 'Взносы'],
    [<FileSpreadsheet size={18} />, 'Выгрузки'],
  ],
};

export const R0304: RoleUI = {
  num: '3 и 4', title: 'Менеджеры-наблюдатели',
  person: { nm: 'Тлеуова А.', rl: 'Менеджер · только чтение', av: AW(21) },
  ...FED_BRAND,
  nav: [
    [<LayoutDashboard size={18} />, 'Обзор'],
    [<CalendarDays size={18} />, 'Календарь'],
    [<ClipboardList size={18} />, 'Заявки'],
    [<Users size={18} />, 'Реестры'],
    [<BarChart3 size={18} />, 'Рейтинги'],
    [<Bell size={18} />, 'Подписки'],
  ],
};

export const R05: RoleUI = {
  num: '5', title: 'Председатель ГСК',
  person: { nm: 'Мукашев Б.', rl: 'Председатель ГСК', av: A(83) },
  brandName: 'Судейство сезона', brandSub: 'Назначения · протоколы · рейтинг судей',
  nav: [
    [<Trophy size={18} />, 'Мои соревнования'],
    [<Gavel size={18} />, 'Заявки судей'],
    [<Shield size={18} />, 'Наряд'],
    [<Scroll size={18} />, 'Протоколы'],
    [<Scale size={18} />, 'Рейтинг судей'],
  ],
};

export const R06: RoleUI = {
  num: '6', title: 'Главный судья соревнований',
  person: { nm: 'Оспанов Т.', rl: 'Главный судья турнира', av: A(76) },
  ...TOUR_BRAND,
  nav: [
    [<LayoutDashboard size={18} />, 'Мой турнир'],
    [<ClipboardList size={18} />, 'Заявки'],
    [<Grid3x3 size={18} />, 'Сетка'],
    [<CalendarDays size={18} />, 'Расписание'],
    [<Shield size={18} />, 'Судьи на столах'],
    [<Timer size={18} />, 'Ход турнира'],
    [<Scroll size={18} />, 'Протокол'],
  ],
};

export const R07: RoleUI = {
  num: '7', title: 'Главный секретарь соревнований',
  person: { nm: 'Ким Л.', rl: 'Главный секретарь', av: AW(31) },
  ...TOUR_BRAND,
  nav: [
    [<LayoutDashboard size={18} />, 'Рабочий стол'],
    [<ListChecks size={18} />, 'Жеребьёвка'],
    [<Grid3x3 size={18} />, 'Сетка'],
    [<CalendarDays size={18} />, 'Расписание'],
    [<Scroll size={18} />, 'Протоколы'],
  ],
};

export const R08: RoleUI = {
  num: '8', title: 'Заместитель главного судьи',
  person: { nm: 'Сагинтаев Д.', rl: 'Заместитель главного судьи', av: A(37) },
  ...TOUR_BRAND,
  nav: [
    [<LayoutDashboard size={18} />, 'Мой турнир'],
    [<Timer size={18} />, 'Ход турнира'],
    [<Scale size={18} />, 'Мой рейтинг'],
  ],
};

export const R09: RoleUI = {
  num: '9', title: 'Судья',
  person: { nm: 'Оралбай Е.', rl: 'Судья · стол 4', av: A(39) },
  ...TOUR_BRAND,
  nav: [
    [<Trophy size={18} />, 'Мои турниры'],
    [<Table2 size={18} />, 'Мой стол'],
    [<Scale size={18} />, 'Мой рейтинг'],
  ],
};

export const R10: RoleUI = {
  num: '10', title: 'Инспектор / супервайзер',
  person: { nm: 'Каримов А.', rl: 'Инспектор', av: A(48) },
  brandName: 'Инспекция соревнований', brandSub: 'Контроль качества судейства',
  nav: [
    [<Eye size={18} />, 'На контроле'],
    [<Timer size={18} />, 'Ход турнира'],
    [<History size={18} />, 'Журнал правок'],
    [<FileText size={18} />, 'Заключения'],
  ],
};

export const R11: RoleUI = {
  num: '11', title: 'Главный тренер национальной команды',
  person: { nm: 'Ахметов С.', rl: 'Главный тренер сборной', av: A(52) },
  brandName: 'Сборная РК', brandSub: 'Кандидаты · рейтинг · результаты',
  nav: [
    [<Users size={18} />, 'Кандидаты'],
    [<User size={18} />, 'Карточка'],
    [<BarChart3 size={18} />, 'Сравнение'],
  ],
};

export const R12: RoleUI = {
  num: '12', title: 'Старший тренер региона',
  person: { nm: 'Байтасов Р.', rl: 'Старший тренер · Алматы', av: A(55) },
  brandName: 'Регион Алматы', brandSub: 'Заявки на главные старты РК',
  nav: [
    [<Users size={18} />, 'Мой регион'],
    [<CalendarDays size={18} />, 'Главные старты'],
    [<ClipboardCheck size={18} />, 'Состав'],
    [<ClipboardList size={18} />, 'Мои заявки'],
    [<Search size={18} />, 'Свои на турнире'],
  ],
};

export const R13: RoleUI = {
  num: '13', title: 'Администратор клуба',
  person: { nm: 'Досжан М.', rl: 'Администратор клуба «Алатау»', av: A(45) },
  brandName: 'Клуб «Алатау»', brandSub: 'Евразийская лига · 4 тура',
  nav: [
    [<Shield size={18} />, 'Мой клуб'],
    [<Users size={18} />, 'Люди клуба'],
    [<Trophy size={18} />, 'Команды Лиги'],
  ],
};

export const R14: RoleUI = {
  num: '14', title: 'Спортсмен',
  person: { nm: 'Ким Г.', rl: 'Спортсмен · рейтинг 2456', av: A(44) },
  brandName: 'Мой профиль', brandSub: 'Сайт и приложение',
  nav: [
    [<LayoutDashboard size={18} />, 'Главная'],
    [<CalendarDays size={18} />, 'Календарь'],
    [<ClipboardList size={18} />, 'Моя заявка'],
    [<Timer size={18} />, 'Мой матч'],
    [<BarChart3 size={18} />, 'Аналитика'],
    /* Новости федерации спортсмен читал только лентой на Главной, и клик по
       новости упирался в пустоту: экран нужен, материалы те же, что публикует
       федерация (Э1.8). */
    [<Newspaper size={18} />, 'Новости'],
    [<User size={18} />, 'Профиль'],
  ],
};
