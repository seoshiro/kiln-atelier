import { expect, test } from '@playwright/test';

test('export buttons keep stable names, focus and immediate repeated downloads under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  const svg = page.getByRole('button', { name: 'Download SVG card', exact: true });
  await svg.scrollIntoViewIfNeeded();
  await svg.hover();
  await expect(svg.locator('.slide-text-track')).toHaveCSS('transform', 'none');
  for (const name of ['Download SVG card', 'Download JSON', 'Download SVG card']) {
    const button = page.getByRole('button', { name, exact: true });
    await button.focus();
    const download = page.waitForEvent('download');
    await button.press('Enter');
    expect((await download).suggestedFilename()).toMatch(name === 'Download JSON' ? /\.json$/ : /\.svg$/);
    await expect(button).toBeFocused();
    await expect(button).toHaveAccessibleName(name);
    await expect(button.locator('.slide-text-track')).toHaveCSS('transform', 'none');
  }
  await expect(page.locator('.atelier-status')).toContainText('SVG download prepared');
});
