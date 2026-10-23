// Smoke — the whole stack boots and the key pages actually render.
//
// Every test fails on ANY console.error or uncaught page error; the only
// exemption is the known-external map-tile hosts (OpenStreetMap rate-limits
// heavy clients with 429s, which is not an application failure).
//
// Headings are admin-editable content (page_content), so assertions check the
// *landmark* — a visible, non-empty h1 — rather than frozen copy that an
// editor could legitimately change.

const path = require('path');
const { test, expect } = require('@playwright/test');

require('dotenv').config({ path: path.join(__dirname, '..', '..', 'backend', '.env') });

// Same precedence as authService itself: env override wins, else seeded admin.
const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'DayTripGO@2026';

const IGNORABLE = /tile\.openstreetmap\.(org|fr|de)/;

function trackErrors(page) {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const from = msg.location() ? msg.location().url : '';
    if (IGNORABLE.test(from) || IGNORABLE.test(msg.text())) return;
    errors.push(`console.error: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

const expectCleanConsole = (errors) =>
  expect(errors, 'the browser console must stay clean').toEqual([]);

test('API health answers through the frontend origin (proxy live)', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.status()).toBe(200);
  expect((await res.json()).status).toBe('OK');
});

test('home page renders the hero inside the public shell', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await expect(page).toHaveTitle(/DayTripGO/);
  const hero = page.getByRole('heading', { level: 1 });
  await expect(hero).toBeVisible();
  await expect(hero).not.toHaveText('');
  await expect(page.locator('footer')).toBeVisible();
  expectCleanConsole(errors);
});

test('explore page loads the place grid from the API', async ({ page }) => {
  const errors = trackErrors(page);
  const placesLoaded = page.waitForResponse(
    (res) => res.url().includes('/api/places') && res.status() === 200
  );
  await page.goto('/explore');
  await placesLoaded;
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expectCleanConsole(errors);
});

test('visit plan page renders its planner shell', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/visit-plan');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expectCleanConsole(errors);
});

test('contact page renders the enquiry form', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/contact');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('input[autocomplete="name"]')).toBeVisible();
  await expect(page.locator('input[autocomplete="email"]')).toBeVisible();
  expectCleanConsole(errors);
});

test('business registration collects the account only (step 1 of 2)', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/business/register');
  await expect(page.locator('#username')).toBeVisible();
  await expect(page.locator('#password')).toBeVisible();
  // The listing itself — business name, contact details, photos — is step 2
  // and lives on a separate screen behind the account form.
  await expect(page.locator('#business_name')).toHaveCount(0);
  await expect(page.getByText('2 · Your listing', { exact: true })).toBeVisible();
  expectCleanConsole(errors);
});

test('explore lists businesses behind the Businesses tab', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/explore');
  const businessesLoaded = page.waitForResponse(
    (res) => res.url().includes('/api/businesses') && res.status() === 200
  );
  await page.getByRole('tab', { name: 'Businesses' }).click();
  await businessesLoaded;
  await expect(page.getByRole('tab', { name: 'Businesses' })).toHaveAttribute('aria-selected', 'true');
  expectCleanConsole(errors);
});

test('/admin redirects to the login screen', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.locator('#username')).toBeVisible();
  await expect(page.locator('#password')).toBeVisible();
  expectCleanConsole(errors);
});

test('admin logs in and the protected dashboard renders', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/admin/login');
  await page.locator('#username').fill(ADMIN_USER);
  await page.locator('#password').fill(ADMIN_PASS);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/\/admin\/dashboard/);
  await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
  // Scoped to the sidebar: the dashboard also renders a quick-link card with
  // the same label, which would trip Playwright's strict-mode check.
  await expect(
    page.locator('#admin-sidebar').getByRole('link', { name: 'Attractive Places', exact: true })
  ).toBeVisible();
  expectCleanConsole(errors);
});
