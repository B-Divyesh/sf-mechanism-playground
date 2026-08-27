import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('mechanism-playground:intro', 'seen'));
});

test('builds and persists a solved first mechanism', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Puzzle 1: First turn/ }).click();
  await page.getByRole('button', { name: /Small gear/ }).click();
  const board = page.locator('#board');
  const box = await board.boundingBox();
  if (!box) throw new Error('Board was not visible');
  await board.click({ position: { x: box.width * 182 / 800, y: box.height * 248 / 500 } });
  await expect(page.locator('#puzzle-status')).toContainText('Solved');
  await page.getByRole('button', { name: /Small gear, at/ }).focus();
  await page.keyboard.press('r');
  await expect(page.locator('#selection-info')).toContainText('45°');
  await page.getByRole('button', { name: 'Undo last change' }).click();
  await expect(page.locator('#puzzle-status')).toContainText('Solved');
  await page.waitForTimeout(300);
  await page.reload();
  await expect(page.locator('#puzzle-status')).toContainText('Solved');
});

test('has no serious accessibility violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  const results = await new AxeBuilder({ page }).disableRules(['aria-roledescription']).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('fits a 390px mobile viewport without page overflow', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client);
  await page.screenshot({ path: testInfo.outputPath('mobile.png'), fullPage: true });
});

test('reloads the full workshop offline after installation', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Mechanism Playground' })).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Mechanism Playground' })).toBeVisible();
  await page.evaluate(() => dispatchEvent(new Event('offline')));
  await expect(page.locator('#offline-banner')).toBeVisible();
});

test('rejects a quote-containing imported part ID without interpreting it as markup', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Blueprint file' }).click();
  await page.locator('#import-file').setInputFiles({
    name: 'hostile-id.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({
      version: 1,
      updatedAt: '2026-08-27T00:00:00.000Z',
      parts: [{
        id: 'gear\" onclick=\"document.body.dataset.qaExecuted=\"yes',
        type: 'gearSmall', x: 180, y: 248, rotation: 0
      }],
      activePuzzleId: null,
      completedPuzzleIds: []
    }))
  });
  await expect(page.locator('#file-error')).toContainText(/part ID contains unsupported characters/i);
  await expect(page.locator('body')).not.toHaveAttribute('data-qa-executed', 'yes');
  await expect(page.locator('[data-part-id]')).toHaveCount(0);
});

test('rejects unknown imported part types and lets the player recover with a valid blueprint', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Blueprint file' }).click();
  const input = page.locator('#import-file');
  await input.setInputFiles({
    name: 'unknown-part.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({
      version: 1,
      updatedAt: '2026-08-27T00:00:00.000Z',
      parts: [{ id: 'unknown-1', type: 'not-a-part', x: 180, y: 248, rotation: 0 }],
      activePuzzleId: null,
      completedPuzzleIds: []
    }))
  });
  await expect(page.locator('#file-error')).toContainText(/unsupported part type/i);
  await expect(page.locator('#file-dialog')).toBeVisible();
  await input.setInputFiles({
    name: 'valid-blueprint.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({
      version: 1,
      updatedAt: '2026-08-27T00:00:00.000Z',
      parts: [{ id: 'valid-gear-1', type: 'gearSmall', x: 180, y: 248, rotation: 0 }],
      activePuzzleId: null,
      completedPuzzleIds: []
    }))
  });
  await expect(page.locator('#file-dialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: /Small gear, at 180, 248/ })).toBeVisible();
});
