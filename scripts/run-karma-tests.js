const { spawnSync } = require('node:child_process');
const { chromium } = require('playwright');

process.env.CHROME_BIN ||= chromium.executablePath();

const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['ng', 'test', ...process.argv.slice(2)],
  { stdio: 'inherit', env: process.env },
);

process.exit(result.status ?? 1);
