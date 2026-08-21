// Серверная часть: страницы забирают счёт напрямую из Django, минуя прокси,
// и отдают его уже в разметке. Плашка в OBS появляется с верным счётом сразу
// после перезапуска сцены, не дожидаясь первого опроса.

import { DEFAULT_STATE, type ScoreboardState } from './model';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchBoard(key: string): Promise<ScoreboardState> {
  try {
    const response = await fetch(`${BACKEND}/api/scoreboard/${encodeURIComponent(key)}/`, {
      cache: 'no-store',
    });
    if (!response.ok) return { ...DEFAULT_STATE, key };
    return (await response.json()) as ScoreboardState;
  } catch {
    // Бэкенд недоступен — страница всё равно должна открыться: оператор увидит
    // «нет связи», а в эфире будет пустая плашка вместо ошибки Next.
    return { ...DEFAULT_STATE, key };
  }
}
