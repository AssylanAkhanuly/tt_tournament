import { execFileSync } from 'node:child_process';
import path from 'node:path';

/* Известное состояние базы перед прогоном сквозных проверок.

   1. Показательный рейтинг. Тесты рейтинга сверяют конкретные числа, а числа
      берутся из базы. Команда `seed_rating_demo --reset` сносит прежний
      показательный набор, возвращает коэффициенты к значениям по умолчанию и
      считает рейтинг БОЕВЫМ расчётом: подставь мы числа руками, проверка
      перестала бы проверять расчёт.
   2. Учётка председателя ГСК для проверок входа и правок. Своя, отдельная от
      той, которой пользуются руками: тесты не должны зависеть от чужого пароля.
      Команда идемпотентна — роль выдаётся, пароль переставляется.

   Дев-база при этом меняется — это её назначение.

   Путь считается от рабочей папки, а не через `import.meta`: Playwright грузит
   этот файл как CommonJS, и `import.meta` там — синтаксическая ошибка. */

const PYTHON = 'C:/apps/tt_back/venv/Scripts/python.exe';

/** Учётка председателя для сквозных проверок — та же, что в `login.spec.ts`. */
export const E2E_GSK = { email: 'e2e-gsk@fnt.kz', password: 'E2e-Gsk-2026' };

function manage(...args: string[]) {
  execFileSync(PYTHON, ['manage.py', ...args], {
    cwd: path.resolve(process.cwd(), '../back'),
    stdio: 'inherit',
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
  });
}

export default function globalSetup() {
  manage('seed_rating_demo', '--reset');
  manage(
    'create_gsk_chairman',
    '--email', E2E_GSK.email,
    '--name', 'Председатель ГСК (проверки)',
    '--password', E2E_GSK.password,
  );
}
