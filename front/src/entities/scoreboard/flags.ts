// Код страны → код флага для картинки.
// Оператор пишет привычный трёхбуквенный код ITTF ('KAZ', 'JPN'), а картинке
// флага нужен двухбуквенный ISO 3166-1 alpha-2. Список — страны, которые
// реально встречаются в настольном теннисе; чего нет — вернём null, тогда
// вместо флага показываем сам код (плашка не ломается).

const ALPHA3_TO_ALPHA2: Record<string, string> = {
  KAZ: 'kz', RUS: 'ru', UZB: 'uz', KGZ: 'kg', TJK: 'tj', TKM: 'tm', BLR: 'by', UKR: 'ua',
  JPN: 'jp', CHN: 'cn', KOR: 'kr', PRK: 'kp', TPE: 'tw', HKG: 'hk', SGP: 'sg', IND: 'in',
  THA: 'th', VIE: 'vn', MAS: 'my', INA: 'id', IRI: 'ir', QAT: 'qa', KSA: 'sa', UAE: 'ae',
  GER: 'de', FRA: 'fr', SWE: 'se', AUT: 'at', POL: 'pl', POR: 'pt', ESP: 'es', ITA: 'it',
  ENG: 'gb-eng', GBR: 'gb', NED: 'nl', BEL: 'be', DEN: 'dk', NOR: 'no', FIN: 'fi',
  CZE: 'cz', SVK: 'sk', HUN: 'hu', ROU: 'ro', SRB: 'rs', CRO: 'hr', SLO: 'si', GRE: 'gr',
  BUL: 'bg', SUI: 'ch', LUX: 'lu', MDA: 'md', LTU: 'lt', LAT: 'lv', EST: 'ee',
  USA: 'us', CAN: 'ca', BRA: 'br', ARG: 'ar', CHI: 'cl', PUR: 'pr', DOM: 'do', MEX: 'mx',
  EGY: 'eg', NGR: 'ng', TUN: 'tn', ALG: 'dz', RSA: 'za', TUR: 'tr', AUS: 'au', NZL: 'nz',
};

/** Код для картинки флага; null — если код не распознан. */
export function flagCode(country: string): string | null {
  const code = country.trim().toUpperCase();
  if (code.length === 2) return code.toLowerCase();
  return ALPHA3_TO_ALPHA2[code] ?? null;
}

/** URL картинки флага (внешняя CDN; если недоступна — компонент покажет код). */
export function flagUrl(country: string): string | null {
  const code = flagCode(country);
  return code ? `https://flagcdn.com/w80/${code}.png` : null;
}
