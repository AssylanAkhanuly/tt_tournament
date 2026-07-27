import s from "./page.module.css";

export default function Home() {
  return (
    <main className={s.main}>
      <h1 className={s.title}>ФНТ РК</h1>
      <p className={s.subtitle}>
        Чистый каркас · Next.js · PostCSS + CSS Modules · Feature-Sliced Design
      </p>
    </main>
  );
}
