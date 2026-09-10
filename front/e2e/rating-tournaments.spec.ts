import { expect, test, type Page } from '@playwright/test';

import { E2E_GSK } from './global-setup';

/* Заведение председателем ГСК ✳ (11.09.2026): спортсмен в рейтинге и турнир
   протоколом вручную — участники, матч, утверждение, возврат на доработку.

   Всё заведённое помечено «[e2e] » и сносится засевом в `global-setup`.
   Метка времени в именах — чтобы повторный прогон без засева не упёрся в
   прежние строки.

   Числа конкретные. Коэффициенты по умолчанию (засев их сбрасывает): K = 0,60,
   у областных C = 0,80; у равных соперников E = 0,50. Победитель получает
   0,60 × 0,80 × 0,50 = 0,24. */

const метка = () => String(Date.now()).slice(-6);

async function войти(page: Page, next: string) {
  await page.goto('/login?next=' + encodeURIComponent(next));
  await page.getByLabel('Эл. почта').fill(E2E_GSK.email);
  await page.getByLabel('Пароль').fill(E2E_GSK.password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL((url) => url.pathname === next);
}

async function новыйСпортсмен(page: Page, имя: string, прежний: string) {
  await page.getByLabel('Фамилия и имя').fill(имя);
  await page.getByLabel('Старт', { exact: true }).selectOption('legacy');
  await page.getByLabel('Прежний рейтинг').fill(прежний);
  await page.getByTestId('athlete-submit').click();
}

test('председатель заводит спортсмена с переносом прежнего рейтинга', async ({ page }) => {
  const имя = '[e2e] Жаксылыков Ерлан ' + метка();
  await войти(page, '/rating');

  await page.getByTestId('athlete-open').click();
  await expect(page.getByTestId('athlete-submit')).toBeDisabled();
  await page.getByLabel('Регион', { exact: true }).fill('Павлодар');
  await новыйСпортсмен(page, имя, '33,5');

  // Сразу открывается его карточка: старт — ровно перенесённое значение.
  await page.waitForURL(/\/rating\/[0-9a-f-]{36}$/);
  await expect(page.locator('h1')).toHaveText(имя);
  await expect(page.getByText('Текущий рейтинг').locator('..')).toContainText('33,50');
});

test('председатель заводит турнир, вносит участников и матч, утверждает и возвращает на доработку', async ({
  page,
}) => {
  const м = метка();
  const турнир = '[e2e] Кубок проверки ' + м;
  const а = '[e2e] Алиев Тимур ' + м;
  const б = '[e2e] Бекенов Азат ' + м;

  await войти(page, '/rating/tournaments');
  await page.getByTestId('tournament-create-open').click();
  await page.getByLabel('Название').fill(турнир);
  await page.getByLabel('Уровень', { exact: true }).selectOption('region');
  await page.getByTestId('tournament-submit').click();

  await page.waitForURL(/\/rating\/tournaments\/[^/]+$/);
  await expect(page.locator('h1')).toHaveText(турнир);
  await expect(page.getByTestId('protocol-state')).toHaveText('черновик');
  // Пустой протокол не утвердить.
  await expect(page.getByTestId('protocol-save')).toBeDisabled();

  for (const имя of [а, б]) {
    await page.getByTestId('participant-new').click();
    await новыйСпортсмен(page, имя, '20');
    await expect(page.locator('[data-testid="protocol-participant"][data-player="' + имя + '"]')).toBeVisible();
  }

  await page.getByTestId('match-add').click();
  await page.getByLabel('Спортсмен', { exact: true }).selectOption({ label: а });
  await page.getByLabel('Соперник', { exact: true }).selectOption({ label: б });
  await page.getByLabel('Партии спортсмена').fill('3');
  await page.getByLabel('Партии соперника').fill('1');
  await page.getByTestId('match-submit').click();

  const строкаА = page.locator('[data-testid="protocol-participant"][data-player="' + а + '"]');
  await expect(page.getByTestId('protocol-match')).toHaveCount(1);
  await expect(page.getByTestId('protocol-match')).toContainText('3:1');
  // Предпросмотр черновика: изменение видно до утверждения.
  await expect(строкаА).toContainText('20,24');

  await page.getByTestId('protocol-save').click();
  await expect(page.getByTestId('protocol-result')).toHaveText('Утверждён и учтён в рейтинге');
  await expect(page.getByTestId('protocol-state')).toHaveText('учтён в рейтинге');
  await expect(строкаА).toContainText('20,24');
  // Учтённый протокол закрыт для правок.
  await expect(page.getByTestId('match-add')).toHaveCount(0);

  // В списке турниров — учтён.
  await page.goto('/rating/tournaments');
  await expect(page.locator('[data-testid="tournament-row"][data-tournament="' + турнир + '"]')).toContainText('да');
  await page.locator('[data-testid="tournament-row"][data-tournament="' + турнир + '"]').click();

  await page.getByTestId('protocol-rework').click();
  await expect(page.getByTestId('protocol-state')).toHaveText('черновик');
  await expect(page.getByTestId('match-add')).toBeVisible();
});

test('участник из рейтинга: список виден сразу, ввод сужает, добавленный из выдачи уходит', async ({ page }) => {
  await войти(page, '/rating/tournaments');
  await page.getByTestId('tournament-create-open').click();
  await page.getByLabel('Название').fill('[e2e] Состав из листа ' + метка());
  await page.getByTestId('tournament-submit').click();
  await page.waitForURL(/\/rating\/tournaments\/[^/]+$/);

  await page.getByTestId('participant-add').click();
  // До ввода — лист по убыванию: первым самый высокий рейтинг засева.
  await expect(page.getByTestId('participant-candidate').first()).toHaveAttribute('data-player', 'Ахметов Ерлан');

  await page.getByPlaceholder('Фамилия или регион').last().fill('Ким Виктор');
  await page.locator('[data-testid="participant-candidate"][data-player="Ким Виктор"]').click();
  await expect(page.locator('[data-testid="protocol-participant"][data-player="Ким Виктор"]')).toBeVisible();

  // Уже в турнире — в выдаче его больше нет.
  await page.getByPlaceholder('Фамилия или регион').last().fill('Ким Виктор');
  await expect(page.getByTestId('participant-none')).toBeVisible();
  await expect(page.locator('[data-testid="participant-candidate"][data-player="Ким Виктор"]')).toHaveCount(0);
});
