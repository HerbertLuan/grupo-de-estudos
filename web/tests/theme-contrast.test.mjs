import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/themes.css', import.meta.url), 'utf8');
const tokens = block => Object.fromEntries([...block.matchAll(/(--ej-[\w-]+):\s*(#[\da-f]+);/gi)].map(([, key, value]) => [key, value]));
const base = tokens(css.slice(0, css.indexOf(':root[data-theme="light"]')));
const light = { ...base, ...tokens(css.slice(css.indexOf(':root[data-theme="light"]'))) };
const rgb = hex => [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255);
const luminance = hex => rgb(hex).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);

for (const [theme, values] of [['dark', base], ['light', light]]) {
  test(`${theme}: text, actions, focus and informative chart colors meet their contrast targets`, () => {
    const check = (foreground, background, minimum) => {
      const ratio = contrast(values[`--ej-${foreground}`], values[`--ej-${background}`]);
      assert.ok(ratio >= minimum, `${theme}: ${foreground} / ${background} = ${ratio.toFixed(2)}:1, requires ${minimum}:1`);
    };
    for (const background of ['surface-page', 'surface-card', 'surface-control']) {
      for (const foreground of ['text-primary', 'text-secondary', 'text-muted', 'text-link', 'blue', 'purple', 'success', 'warning', 'danger']) check(foreground, background, 4.5);
      check('focus', background, 3);
    }
    for (const background of ['action', 'action-hover', 'action-active']) check('on-action', background, 4.5);
    for (const foreground of ['hero-text', 'hero-muted']) check(foreground, 'hero-bg', 4.5);
    for (const foreground of ['chart-blue', 'chart-error', 'chart-award', 'border-input']) check(foreground, 'surface-card', 3);
  });
}
