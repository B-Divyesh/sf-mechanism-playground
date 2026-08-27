import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

function blueprintFile(part: Record<string, unknown>, name = 'blueprint.json') {
  return {
    name,
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({
      version: 1,
      updatedAt: '2026-08-27T00:00:00.000Z',
      parts: [part],
      activePuzzleId: null,
      completedPuzzleIds: []
    }))
  };
}

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

test('keeps Blueprint file import and export on the 390px keyboard path', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'This is an exact phone-width regression.');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  // The disabled Undo button is skipped, so the second tab stops at this
  // always-visible local-first escape hatch.
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const fileButton = page.getByRole('button', { name: 'Blueprint file' });
  await expect(fileButton).toBeFocused();
  await expect(fileButton).toBeVisible();
  await expect(fileButton).toHaveText('Blueprint file');
  await expect(fileButton).toHaveCSS('font-size', '12.8px');

  await page.keyboard.press('Enter');
  await expect(page.locator('#file-dialog')).toBeVisible();
  const exportButton = page.getByRole('button', { name: 'Export blueprint' });
  await expect(exportButton).toBeVisible();
  await expect(page.getByRole('button', { name: 'Import blueprint' })).toBeVisible();

  await exportButton.focus();
  const download = page.waitForEvent('download');
  await page.keyboard.press('Enter');
  await expect((await download).suggestedFilename()).toMatch(/^mechanism-blueprint-\d{4}-\d{2}-\d{2}\.json$/);
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

test('rejects a quote-containing imported ID before it can become SVG markup', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));
  await page.goto('/');
  await page.getByRole('button', { name: 'Blueprint file' }).click();
  await page.locator('#import-file').setInputFiles(blueprintFile({
    id: 'gear" onclick="document.body.dataset.qaExecuted=\'yes\'',
    type: 'gearSmall', x: 182, y: 248, rotation: 0
  }, 'quoted-id.json'));

  await expect(page.locator('#file-error')).toContainText('unsupported characters');
  await expect(page.locator('#file-dialog')).toBeVisible();
  await expect(page.locator('#parts-layer .mechanism-part')).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveAttribute('data-qa-executed', 'yes');
  expect(pageErrors).toEqual([]);
});

test('rejects an unknown imported type and leaves the current machine usable', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));
  await page.goto('/');
  await page.getByRole('button', { name: /Puzzle 1: First turn/ }).click();
  await expect(page.locator('#parts-layer .mechanism-part')).toHaveCount(2);
  await page.getByRole('button', { name: 'Blueprint file' }).click();
  await page.locator('#import-file').setInputFiles(blueprintFile({
    id: 'unknown-type-01', type: 'not-a-part', x: 182, y: 248, rotation: 0
  }, 'unknown-type.json'));

  await expect(page.locator('#file-error')).toContainText('unsupported part type');
  await expect(page.locator('#file-dialog')).toBeVisible();
  await expect(page.locator('#parts-layer .mechanism-part')).toHaveCount(2);
  await page.getByRole('button', { name: 'Close blueprint file options' }).click();
  await page.getByRole('button', { name: /Turn crank/ }).click();
  await expect(page.getByRole('button', { name: /Pause/ })).toBeVisible();
  expect(pageErrors).toEqual([]);
});
