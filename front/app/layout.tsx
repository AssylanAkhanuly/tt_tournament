import type { Metadata } from "next";
import { Bebas_Neue, Inter, Oswald } from "next/font/google";
// Tailwind — собирается PostCSS при сборке (postcss.config.mjs), файла в репозитории нет.
// В нём же базовый сброс и палитра приложения (бывший `globals.css`).
import "@/shared/kit/tailwind.src.css";

// Inter — гарнитура брендбука QTT ✳ (17.11.2026). next/font кладёт файлы в
// сборку (запросов к Google у посетителя нет) и отдаёт имя семейства
// переменной `--font-inter`; её читает `--font` во входе Tailwind.
const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter", display: "swap" });
// Узкая «номерная» гарнитура — только для огромной цифры места в карточке
// состава сборной ✳ (22.11.2026): три цифры Inter не помещались в карточку.
const jersey = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-jersey", display: "swap" });
// Плакатная гарнитура сетки плей-офф ✳ (23.11.2026, как на лендинге Astana 2027):
// фамилии и счёт в `BracketPoster`; с кириллицей, в отличие от Bebas Neue.
const poster = Oswald({ subsets: ["latin", "cyrillic"], weight: ["500", "700"], variable: "--font-poster", display: "swap" });

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
    <html lang="ru" data-app="" className={inter.variable + " " + jersey.variable + " " + poster.variable}>
      <body>{children}</body>
    </html>
  );
}
