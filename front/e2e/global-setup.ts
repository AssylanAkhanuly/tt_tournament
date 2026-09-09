import { execFileSync } from 'node:child_process';
import path from 'node:path';

/* Показательный рейтинг перед прогоном сквозных проверок.

   Тесты рейтинга сверяют конкретные числа, а числа берутся из базы — значит
   база должна быть в известном состоянии. Команда `seed_rating_demo --reset`
   сносит прежний показательный набор, возвращает коэффициенты к значениям по
   умолчанию и считает рейтинг БОЕВЫМ расчётом: подставь мы числа руками,
   проверка перестала бы проверять расчёт.

   Дев-база при этом меняется — это её назначение.

   Путь считается от рабочей папки, а не через `import.meta`: Playwright грузит
   этот файл как CommonJS, и `import.meta` там — синтаксическая ошибка. */

const PYTHON = 'C:/apps/tt_back/venv/Scripts/python.exe';

export default function globalSetup() {
  execFileSync(PYTHON, ['manage.py', 'seed_rating_demo', '--reset'], {
    cwd: path.resolve(process.cwd(), '../back'),
    stdio: 'inherit',
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
  });
}
