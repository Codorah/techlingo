import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

// Same font files as the app (public/fonts), so the video looks like the product.
const faces: [string, string, string][] = [
  ['Nunito', '800', 'Nunito-800-latin.woff2'],
  ['Nunito', '900', 'Nunito-900-latin.woff2'],
  ['DM Sans', '400', 'DMSans-400-latin.woff2'],
  ['DM Sans', '500', 'DMSans-500-latin.woff2'],
  ['DM Sans', '700', 'DMSans-700-latin.woff2'],
  ['JetBrains Mono', '500', 'JetBrainsMono-500-latin.woff2'],
];

for (const [family, weight, file] of faces) {
  loadFont({ family, url: staticFile(`fonts/${file}`), weight, format: 'woff2' });
}
