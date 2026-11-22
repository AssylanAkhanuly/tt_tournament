import { expect, test, type APIRequestContext } from '@playwright/test';

import { E2E_ADMIN, E2E_PLAYER, E2E_REFEREE } from './global-setup';

/* Врач соревнований ✳ (22.11.2026, ROLES.md роль 18; flows/18; главная схема
   `flow-tournaments`: «Врач допустил по справке?»).

   Администратор (своя API-сессия) заводит турнир, вносит двух участников и
   назначает учётку судьи проверок врачом соревнований. Врач входит, открывает
   «Допуск участников» в кабинете `/medic`, одного допускает, второго — нет, с
   причиной; без причины «Не допустить» не нажимается. Турнир — «[e2e] », его
   сносит засев в global-setup. */

async function adminApi(request: APIRequestContext) {
  const r = await request.post('/api/auth/login/email/', { data: E2E_ADMIN });
  expect(r.status(), await r.text()).toBe(200);
}

async function candidate(request: APIRequestContext, id: string, role: 'player' | 'referee', q: string) {
  const list = (await (await request.get(`/api/tournaments/${id}/candidates/?role=${role}&q=${encodeURIComponent(q)}`)).json()) as { id: string }[];
  expect(list.length, q).toBeGreaterThan(0);
  return list[0].id;
}

test('врач соревнований: допуск участников по справке', async ({ page, request }) => {
  await adminApi(request);
  const name = `[e2e] Допуск врача ${Date.now()}`;
  const r = await request.post('/api/tournaments/', { data: { name, starts_at: new Date().toISOString(), format: 'single_elimination' } });
  expect(r.status(), await r.text()).toBe(201);
  const id = ((await r.json()) as { id: string }).id;
  // участники: учётка спортсмена проверок и администратор (любые две учётки)
  for (const q of [E2E_PLAYER.email, E2E_ADMIN.email]) {
    const uid = await candidate(request, id, 'player', q);
    expect((await request.post(`/api/tournaments/${id}/participants/`, { data: { user_id: uid } })).status()).toBe(201);
  }
  const doctorId = await candidate(request, id, 'referee', E2E_REFEREE.email);
  const add = await request.post(`/api/tournaments/${id}/referees/`, { data: { user_id: doctorId, position: 'competition_doctor' } });
  expect(add.status(), await add.text()).toBe(201);

  await page.goto('/login');
  await page.getByLabel('Эл. почта').fill(E2E_REFEREE.email);
  await page.getByLabel('Пароль').fill(E2E_REFEREE.password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL((u) => u.pathname === '/referee');

  await page.goto(`/medic/tournaments/${id}`);
  await expect(page.getByTestId('page-title')).toContainText('Допуск участников');
  const rows = page.getByTestId('medical-row');
  await expect(rows).toHaveCount(2);
  const first = rows.nth(0);
  const second = rows.nth(1);
  await expect(first.getByTestId('medical-status')).toHaveAttribute('data-status', '');

  await first.getByTestId('medical-admit').click();
  await expect(first.getByTestId('medical-status')).toHaveAttribute('data-status', 'admitted');
  await expect(first).toContainText('Судья (проверки)');

  await second.getByTestId('medical-deny').click();
  const dialog = page.getByTestId('medical-deny-dialog');
  await expect(dialog.getByTestId('medical-deny-submit')).toBeDisabled();
  await dialog.getByTestId('medical-note').fill('Нет справки о допуске');
  await dialog.getByTestId('medical-deny-submit').click();
  await expect(dialog).toHaveCount(0);
  await expect(second.getByTestId('medical-status')).toHaveAttribute('data-status', 'denied');
  await page.screenshot({ path: 'test-results/medic/admission.png' });

  // решение видно и с сервера
  const data = (await (await request.get(`/api/tournaments/${id}/medical/`)).json()) as { participants: { status: string; note: string }[] };
  expect(data.participants.map((p) => p.status).sort()).toEqual(['admitted', 'denied']);
  expect(data.participants.find((p) => p.status === 'denied')!.note).toBe('Нет справки о допуске');
});
