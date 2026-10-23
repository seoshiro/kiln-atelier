import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_DESIGN, GLAZES, normalizeDesign, profilePoints, vesselPath } from '../art/model';
import { createDesignJSON, createDesignSVG, designDocument, designFilename, downloadFile } from './export';

describe('design document and self-contained card', () => {
  it('serializes the exact normalized shape, glaze and view with a concept disclaimer', () => {
    const input = { profile: 'sol', glaze: 'moss', height: 121, fullness: 87, lip: 113, rotation: -25 };
    const document = JSON.parse(createDesignJSON(input));
    expect(document.schema).toBe('kiln.design/v1');
    expect(document.conceptOnly).toBe(true);
    expect(document.design).toEqual(normalizeDesign(input));
    expect(document.glaze.color).toBe(GLAZES.find((glaze) => glaze.id === 'moss')!.color);
    expect(document.profilePoints).toEqual(profilePoints(input));
    expect(document.note).toContain('not a production specification');
  });

  it('is deterministic and does not add a time, random id or external URL', () => {
    expect(createDesignJSON(DEFAULT_DESIGN)).toBe(createDesignJSON(DEFAULT_DESIGN));
    expect(createDesignSVG(DEFAULT_DESIGN)).toBe(createDesignSVG(DEFAULT_DESIGN));
    expect(createDesignSVG(DEFAULT_DESIGN)).not.toMatch(/(?:href|src)=|<script|<foreignObject|@import|https:\/\//i);
  });

  it('includes the shared geometric silhouette and selected color in the card', () => {
    const input = { ...DEFAULT_DESIGN, profile: 'fold', glaze: 'clay', height: 127, fullness: 74, lip: 116 };
    const svg = createDesignSVG(input);
    expect(svg).toContain(`d="${vesselPath(input)}"`);
    expect(svg).toContain(`fill="${GLAZES.find((glaze) => glaze.id === 'clay')!.color}"`);
    expect(svg).toContain('Height 127 percent, fullness 74 percent, lip 116 percent');
    expect(svg).toContain('Fold / Burnt earth');
    expect(svg).toMatch(/<g clip-path="url\(#vessel\)" fill="none" stroke="#ffffff" stroke-opacity="\.045"/);
  });

  it('embeds the same design JSON as XML-safe metadata', () => {
    const json = JSON.stringify(designDocument(DEFAULT_DESIGN));
    const metadata = createDesignSVG(DEFAULT_DESIGN).match(/<metadata id="kiln-design">(.*?)<\/metadata>/s)![1];
    const decoded = metadata.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    expect(decoded).toBe(json);
  });

  it('normalizes dangerous and nonfinite values before all export sinks', () => {
    const malicious = { profile: '<script>alert(1)</script>', glaze: '"/><script/>', height: NaN, fullness: Infinity, lip: -Infinity, rotation: NaN, extra: '<foreignObject/>' };
    const json = createDesignJSON(malicious), svg = createDesignSVG(malicious);
    expect(JSON.parse(json).design).toEqual(DEFAULT_DESIGN);
    expect(svg).not.toMatch(/NaN|Infinity|<script|<foreignObject/);
    expect(json).not.toContain('extra');
    expect(designFilename(malicious, 'svg')).toBe(`kiln-${DEFAULT_DESIGN.profile}-${DEFAULT_DESIGN.glaze}.svg`);
  });

  it('distinguishes three profiles, bounded shape changes and all four selected glazes', () => {
    const cards = new Set(['sol', 'fold', 'moon'].map((profile) => createDesignSVG({ ...DEFAULT_DESIGN, profile })));
    expect(cards.size).toBe(3);
    expect(createDesignSVG({ ...DEFAULT_DESIGN, height: 70 })).not.toBe(createDesignSVG({ ...DEFAULT_DESIGN, height: 130 }));
    for (const glaze of GLAZES) expect(createDesignSVG({ ...DEFAULT_DESIGN, glaze: glaze.id })).toContain(`fill="${glaze.color}"`);
  });

  it('grounds the exported vessel foot on its shadow for every profile and parameter extreme', () => {
    for (const profile of ['sol', 'fold', 'moon']) for (const height of [70, 130]) {
      const design = { ...DEFAULT_DESIGN, profile, height };
      const svg = createDesignSVG(design);
      const transform = svg.match(/transform="translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+)\)"/)!.slice(1).map(Number);
      const shadowY = Number(svg.match(/<ellipse[^>]*cy="([-\d.]+)"/)![1]);
      const profileY = [...vesselPath(design).matchAll(/[-\d.]+,([-\d.]+)/g)].map((point) => Number(point[1]));
      const screenFootY = transform[1] + Math.max(...profileY) * transform[2];
      expect(Math.abs(shadowY - screenFootY)).toBeLessThanOrEqual(1);
      expect(screenFootY).toBeLessThan(904); // The artwork remains above its caption rule.
      expect(Math.min(...profileY) * transform[2] + transform[1]).toBeGreaterThan(143); // Below the masthead rule.
    }
  });

  it('does not mutate the supplied design', () => {
    const input = Object.freeze({ ...DEFAULT_DESIGN });
    createDesignJSON(input);
    createDesignSVG(input);
    expect(input).toEqual(DEFAULT_DESIGN);
  });
});

describe('browser download lifecycle', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); });

  function browserStub(throws = false) {
    vi.useFakeTimers();
    const anchor = { href: '', download: '', hidden: false, click: vi.fn(() => { if (throws) throw new Error('Browser denied download'); }), remove: vi.fn() };
    const append = vi.fn();
    vi.stubGlobal('window', { document: { createElement: vi.fn(() => anchor), body: { append } } });
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:kiln-test');
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    return { anchor, append, create, revoke };
  }

  it('creates a typed local blob, initiates the right filename and releases it once', () => {
    const browser = browserStub();
    const cleanup = downloadFile('<svg/>', 'kiln-sol-ink.svg', 'image/svg+xml;charset=utf-8');
    expect(browser.anchor.download).toBe('kiln-sol-ink.svg');
    expect(browser.anchor.href).toBe('blob:kiln-test');
    expect(browser.anchor.click).toHaveBeenCalledOnce();
    expect(browser.create.mock.calls[0][0]).toBeInstanceOf(Blob);
    expect((browser.create.mock.calls[0][0] as Blob).type).toBe('image/svg+xml;charset=utf-8');
    expect(browser.revoke).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1500);
    expect(browser.revoke).toHaveBeenCalledOnce();
    cleanup();
    expect(browser.revoke).toHaveBeenCalledOnce();
  });

  it('releases a browser-rejected or cancelled initiation without leaked URLs', () => {
    const browser = browserStub(true);
    expect(() => downloadFile('{}', 'kiln.json', 'application/json')).toThrow('Browser denied download');
    expect(browser.revoke).toHaveBeenCalledOnce();
    expect(browser.anchor.remove).toHaveBeenCalledOnce();
    vi.runAllTimers();
    expect(browser.revoke).toHaveBeenCalledOnce();
  });

  it('supports repeated clicks and cleanup during unmount safely', () => {
    const browser = browserStub();
    const cleanups = Array.from({ length: 8 }, () => downloadFile('{}', 'kiln.json', 'application/json'));
    cleanups.forEach((cleanup) => { cleanup(); cleanup(); });
    vi.runAllTimers();
    expect(browser.anchor.click).toHaveBeenCalledTimes(8);
    expect(browser.revoke).toHaveBeenCalledTimes(8);
  });

  it('notifies its owner to remove an outstanding cleanup reference', () => {
    browserStub();
    const released = vi.fn();
    const cleanup = downloadFile('{}', 'kiln.json', 'application/json', released);
    vi.advanceTimersByTime(1500);
    expect(released).toHaveBeenCalledExactlyOnceWith(cleanup);
  });
});
