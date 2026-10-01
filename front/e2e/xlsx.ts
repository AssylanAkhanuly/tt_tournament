import { inflateRawSync } from 'node:zlib';

/* Чтение выгруженного файла Excel в сквозных проверках ✳ (01.10.2026).

   Проверка «файл скачался» проходит и на файле с чужим списком, поэтому файл
   открывается и читается по ячейкам. xlsx — это zip с XML внутри; ради одной
   колонки библиотеку не заводим: оглавление архива разбирается руками, сжатие
   снимает штатный `zlib`. */

/** Файл из архива — текстом. */
function entry(file: Buffer, name: string): string {
  // Конец оглавления ищется с хвоста: перед ним лежат сами файлы.
  const end = file.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (end < 0) throw new Error('Это не xlsx: оглавления архива нет');

  let at = file.readUInt32LE(end + 16);
  for (let i = file.readUInt16LE(end + 10); i > 0; i--) {
    const nameLength = file.readUInt16LE(at + 28);
    if (file.toString('utf8', at + 46, at + 46 + nameLength) === name) {
      const local = file.readUInt32LE(at + 42);
      const start = local + 30 + file.readUInt16LE(local + 26) + file.readUInt16LE(local + 28);
      const body = file.subarray(start, start + file.readUInt32LE(at + 20));
      // Способ 0 — файл лежит как есть, иначе — сжат deflate.
      return (file.readUInt16LE(at + 10) === 0 ? body : inflateRawSync(body)).toString('utf8');
    }
    at += 46 + nameLength + file.readUInt16LE(at + 30) + file.readUInt16LE(at + 32);
  }
  throw new Error('В архиве нет ' + name);
}

const text = (xml: string) =>
  xml.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

/** Значения колонки первого листа сверху вниз, вместе с заголовком; пустая
    ячейка — пустая строка. Сервер (openpyxl) пишет текст прямо в ячейку
    (`<is><t>…`), а не в общий список строк книги, число — в `<v>`. */
export function xlsxColumn(file: Buffer, column: string): string[] {
  const cell = new RegExp('<c r="' + column + '\\d+"(?:[^>]*/>|[^>]*>([\\s\\S]*?)</c>)');
  return [...entry(file, 'xl/worksheets/sheet1.xml').matchAll(/<row [^>]*>([\s\S]*?)<\/row>/g)].map(([, row]) =>
    text([...(row.match(cell)?.[1] ?? '').matchAll(/<[tv][^>]*>([^<]*)<\/[tv]>/g)].map((m) => m[1]).join('')),
  );
}
