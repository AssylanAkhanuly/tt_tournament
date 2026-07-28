# E2E мобилки — Maestro

Сквозная проверка приложения на **Android-эмуляторе** (правило из корневого
`CLAUDE.md` → «E2E-проверка»). Флоу — `setka.yaml`.

## Важное ограничение
Сетка (имена/счёт/линии) рисуется на **Skia-канвасе** и **не попадает в
accessibility-дерево** — по тексту её не найти. Maestro проверяет **RN-обвязку**
(шапка, кнопки зума ＋/1:1/−) и **жесты**, а Skia-контент фиксируем `takeScreenshot`.

## Предпосылки
- Установлен Maestro (`maestro --version`), нужен **Java 17+**.
- Android SDK + запущенный эмулятор (`emulator -avd <avd>`).
- Установлен **dev-build** приложения: `npx expo run:android` (Skia/жесты в
  Expo Go не работают).
- Запущен **Metro** на `8081`: `npx expo start --dev-client` + проброс порта
  на устройство: `adb reverse tcp:8081 tcp:8081`.

## Запуск
```bash
export JAVA_HOME=<путь к JDK 17>
adb reverse tcp:8081 tcp:8081
maestro test e2e/setka.yaml
```
Флоу грузит экран через deep link на Metro (`ttt://…?url=http://localhost:8081`).
Для **standalone**-сборки (JS зашит в APK, без Metro) замените первый шаг
`openLink` на `launchApp`.

## Что проверяет `setka.yaml`
1. экран монтируется (RN-шапка «Чемпионат Казахстана 2026»);
2. кнопки зума присутствуют (`1:1`);
3. интерактив: зум `+` и сброс `1:1`;
4. панорама — свайп;
5. скриншот `setka` (визуальная фиксация Skia-сетки).
