/* Протокол турнира — файлом PDF ✳ (30.10.2026, решение владельца продукта):
   кнопка в углу документа. Документ на экране и в файле один и тот же: браузер
   рисует его картинкой (`html-to-image` — тем же движком, что показывает
   страницу, поэтому кириллица и шрифты совпадают), `jspdf` раскладывает её по
   листам A4 с полями. Текст в файле — картинка, не выделяется: для проекта
   протокола этого достаточно, а сборка на сервере потребовала бы своего
   шрифта с кириллицей и второй вёрстки документа. Библиотеки грузятся только
   по нажатию — в сборку страницы они не входят. */

const PAGE = { w: 210, h: 297, margin: 10 }; // мм, A4 — поля наши

/** Имя файла: «Протокол — <название>.pdf», без символов, запрещённых в именах. */
export const protocolFileName = (name: string) =>
  'Протокол — ' + (name.trim() || 'турнир').replace(/[\\/:*?"<>|]+/g, ' ').slice(0, 120) + '.pdf';

/** Сохранить документ файлом. Узлы с `data-export-skip` (кнопки) в файл не идут. */
export async function downloadProtocolPdf(node: HTMLElement, fileName: string) {
  const [{ toPng }, { jsPDF }] = await Promise.all([import('html-to-image'), import('jspdf')]);
  const png = await toPng(node, {
    pixelRatio: 2,
    backgroundColor: '#ffffff', // фон листа; токены на холсте не читаются
    filter: (n) => !(n instanceof HTMLElement && n.dataset.exportSkip !== undefined),
  });

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const usable = PAGE.h - PAGE.margin * 2;
  let width = PAGE.w - PAGE.margin * 2;
  let height = (node.offsetHeight / node.offsetWidth) * width;
  // Чуть длиннее листа — ужимаем на один лист: протокол на полтора листа хуже,
  // чем на одном чуть мельче. Предел ужатия (×1,3) — наш.
  if (height > usable && height <= usable * 1.3) {
    width *= usable / height;
    height = usable;
  }
  const left = (PAGE.w - width) / 2;
  // Длинный документ — на несколько листов: та же картинка, сдвинутая на лист вверх.
  for (let top = 0, page = 0; top < height - 0.5; top += usable, page++) {
    if (page > 0) pdf.addPage();
    pdf.addImage(png, 'PNG', left, PAGE.margin - top, width, height);
    // Поля сверху и снизу — белым поверх соседних кусков картинки.
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, PAGE.w, PAGE.margin, 'F');
    pdf.rect(0, PAGE.h - PAGE.margin, PAGE.w, PAGE.margin, 'F');
  }
  pdf.save(fileName);
}
