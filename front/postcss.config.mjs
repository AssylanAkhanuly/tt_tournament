// Tailwind собирается внутри `next dev` / `next build` ✳ (28.10.2026): готового
// CSS в репозитории нет. Вход — `src/shared/kit/tailwind.src.css`, его
// подключает `app/layout.tsx`.
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
