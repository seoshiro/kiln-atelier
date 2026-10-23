import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { Color } from 'three';
import { fillGlazePixels } from './glaze-texture';
import { GLAZES } from './model';

// Captured independently from the original v1.0.0 paintGlaze function, not the optimized helper.
const ORIGINAL_TEXTURE_HASHES = {
  ink: '5b64b06f4bc0fb80a53abc35335e75956c706827124a2d24e70c5e9a4ce0f17b',
  clay: 'bdcca487f4ac461109d1a096456f730040f93326b429ca4a488b175925b5fcab',
  chalk: '5380458163e61acc3d25de2a4adcbe6b4df6f186440fb72ed0df96700c65b06a',
  moss: '12937e02ff1e5c3771a8990c49a27af3d8f55feb959bc6e4b77d8166571d7ba1',
};

describe('glaze visual fidelity', () => {
  for (const glaze of GLAZES) {
    it(`keeps every original ${glaze.name} RGBA pixel`, () => {
      const data = new Uint8ClampedArray(512 * 512 * 4);
      fillGlazePixels(data, new Color(glaze.color));
      expect(createHash('sha256').update(data).digest('hex')).toBe(ORIGINAL_TEXTURE_HASHES[glaze.id]);
    });
  }
});
