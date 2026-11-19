/* Адреса Лиги в кабинете администратора. Сезон стоит в календаре рядом с
   турнирами и открывается своей страницей `/dashboard/league/seasons/<id>/<раздел>`
   («Лиги · Команды»), как турнир — `/dashboard/tournaments/<id>/…`; лига
   сезона — `/dashboard/league/<id>/<раздел>`, тур — `/dashboard/league/tours/<id>`. */

export const LEAGUE_BASE = '/dashboard/league';

export const seasonHref = (id: string, section = 'leagues') => `${LEAGUE_BASE}/seasons/${id}/${section}`;

export const divisionHref = (id: string, section = 'table') => `${LEAGUE_BASE}/${id}/${section}`;
