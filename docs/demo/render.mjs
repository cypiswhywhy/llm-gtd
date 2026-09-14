// Renders demo.html into the README demo. Needs google-chrome, ffmpeg and Node 22.
// node docs/demo/render.mjs                -> docs/assets/demo.mp4 + demo.gif
// node docs/demo/render.mjs --stills 5,30  -> PNG previews of single frames (path printed)
import {spawn} from 'node:child_process';
import {writeFileSync, mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const assets = join(here, '..', 'assets');
const FPS = 30, PORT = 9337;
const args = process.argv.slice(2);
const stills = args[0] === '--stills' ? args[1].split(',').map(Number) : null;
const scratch = mkdtempSync(join(tmpdir(), 'llm-gtd-demo-'));

const run = (cmd, argv, stdin = 'ignore') => spawn(cmd, argv, {stdio: [stdin, 'inherit', 'inherit']});
const exited = proc => new Promise(r => proc.on('close', r));

const chrome = spawn('google-chrome', ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${scratch}/profile`,
  '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', '--font-render-hinting=none', 'about:blank'], {stdio: 'ignore'});
const sleep = ms => new Promise(r => setTimeout(r, ms));
for (let i = 0; ; i++) {
  try { await fetch(`http://127.0.0.1:${PORT}/json/version`); break; } catch { if (i > 50) throw new Error('chrome did not start'); await sleep(200); }
}
const tgt = await (await fetch(`http://127.0.0.1:${PORT}/json/new?file://${here}/demo.html?static`, {method: 'PUT'})).json();
const ws = new WebSocket(tgt.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let seq = 0; const pending = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); const p = pending.get(m.id); if (p) { pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); } };
const send = (method, params = {}) => new Promise((res, rej) => { const id = ++seq; pending.set(id, {res, rej}); ws.send(JSON.stringify({id, method, params})); });
const evaluate = async expr => { const r = await send('Runtime.evaluate', {expression: expr, awaitPromise: true, returnByValue: true}); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails)); return r.result.value; };

await send('Emulation.setDeviceMetricsOverride', {width: 1280, height: 720, deviceScaleFactor: 1.5, mobile: false});
const duration = await evaluate(`new Promise(r=>{const go=()=>document.fonts.ready.then(()=>{init();r(DURATION)});document.readyState==='complete'?go():addEventListener('load',go)})`);
const shot = async (t, format) => { await evaluate(`seek(${t})`); return Buffer.from((await send('Page.captureScreenshot', {format, quality: 94})).data, 'base64'); };

if (stills) {
  for (const t of stills) writeFileSync(`${scratch}/t${t}.png`, await shot(t, 'png'));
  console.log(`duration ${duration.toFixed(1)} s; stills in ${scratch}`);
  console.log('scenes', await evaluate(`JSON.stringify({captions:TL.captions.map(c=>+c.t.toFixed(1)),sessions:TL.sessions.map(s=>+s.t.toFixed(1)),end:+END.toFixed(1)})`));
} else {
  const mp4 = join(assets, 'demo.mp4'), gif = join(assets, 'demo.gif');
  const ff = run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'slow', '-movflags', '+faststart', mp4], 'pipe');
  const frames = Math.ceil(duration * FPS);
  for (let f = 0; f < frames; f++) {
    if (!ff.stdin.write(await shot(f / FPS, 'jpeg'))) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 300 === 0) console.log(`frame ${f}/${frames}`);
  }
  ff.stdin.end();
  await exited(ff);
  await exited(run('ffmpeg', ['-y', '-loglevel', 'error', '-i', mp4, '-vf',
    'fps=10,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4', gif]));
  console.log(`wrote ${mp4} and ${gif} (${duration.toFixed(1)} s)`);
}
ws.close(); chrome.kill();
