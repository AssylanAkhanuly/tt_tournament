import { execFileSync } from 'node:child_process';
import path from 'node:path';

/* Известное состояние базы перед прогоном сквозных проверок.

   1. Показательный рейтинг. Тесты рейтинга сверяют конкретные числа, а числа
      берутся из базы. Команда `seed_rating_demo --reset` сносит прежний
      показательный набор, возвращает коэффициенты к значениям по умолчанию и
      считает рейтинг БОЕВЫМ расчётом: подставь мы числа руками, проверка
      перестала бы проверять расчёт.
   2. Учётки председателя ГСК и администратора федерации для проверок входа. Своя, отдельная от
      той, которой пользуются руками: тесты не должны зависеть от чужого пароля.
      Команда идемпотентна — роль выдаётся, пароль переставляется.

   Дев-база при этом меняется — это её назначение.

   Путь считается от рабочей папки, а не через `import.meta`: Playwright грузит
   этот файл как CommonJS, и `import.meta` там — синтаксическая ошибка. */

const PYTHON = 'C:/apps/tt_back/venv/Scripts/python.exe';

/** Учётка председателя для сквозных проверок — та же, что в `login.spec.ts`. */
export const E2E_GSK = { email: 'e2e-gsk@fnt.kz', password: 'E2e-Gsk-2026' };

/** Спортсмен и судья ✳ (28.10.2026) — кабинеты пока пустые, `workspaces.spec.ts`. */
export const E2E_PLAYER = { email: 'e2e-player@fnt.kz', password: 'E2e-Player-2026' };
export const E2E_REFEREE = { email: 'e2e-referee@fnt.kz', password: 'E2e-Referee-2026' };

/** Учётка администратора федерации — для `dashboard.spec.ts`. */
export const E2E_ADMIN = { email: 'e2e-admin@fnt.kz', password: 'E2e-Admin-2026' };

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
  manage(
    'create_federation_admin',
    '--email', E2E_ADMIN.email,
    '--name', 'Администратор федерации (проверки)',
    '--password', E2E_ADMIN.password,
  );
  // Вторая роль той же учётки — чтобы проверить переключение ролей в меню
  // человека (`dashboard.spec.ts`). Пароль не передаём: он уже задан выше.
  manage('create_gsk_chairman', '--email', E2E_ADMIN.email, '--name', 'Администратор федерации (проверки)');
  // И судья ✳ (30.10.2026): у живой учётки администратора ролей несколько, и в
  // кабинете судьи она обязана видеть турнир как судья (`workspaces.spec.ts`).
  manage('create_referee', '--email', E2E_ADMIN.email, '--name', 'Администратор федерации (проверки)');
  manage('create_player', '--email', E2E_PLAYER.email, '--name', 'Спортсмен (проверки)', '--password', E2E_PLAYER.password);
  manage('create_referee', '--email', E2E_REFEREE.email, '--name', 'Судья (проверки)', '--password', E2E_REFEREE.password);
  // Судья «проверки» назначен на демо-чемпионат — роль с областью «турнир»
  // (`dashboard.spec.ts`, раздел «Судьи»). Назначения на экране пока нет.
  manage(
    'shell',
    '-c',
    [
      'from tournaments.models import Tournament',
      'from users.models import Role, User',
      "t = Tournament.objects.get(name='[demo] Чемпионат Республики Казахстан')",
      `u = User.objects.get(email='${E2E_REFEREE.email}')`,
      "Role.objects.get_or_create(user=u, kind=Role.KIND_REFEREE, scope='tournament', scope_id=t.id)",
    ].join('; '),
  );
}
