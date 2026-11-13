// Screenshots a level from the running dev server through headless Chrome.
//   node --experimental-websocket scripts/screenshot-level.cjs <levelId> <out.png> [waitMs]
// Needs `npm run dev` on 127.0.0.1:5173. Uses the ?level= dev hook in LevelSelectScene.
const { spawn } = require('child_process');
const fs = require('fs');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;
const [levelId = '1', out = 'level.png', waitMs = '9000'] = process.argv.slice(2);

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const chrome = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${PORT}`, '--window-size=1920,1280',
    '--no-first-run', '--no-default-browser-check', '--autoplay-policy=no-user-gesture-required',
    `--user-data-dir=/tmp/rd-shot-profile-${process.pid}`, 'about:blank',
  ], { stdio: 'ignore' });
  try {
    let targets = [];
    for (let i = 0; i < 50 && !targets.length; i++) {
      await sleep(200);
      try { targets = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).filter(t => t.type === 'page'); } catch {}
    }
    if (!targets.length) throw new Error('chrome did not expose a page target');
    const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    let id = 0; const pending = new Map();
    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
      if (m.method === 'Runtime.exceptionThrown') console.log('page exception:', m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
      if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning'))
        console.log(`page ${m.params.type}:`, m.params.args.map(a => a.value ?? a.description).join(' '));
    };
    const send = (method, params = {}) => new Promise(res => { const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url: `http://127.0.0.1:5173/?level=${levelId}&diff=easy` });
    await sleep(2500);
    await send('Runtime.evaluate', { expression: "document.getElementById('startBtn').click()" });
    await sleep(Number(waitMs));
    const errs = await send('Runtime.evaluate', { expression: 'JSON.stringify({ overlayHidden: document.getElementById("overlay")?.classList.contains("hidden") })', returnByValue: true });
    console.log('page state', errs.result?.result?.value);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
    console.log('wrote', out);
    ws.close();
  } finally {
    chrome.kill('SIGKILL');
  }
}
main().catch(e => { console.error(e); process.exit(1); });
