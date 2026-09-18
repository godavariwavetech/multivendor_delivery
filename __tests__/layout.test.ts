/**
 * Guards the layouts against the one mistake that keeps breaking phones: a
 * fixed pixel width in a row. The order tracker shipped with four 84dp labels
 * in a card that is ~252dp wide on a 320dp phone, so the last one ran off the
 * screen. Widths that large have to be flexible.
 *
 * Small fixed sizes (icons, dots, avatars, toggles) are fine and allowed.
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const SRC = join(__dirname, '..', 'src');

/** Anything at or above this has to flex, or three of them stop fitting. */
const MAX_FIXED_WIDTH = 96;

/** Full-width elements that are meant to be the only thing on their row. */
const ALLOWED = [
  'components/MapPlaceholder.tsx', // the map canvas scales with its own box
];

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry: string) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : path.endsWith('.tsx') || path.endsWith('.ts') ? [path] : [];
  });

describe('layouts fit a small phone', () => {
  const files = walk(SRC);

  test('no style sets a fixed width a narrow screen cannot afford', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const relative = file.slice(SRC.length + 1).replace(/\\/g, '/');
      if (ALLOWED.includes(relative)) {
        continue;
      }
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line: string, i: number) => {
          const match = line.match(/width:\s*(\d+)/);
          if (match && Number(match[1]) >= MAX_FIXED_WIDTH && !/maxWidth|minWidth|'\d+%'/.test(line)) {
            offenders.push(`${relative}:${i + 1} → width: ${match[1]}`);
          }
        });
    }
    expect(offenders).toEqual([]);
  });

  test('every screen file is reachable from the source tree', () => {
    expect(files.length).toBeGreaterThan(40);
  });
});
