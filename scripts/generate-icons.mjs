// Generate the extension icons from the Cramb ✦ mark.
// Dev-only: run with `pnpm icons`. Outputs PNGs to public/icon/.
// The mark is the same 4-point sparkle used in the popup, side panel, and site:
// a white ✦ on a brand-violet squircle, legible on light and dark toolbars.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SIZES = [16, 32, 48, 128];
const outDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/icon');

// 128×128 source: violet rounded square + centered white sparkle (24px padding).
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8C7DF7"/>
      <stop offset="1" stop-color="#6D5EF6"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="28" fill="url(#g)"/>
  <g transform="translate(24,24) scale(3.3333)">
    <path d="M12 0 L14.4 9.6 L24 12 L14.4 14.4 L12 24 L9.6 14.4 L0 12 L9.6 9.6 Z" fill="#FFFFFF"/>
  </g>
</svg>`;

await mkdir(outDir, { recursive: true });
const source = Buffer.from(svg);
for (const size of SIZES) {
  const file = path.join(outDir, `${size}.png`);
  await sharp(source, { density: 384 }).resize(size, size).png().toFile(file);
  console.log(`wrote ${path.relative(process.cwd(), file)}`);
}
