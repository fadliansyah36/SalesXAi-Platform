import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
const port = Number(process.env.EXPO_PORT ?? 8081);
const child = spawn('bun', ['x', 'expo', 'start', '--offline', '--non-interactive', '--localhost', '--port', String(port)], { stdio: 'inherit', env: { ...process.env, CI: '1' } });
let exited = false;
let exitCode = 0;
child.once('exit', code => { exited = true; exitCode = code ?? 1; });
try {
  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    if (exited) throw new Error('Expo CLI exited before Metro was ready (code ' + exitCode + ').');
    try {
      const response = await fetch('http://127.0.0.1:' + port + '/status');
      const body = await response.text();
      if (response.ok && body.includes('packager-status:running')) {
        console.log('Expo Metro startup verified: packager-status:running');
        process.exitCode = 0;
        break;
      }
    } catch {}
    await delay(1000);
  }
  if (process.exitCode !== 0) throw new Error('Expo Metro did not become ready within 90 seconds.');
} finally {
  child.kill('SIGTERM');
  await Promise.race([new Promise(resolve => child.once('exit', resolve)), delay(5000)]);
}
