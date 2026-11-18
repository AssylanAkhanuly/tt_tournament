import { expect, test, type Page } from '@playwright/test';

import { E2E_ADMIN, E2E_COACH } from './global-setup';

/* Аккаунты устройства ✳ (19.11.2026, решение владельца продукта: «сессия на 30
   дней», переход между сохранёнными аккаунтами без пароля).

   Каждый вход оставляет на устройстве сессию аккаунта на 30 дней в
   httpOnly-куке; карточка аккаунта на странице входа переводит в него без
   пароля, «Другой аккаунт» добавляет ещё один, не закрывая текущий, «Выйти»
   забывает текущий — вернуться в него можно только паролем. */

async function signInWithForm(page: Page, who: { email: string; password: string }) {
  await page.getByLabel('Эл. почта').fill(who.email);
  await page.getByLabel('Пароль').fill(who.password);
  await page.getByRole('button', { name: 'Войти' }).click();
}

const accountCard = (page: Page, email: string) => page.getByRole('button', { name: new RegExp(email) });

test('два аккаунта на устройстве: переход карточкой без пароля, «Выйти» забывает текущий', async ({ page }) => {
  await page.goto('/login');
  await signInWithForm(page, E2E_ADMIN);
  await page.waitForURL((url) => url.pathname === '/dashboard');

  // «Другой аккаунт» — форма поверх открытой сессии, администратор не выходит.
  await page.goto('/login');
  await expect(page.getByTestId('already-in')).toBeVisible();
  await page.getByTestId('login-add-account').click();
  await signInWithForm(page, E2E_COACH);
  await page.waitForURL((url) => url.pathname === '/coach');

  // Назад к администратору — карточкой, пароль не спрашивается.
  await page.goto('/login');
  await page.screenshot({ path: 'test-results/accounts/two-accounts.png' });
  await accountCard(page, E2E_ADMIN.email).click();
  await page.waitForURL((url) => url.pathname === '/dashboard');
  await expect(page.getByLabel('Пароль')).toHaveCount(0);

  // И снова к тренеру.
  await page.goto('/login');
  await accountCard(page, E2E_COACH.email).click();
  await page.waitForURL((url) => url.pathname === '/coach');

  // «Выйти» забывает тренера на устройстве: его карточка теперь просит пароль.
  await page.goto('/login');
  await page.getByRole('button', { name: 'Выйти' }).click();
  await expect(page.getByLabel('Пароль')).toBeVisible();
  await accountCard(page, E2E_COACH.email).click();
  await expect(page.getByLabel('Эл. почта')).toHaveValue(E2E_COACH.email);
  await expect(page).toHaveURL(/\/login/);

  // Администратор остался на устройстве — его карточка пускает без пароля.
  await accountCard(page, E2E_ADMIN.email).click();
  await page.waitForURL((url) => url.pathname === '/dashboard');
});
