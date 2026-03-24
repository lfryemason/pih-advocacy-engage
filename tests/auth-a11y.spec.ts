import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const authPages = [
  { name: 'login', path: '/auth/login' },
  { name: 'sign up', path: '/auth/sign-up' },
  { name: 'forgot password', path: '/auth/forgot-password' },
];

for (const { name, path } of authPages) {
  test(`${name} page has no accessibility violations`, async ({ page }) => {
    await page.goto(path);

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });
}
