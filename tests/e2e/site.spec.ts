import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const screenshotDir = join('QA', 'screenshots');
const prefix = process.env.QA_PREFIX || 'local';

async function ready(page: Page) {
  await page.goto('./');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('h1')).toBeVisible();
}

async function atelier(page: Page) {
  // Select the loaded component, not the temporary Suspense section with the same id.
  const section = page.locator('#atelier.atelier');
  await expect(section).toBeAttached();
  await section.scrollIntoViewIfNeeded();
  await expect(section).toBeVisible();
  await expect(section.locator('.vessel-viewer')).toHaveAttribute('data-viewer', /webgl|fallback/);
  return section;
}

async function saveShot(page: Page, name: string, fullPage = true) {
  await mkdir(screenshotDir, { recursive: true });
  await page.screenshot({ path: join(screenshotDir, `${prefix}-${name}.png`), fullPage, animations: 'disabled' });
}

test('page story renders, navigation works, and all local resources load', async ({ page }) => {
  const errors: string[] = [];
  const badResponses: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`); });
  await ready(page);
  await expect(page).toHaveTitle(/KILN/);
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveCount(1);
  const sections = await page.locator('section').count();
  expect(sections).toBeGreaterThanOrEqual(5);
  expect(sections).toBeLessThanOrEqual(7);
  await saveShot(page, 'desktop-hero', false);
  const atelierLink = page.locator('a[href="#atelier"]').first();
  await atelierLink.click();
  await expect(page).toHaveURL(/#atelier$/);
  await atelier(page);
  await saveShot(page, 'desktop-atelier', false);
  await expect(page.locator('body')).not.toContainText(/add to cart|checkout|buy now/i);
  expect(errors).toEqual([]);
  expect(badResponses).toEqual([]);
});

for (const viewport of [
  { width: 320, height: 760 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 1000 },
  { width: 844, height: 390 },
]) {
  test(`responsive and accessible at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await ready(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await atelier(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await saveShot(page, `${viewport.width}x${viewport.height}`);
    if (viewport.width === 390) {
      await saveShot(page, 'mobile-hero', false);
      await page.locator('.atelier-preview').screenshot({ path: join(screenshotDir, `${prefix}-mobile-atelier.png`), animations: 'disabled' });
      await page.locator('.atelier-controls').screenshot({ path: join(screenshotDir, `${prefix}-mobile-controls.png`), animations: 'disabled' });
    }
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(results.violations).toEqual([]);
  });
}

test('keyboard can enter atelier and adjust a bounded shape slider', async ({ page }) => {
  await ready(page);
  await page.keyboard.press('Tab');
  const firstFocus = await page.locator(':focus').getAttribute('href');
  expect(firstFocus).toBe('#main');
  await page.keyboard.press('Enter');
  await atelier(page);
  const slider = page.getByRole('slider', { name: /height/i });
  await slider.focus();
  await expect(slider).toBeFocused();
  const before = Number(await slider.inputValue());
  await page.keyboard.press('ArrowRight');
  expect(Number(await slider.inputValue())).toBeGreaterThan(before);
  await page.keyboard.press('End');
  expect(await slider.inputValue()).toBe(await slider.getAttribute('max'));
  await page.keyboard.press('Home');
  expect(await slider.inputValue()).toBe(await slider.getAttribute('min'));
  const focusStyle = await slider.evaluate(el => getComputedStyle(el).outlineStyle);
  expect(focusStyle).not.toBe('none');
});

test('reduced motion still presents the full working experience', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page);
  await atelier(page);
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  const activeAnimations = await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length);
  expect(activeAnimations).toBe(0);
});

test('WebGL unavailable leaves a usable visual and export controls', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (/webgl/i.test(type)) return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  await ready(page);
  const section = await atelier(page);
  await expect(section.locator('.vessel-viewer')).toHaveAttribute('data-viewer', 'fallback');
  await expect(section.locator('svg').first()).toBeVisible();
  await expect(page.getByRole('slider', { name: /height/i })).toBeEnabled();
  await saveShot(page, 'webgl-fallback', false);
});

test('interrupted optional renderer assets preserve atelier controls and current exports', async ({ page }) => {
  await page.route(/\/assets\/(?:Atelier|three\.module)-[^/]+\.js(?:\?.*)?$/, route => route.abort('failed'));
  await ready(page);
  const section = await atelier(page);
  await expect(section.locator('.vessel-viewer')).toHaveAttribute('data-viewer', 'fallback');
  await section.getByRole('button', { name: /Fold/ }).click();
  await expect(section.getByRole('button', { name: /Fold/ })).toHaveAttribute('aria-pressed', 'true');
  const downloaded = page.waitForEvent('download');
  await section.getByRole('button', { name: /Download JSON/ }).click();
  const download = await downloaded;
  const contents = JSON.parse(await readFile((await download.path())!, 'utf8'));
  expect(contents.design.profile).toBe('fold');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('primary interactive targets meet the touch target contract', async ({ page }) => {
  await ready(page);
  const section = await atelier(page);
  for (const button of await section.getByRole('button').all()) {
    if (!await button.isVisible()) continue;
    const box = await button.boundingBox();
    expect(box, `missing box for ${await button.textContent()}`).not.toBeNull();
    expect(box!.height, `height for ${await button.textContent()}`).toBeGreaterThanOrEqual(43.9);
    expect(box!.width, `width for ${await button.textContent()}`).toBeGreaterThanOrEqual(43.9);
  }
});

test('no continuous GPU rendering while idle, offscreen, or hidden', async ({ page }) => {
  await page.addInitScript(() => {
    const counts = { draws: 0 };
    Object.assign(window, { __kilnQA: counts });
    for (const context of [WebGLRenderingContext, WebGL2RenderingContext]) {
      for (const name of ['drawArrays', 'drawElements'] as const) {
        const original = context.prototype[name];
        Object.defineProperty(context.prototype, name, {
          value: function (...args: unknown[]) { counts.draws++; return Reflect.apply(original, this, args); },
          configurable: true,
        });
      }
    }
  });
  await ready(page);
  await atelier(page);
  await expect.poll(async () => page.locator('#atelier canvas').count()).toBe(1);
  const getDraws = () => page.evaluate(() => (window as unknown as { __kilnQA: { draws: number } }).__kilnQA.draws);
  await page.waitForTimeout(300);
  const idle = await getDraws();
  expect(idle).toBeGreaterThan(0);
  await page.waitForTimeout(300);
  expect(await getDraws()).toBe(idle);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  const offscreen = await getDraws();
  await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  await page.waitForTimeout(300);
  expect(await getDraws()).toBe(offscreen);
  await page.locator('.vessel-viewer').scrollIntoViewIfNeeded();
  await expect(page.locator('.vessel-viewer')).toHaveAttribute('data-in-view', 'true');
  await page.waitForTimeout(100);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const hidden = await getDraws();
  await page.getByRole('button', { name: 'Rotate right', exact: true }).click();
  await expect(page.locator('.vessel-viewer')).toHaveAttribute('data-in-view', 'true');
  await page.setViewportSize({ width: 1430, height: 990 });
  await page.waitForTimeout(300);
  expect(await getDraws()).toBe(hidden);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(await getDraws()).toBeGreaterThan(hidden);
});

test('browser lab resource evidence is captured under stated conditions', async ({ page }, testInfo) => {
  await ready(page);
  await atelier(page);
  const evidence = await page.evaluate(() => ({
    userAgent: navigator.userAgent,
    viewport: { width: innerWidth, height: innerHeight },
    devicePixelRatio,
    navigation: performance.getEntriesByType('navigation').map(entry => entry.toJSON()),
    resources: performance.getEntriesByType('resource').map(entry => entry.toJSON()),
  }));
  await testInfo.attach('browser-lab-evidence.json', { body: JSON.stringify(evidence, null, 2), contentType: 'application/json' });
  expect(evidence.resources.length).toBeGreaterThan(0);
});

// Download state and source schema are inspected independently once the atelier is integrated.
// The tests below use only browser-visible downloads; they do not call the implementation's export function.
export async function readDownload(download: import('@playwright/test').Download) {
  const file = await download.path();
  expect(file).not.toBeNull();
  return readFile(file!, 'utf8');
}

async function downloadText(page: Page, button: string) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: button, exact: true }).click();
  const download = await pending;
  return { text: await readDownload(download), filename: download.suggestedFilename() };
}

test('profile/glaze/shape/rotation changes reach faithful SVG and JSON downloads', async ({ page }) => {
  await ready(page);
  await atelier(page);
  await page.getByRole('button', { name: /Moon$/ }).click();
  await page.getByRole('button', { name: 'Olive ash', exact: true }).click();
  const height = page.getByRole('slider', { name: /height/i });
  await height.focus();
  await page.keyboard.press('End');
  const fullness = page.getByRole('slider', { name: /fullness/i });
  await fullness.focus();
  await page.keyboard.press('Home');
  await page.getByRole('button', { name: 'Rotate right', exact: true }).click();
  const jsonDownload = await downloadText(page, 'Download JSON');
  expect(jsonDownload.filename).toMatch(/\.json$/);
  const json = JSON.parse(jsonDownload.text);
  expect(json.schema).toBe('kiln.design/v1');
  expect(json.conceptOnly).toBe(true);
  expect(json.design.profile).toBe('moon');
  expect(json.design.glaze).toBe('moss');
  expect(json.design.rotation).not.toBe(0);
  expect(json.profilePoints.length).toBeGreaterThan(20);
  expect(JSON.stringify(json)).not.toMatch(/NaN|Infinity/);
  const svgDownload = await downloadText(page, 'Download SVG card');
  expect(svgDownload.filename).toMatch(/\.svg$/);
  const metadata = await page.evaluate(svg => {
    const document = new DOMParser().parseFromString(svg, 'image/svg+xml');
    return { json: document.querySelector('metadata')?.textContent, parseErrors: document.querySelectorAll('parsererror').length, markup: document.documentElement.outerHTML };
  }, svgDownload.text);
  expect(metadata.parseErrors).toBe(0);
  expect(JSON.parse(metadata.json!).design).toEqual(json.design);
  expect(svgDownload.text.toLowerCase()).toContain(json.glaze.color.toLowerCase());
  expect(svgDownload.text).not.toMatch(/<script|<foreignObject|(?:href|src)=["']https?:\/\//i);
  await saveShot(page, 'custom-moon-moss', false);
});

test('profile selection preserves glaze, Undo restores last edit, Reset restores all defaults', async ({ page }) => {
  await ready(page);
  await atelier(page);
  const initial = JSON.parse((await downloadText(page, 'Download JSON')).text);
  await page.getByRole('button', { name: 'Burnt earth', exact: true }).click();
  await page.getByRole('button', { name: /Fold$/ }).click();
  await expect(page.getByRole('button', { name: 'Burnt earth', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const beforeEdit = JSON.parse((await downloadText(page, 'Download JSON')).text);
  const height = page.getByRole('slider', { name: /height/i });
  await height.focus();
  await page.keyboard.press('End');
  await page.getByRole('button', { name: 'Undo adjustment', exact: true }).click();
  const afterUndo = JSON.parse((await downloadText(page, 'Download JSON')).text);
  expect(afterUndo.design).toEqual(beforeEdit.design);
  await page.getByRole('button', { name: 'Reset design', exact: true }).click();
  const reset = JSON.parse((await downloadText(page, 'Download JSON')).text);
  expect(reset.design).toEqual(initial.design);
});

test('repeated and cancelled downloads leave a usable atelier', async ({ page }) => {
  await ready(page);
  await atelier(page);
  const downloads: string[] = [];
  for (let i = 0; i < 3; i++) downloads.push((await downloadText(page, 'Download SVG card')).text);
  expect(new Set(downloads).size).toBe(1);
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download JSON', exact: true }).click();
  const cancelled = await pending;
  await cancelled.cancel();
  const after = JSON.parse((await downloadText(page, 'Download JSON')).text);
  expect(after.schema).toBe('kiln.design/v1');
  await page.getByRole('button', { name: /Moon$/ }).click();
  await expect(page.getByRole('button', { name: /Moon$/ })).toHaveAttribute('aria-pressed', 'true');
});

test('primary navigation and story links have sufficient touch targets', async ({ page }, testInfo) => {
  const measurements: { viewport: number; selector: string; label: string | null; height: number }[] = [];
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await ready(page);
    for (const selector of ['nav a', '.stage-link', '.hero-foot a', '.closing-bottom a']) {
      for (const link of await page.locator(selector).all()) {
        if (!await link.isVisible()) continue;
        const box = await link.boundingBox();
        measurements.push({ viewport: width, selector, label: await link.textContent(), height: box!.height });
      }
    }
  }
  await testInfo.attach('touch-targets.json', { body: JSON.stringify(measurements, null, 2), contentType: 'application/json' });
  expect(measurements.filter(item => item.height < 43.9)).toEqual([]);
});

test('all profile shape extremes fit the viewer and the exported card is reviewable', async ({ page, context }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await ready(page);
  await atelier(page);
  for (const profile of ['Sol', 'Fold', 'Moon']) {
    await page.getByRole('button', { name: new RegExp(`${profile}$`) }).click();
    for (const name of ['Height', 'Fullness', 'Lip opening']) {
      await page.getByRole('slider', { name, exact: true }).focus();
      await page.keyboard.press('End');
    }
    const viewer = page.locator('.vessel-viewer');
    await expect(viewer).toHaveAttribute('data-viewer', 'webgl');
    await viewer.screenshot({ path: join(screenshotDir, `${prefix}-extreme-${profile.toLowerCase()}.png`), animations: 'disabled' });
    const exported = await downloadText(page, 'Download SVG card');
    const card = await context.newPage();
    await card.setViewportSize({ width: 900, height: 1100 });
    await card.setContent(exported.text);
    await card.screenshot({ path: join(screenshotDir, `${prefix}-export-${profile.toLowerCase()}.png`), animations: 'disabled' });
    const wheelMarkFills = await card.locator('g[clip-path] path').evaluateAll(elements => elements.map(element => getComputedStyle(element).fill));
    expect(wheelMarkFills.length).toBeGreaterThan(20);
    expect(wheelMarkFills.every(fill => fill === 'none')).toBe(true);
    const overflowingText = await card.locator('text').evaluateAll(elements => elements.filter(element => {
      const box = (element as SVGGraphicsElement).getBBox();
      return box.x < 0 || box.y < 0 || box.x + box.width > 900 || box.y + box.height > 1100;
    }).map(element => element.textContent));
    expect(overflowingText).toEqual([]);
    await card.close();
  }
});

test('WebGL context loss reveals the current illustrated study without losing controls', async ({ page }) => {
  await ready(page);
  await atelier(page);
  await page.getByRole('button', { name: /Fold$/ }).click();
  await page.getByRole('button', { name: 'Burnt earth', exact: true }).click();
  const supported = await page.locator('.vessel-viewer canvas').evaluate(canvas => {
    const gl = (canvas as HTMLCanvasElement).getContext('webgl2');
    const extension = gl?.getExtension('WEBGL_lose_context');
    extension?.loseContext();
    return Boolean(extension);
  });
  expect(supported).toBe(true);
  await expect(page.locator('.vessel-viewer')).toHaveAttribute('data-viewer', 'fallback');
  await expect(page.locator('.vessel-viewer svg')).toBeVisible();
  const after = JSON.parse((await downloadText(page, 'Download JSON')).text);
  expect(after.design.profile).toBe('fold');
  expect(after.design.glaze).toBe('clay');
});
