// Render a few frames of both compositions for a visual check (bundles once).
// Usage: node scripts/stills.mjs <outDir> <frame,frame,...> [scale]
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const [out, framesArg, scaleArg = '0.4'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: resolve('src/index.ts') });
for (const id of ['Vertical', 'Landscape']) {
  const composition = await selectComposition({ serveUrl, id });
  for (const f of framesArg.split(',').map(Number)) {
    await renderStill({ serveUrl, composition, frame: f, output: join(out, `${id}-${String(f).padStart(4, '0')}.png`), scale: Number(scaleArg) });
    console.log(id, f);
  }
}
