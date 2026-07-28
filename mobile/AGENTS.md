# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Проверка (обязательно перед «готово»)

Каждую фичу проверяем **на Android-эмуляторе e2e**: поднимаем dev-build
(`npx expo run:android`), гоняем сценарий вживую (запуск, экран, жесты), снимаем
скриншот (`adb exec-out screencap -p`). Skia/жесты в Expo Go не работают — нужен
именно dev-build. См. корневой `CLAUDE.md` -> "E2E-проверка" и `TESTING.md`.
