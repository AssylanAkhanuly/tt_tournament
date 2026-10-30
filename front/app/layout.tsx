import type { Metadata } from "next";
// Tailwind — собирается PostCSS при сборке (postcss.config.mjs), файла в репозитории нет.
// В нём же базовый сброс и палитра приложения (бывший `globals.css`).
import "@/shared/kit/tailwind.src.css";

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
    <html lang="ru" data-app="">
      <body>{children}</body>
    </html>
  );
}
