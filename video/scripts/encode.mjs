// Two-pass H.264 + AAC encode of a Remotion master to a size budget, for the web.
// Usage: node scripts/encode.mjs <master.mp4> <out.mp4> [targetMB=7.4]
// Needs ffmpeg + ffprobe on PATH. Pass logs go next to the master (temp folder).
import { spawnSync } from 'node:child_process';
import { dirname, join, basename } from 'node:path';

const [input, output, target = '7.4'] = process.argv.slice(2);
if (!input || !output) {
  console.error('Usage: node scripts/encode.mjs <master.mp4> <out.mp4> [targetMB]');
  process.exit(1);
}

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8' });
  if (r.status !== 0) process.exit(r.status ?? 1);
  return r.stdout;
};

const seconds = parseFloat(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', input]));
const audioKbps = 96;
// 3% container overhead.
const videoKbps = Math.floor((parseFloat(target) * 8 * 1024 * 0.97) / seconds - audioKbps);
const log = join(dirname(input), `${basename(output, '.mp4')}-2pass`);
console.log(`${seconds.toFixed(2)} s -> video ${videoKbps} kb/s + audio ${audioKbps} kb/s`);

const common = ['-y', '-loglevel', 'error', '-i', input, '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation',
  '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-b:v', `${videoKbps}k`, '-maxrate', `${Math.round(videoKbps * 2.2)}k`,
  '-bufsize', `${videoKbps * 4}k`, '-passlogfile', log];
run('ffmpeg', [...common, '-pass', '1', '-an', '-f', 'null', '-']);
run('ffmpeg', [...common, '-pass', '2', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', `${audioKbps}k`, '-ac', '2', '-movflags', '+faststart', output]);
console.log(`written ${output}`);
