import type { Metadata } from "next";
import { Inter } from "next/font/google";
// Tailwind — собирается PostCSS при сборке (postcss.config.mjs), файла в репозитории нет.
// В нём же базовый сброс и палитра приложения (бывший `globals.css`).
import "@/shared/kit/tailwind.src.css";

// Inter — гарнитура брендбука QTT ✳ (17.11.2026). next/font кладёт файлы в
// сборку (запросов к Google у посетителя нет) и отдаёт имя семейства
// переменной `--font-inter`; её читает `--font` во входе Tailwind.
const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "ФНТ РК",
  description: "Платформа турниров Федерации настольного тенниса Республики Казахстан",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // `data-app` — к нему привязаны сброс и палитра в `tailwind.src.css`: тот
    // же файл грузит Storybook, и там они действовать не должны.
    <html lang="ru" data-app="" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
