// Builds the app icons and splash image from the CSRLSC logo artwork in assets/branding.
// `sharp` is intentionally not a project dependency. Run once with:
//   npm install --no-save sharp && node generate-pngs.js
const sharp = require('sharp');
const path = require('path');

const LOGO = path.resolve(__dirname, 'assets/branding/csrlsc-logo.png'); // wordmark + "Define Measure Elevate"
const WORDMARK = path.resolve(__dirname, 'assets/branding/csrlsc-wordmark.png'); // wordmark only, legible at icon sizes
const out = (name) => path.resolve(__dirname, 'assets/images', name);

// `fill` is the artwork's width as a share of the canvas. Android crops adaptive icons and the Android 12
// splash to a circle about two thirds of the canvas, so those keep the artwork well inside it.
const targets = [
  { dest: 'icon.png', size: 1024, fill: 0.82, source: WORDMARK, background: '#FFFFFF' },
  { dest: 'favicon.png', size: 192, fill: 0.92, source: WORDMARK, background: '#FFFFFF' },
  { dest: 'android-icon-foreground.png', size: 1024, fill: 0.6, source: WORDMARK },
  { dest: 'android-icon-monochrome.png', size: 432, fill: 0.6, source: WORDMARK, silhouette: true },
  { dest: 'splash-icon.png', size: 1024, fill: 0.55, source: LOGO },
];

async function build({ dest, size, fill, source, background, silhouette }) {
  const width = Math.round(size * fill);
  const resized = sharp(source).resize({ width, kernel: 'lanczos3' });
  let input = await resized.png().toBuffer();
  if (silhouette) {
    const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 4) { data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; }
    input = await sharp(data, { raw: info }).png().toBuffer();
  }
  const base = sharp({ create: { width: size, height: size, channels: 4, background: background || { r: 0, g: 0, b: 0, alpha: 0 } } });
  await base.composite([{ input, gravity: 'center' }]).png().toFile(out(dest));
  console.log('wrote', dest);
}

(async () => { for (const target of targets) await build(target); })().catch(console.error);
