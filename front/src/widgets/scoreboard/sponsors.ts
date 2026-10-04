// Партнёры в эфире — в том порядке, в каком идут в полосе. Новый партнёр —
// это строка здесь и файл в `public/sponsors/` (собирает
// `brand/sponsors/build.py` из присланного исходника); разметку не трогаем.

export type Sponsor = {
  /** Имя файла в `public/sponsors/` без расширения; оно же в `data-testid`. */
  id: string;
  name: string;
  /** Высота знака в единицах плашки. Оптическая, а не одинаковая: у знака с
   *  подписью в три строки и у одного слова при равной высоте разный вес. */
  height: number;
};

export const SPONSORS: readonly Sponsor[] = [
  { id: 'ministry', name: 'Министерство туризма и спорта Республики Казахстан', height: 78 },
  { id: 'fnt', name: 'Федерация настольного тенниса Республики Казахстан', height: 70 },
  { id: 'halyk', name: 'Halyk', height: 40 },
  { id: 'erg', name: 'ERG', height: 60 },
  { id: 'kazakhmys', name: 'Kazakhmys', height: 56 },
  { id: 'add-capital', name: 'ADD Capital', height: 54 },
  { id: 'allur', name: 'Allur', height: 32 },
];
