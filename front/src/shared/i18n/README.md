# i18n (мультиязычность)

Движок — **i18next + react-i18next** (RU/KK/EN), общий с приложением (Expo).
Ресурсы — JSON по локалям: `locales/{ru,kk,en}/<namespace>.json`.

Проводка (после `npm install` зависимостей i18next):
1. `config.ts` — инициализация i18next + `LanguageDetector` (`localStorage`/`navigator`).
2. Клиентский `Provider` (`I18nextProvider` или `initReactI18next`) в `app`-обёртке.
3. В компонентах: `const { t } = useTranslation(); t("app_title")`.

Ключи типобезопасны через TS-augmentation (`i18next.d.ts`, `resources`).
Контент CMS переводится отдельно (`wagtail-localize`), данные хранятся как введены
(см. ARCHITECTURE.md → «Мультиязычность», QUESTIONS 16.1).
