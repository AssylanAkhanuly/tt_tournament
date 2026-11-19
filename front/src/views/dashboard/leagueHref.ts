/* Адреса Лиги в кабинете администратора. Дивизион стоит в календаре рядом с
   турнирами и открывается своей страницей `/dashboard/league/<id>/<раздел>`,
   как турнир — `/dashboard/tournaments/<id>/…`; тур — `/dashboard/league/tours/<id>`. */

export const LEAGUE_BASE = '/dashboard/league';

export const divisionHref = (id: string, section = 'table') => `${LEAGUE_BASE}/${id}/${section}`;
