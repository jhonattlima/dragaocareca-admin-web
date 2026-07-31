#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const process = require('node:process');
const { URL } = require('node:url');
const { chromium } = require('playwright');

const EPISODE_ID = 334;
const DEFAULT_FRONTEND_URL = process.env.PHASE6_FRONTEND_URL || 'http://localhost:4200/';
const DEFAULT_API_URL = process.env.PHASE6_API_URL || 'http://localhost:3000';
const DEFAULT_CHROME = process.env.CHROME_BIN || '/home/jhonatt/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome';
const DEFAULT_FIXTURE = process.env.PHASE6_DC334_FIXTURE || 'E:\\Jhonatt\\DC\\_VersãoFinalParaPostagem\\_Episódios - Season 3\\DC 334 - Leitura de Pergaminhos - O pergaminho rebote dos caras';
const DEFAULT_MEDIA_DESTINATION = process.env.PHASE6_MEDIA_DESTINATION || path.resolve(__dirname, '../../dragaocareca-admin-api/data/media/episodes/334');
const SCENARIOS = [
  ['empty selection', 'The real row must render at least one available artifact control before the disabled Prepare action can be observed.'],
  ['partial availability warning plus ZIP', 'A reversible verifier control or a prepared partial fixture is required.'],
  ['failed preparation', 'A reversible preparation-failure control is required.'],
  ['network failure delivery', 'A completed job is required before browser delivery interception.'],
  ['401 delivery', 'A completed job is required before browser delivery interception.'],
  ['403 delivery', 'A completed job is required before browser delivery interception.'],
  ['404 delivery', 'A completed job is required before browser delivery interception.'],
  ['409 delivery', 'A completed job is required before browser delivery interception.'],
  ['completed modal reopen', 'A completed real browser job is required.'],
  ['same-job delivery retry', 'A completed real browser job plus a reversible delivery failure is required.'],
  ['reset and new selection', 'A completed real browser job is required.'],
  ['repeated completion idempotence', 'A completed real browser job plus repeated status delivery is required.'],
  ['modal cleanup and focus restoration', 'A real browser page with the Episodes table is required.'],
];

const usage = () => `Usage: node scripts/phase6-validation.js [options]

Options:
  --frontend-url URL       Angular URL (default: ${DEFAULT_FRONTEND_URL})
  --api-url URL            Sibling API origin (default: ${DEFAULT_API_URL})
  --fixture-path PATH      Immutable DC334 source directory
  --media-destination PATH API media destination for episode 334
  --chrome-bin PATH        Existing Chromium executable (default: ${DEFAULT_CHROME})
  --report-dir PATH        JSON/Markdown output directory (required for clean evidence)
  --scenario-timeout MS    Per-scenario bound (default: 15000)
  --overall-timeout MS     Overall bound (default: 120000)
  --help                   Show this help
`;

const parseArgs = (argv) => {
  const options = {
    frontendUrl: DEFAULT_FRONTEND_URL,
    apiUrl: DEFAULT_API_URL,
    fixturePath: DEFAULT_FIXTURE,
    mediaDestination: DEFAULT_MEDIA_DESTINATION,
    chromeBin: DEFAULT_CHROME,
    reportDir: null,
    scenarioTimeout: 15000,
    overallTimeout: 120000,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help') return { help: true };
    const [inlineKey, inlineValue] = argument.split('=', 2);
    const key = inlineValue === undefined ? argument : inlineKey;
    const value = inlineValue === undefined ? argv[++index] : inlineValue;
    const assignments = {
      '--frontend-url': 'frontendUrl', '--api-url': 'apiUrl', '--fixture-path': 'fixturePath',
      '--media-destination': 'mediaDestination', '--chrome-bin': 'chromeBin', '--report-dir': 'reportDir',
      '--scenario-timeout': 'scenarioTimeout', '--overall-timeout': 'overallTimeout',
    };
    if (!assignments[key] || value === undefined) throw new Error(`Unknown or incomplete option: ${argument}`);
    options[assignments[key]] = ['scenarioTimeout', 'overallTimeout'].includes(assignments[key]) ? Number(value) : value;
  }
  if (!options.reportDir) throw new Error('--report-dir is required');
  return options;
};

const now = () => new Date().toISOString();
const unsupported = (reason, details = {}) => ({ status: 'unsupported', reason, ...details });
const pass = (details = {}) => ({ status: 'pass', ...details });
const fail = (reason, details = {}) => ({ status: 'failed', reason, ...details });

const requestJson = async (url, timeout) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const text = await response.text();
    let body = null;
    try { body = JSON.parse(text); } catch { body = text.slice(0, 500); }
    return { ok: response.ok, status: response.status, body };
  } finally {
    clearTimeout(timer);
  }
};

const listFiles = (directory) => {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).map((entry) => ({
    name: entry.name,
    type: entry.isDirectory() ? 'directory' : 'file',
    size: entry.isFile() ? fs.statSync(path.join(directory, entry.name)).size : null,
  }));
};

const writeReport = (report, reportDir) => {
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(path.join(reportDir, 'phase6-validation.json'), `${JSON.stringify(report, null, 2)}\n`);
  const lines = [
    '# Phase 6 real DC334 browser validation', '',
    `- Started: ${report.startedAt}`, `- Finished: ${report.finishedAt}`,
    `- Status: ${report.status}`, `- Frontend: ${report.configuration.frontendUrl}`,
    `- API: ${report.configuration.apiUrl}`, `- Chromium: ${report.configuration.chromeBin}`, '',
    '## Preconditions', '',
    ...Object.entries(report.preflight).map(([key, value]) => `- **${key}:** ${value.status} — ${value.reason || JSON.stringify(value)}`), '',
    '## Scenarios', '', '| Scenario | Status | Evidence |', '|---|---|---|',
    ...Object.entries(report.scenarios).map(([name, result]) => `| ${name} | ${result.status} | ${(result.reason || result.visibleState || 'browser evidence recorded').replaceAll('|', '\\|')} |`), '',
    '## Cleanup', '', `- ${report.cleanup.status}: ${report.cleanup.reason}`,
  ];
  fs.writeFileSync(path.join(reportDir, 'phase6-validation.md'), `${lines.join('\n')}\n`);
};

const main = async () => {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.help) { console.log(usage()); return 0; }
  const options = parsed;
  const startedAt = now();
  const deadline = Date.now() + options.overallTimeout;
  const report = {
    startedAt,
    finishedAt: null,
    status: 'unsupported',
    configuration: options,
    preflight: {},
    scenarios: Object.fromEntries(SCENARIOS.map(([name]) => [name, unsupported('not evaluated yet')])),
    browser: { console: [], pageErrors: [], requests: [], responses: [], downloads: [] },
    cleanup: { status: 'not-run', reason: 'Cleanup has not started.' },
  };
  let browser;
  let context;
  let page;
  let snapshot = null;
  try {
    report.preflight.chromium = fs.existsSync(options.chromeBin)
      ? pass({ executable: options.chromeBin })
      : unsupported(`Chromium executable does not exist: ${options.chromeBin}`);
    report.preflight.frontend = await requestJson(options.frontendUrl, 5000).then((result) => result.ok
      ? pass({ statusCode: result.status })
      : unsupported(`Frontend returned HTTP ${result.status}`)).catch((error) => unsupported(`Frontend preflight failed: ${error.message}`));
    report.preflight.api = await requestJson(`${options.apiUrl.replace(/\/$/, '')}/health`, 5000).then((result) => result.ok
      ? pass({ statusCode: result.status })
      : unsupported(`API health returned HTTP ${result.status}`)).catch((error) => unsupported(`API preflight failed: ${error.message}`));
    report.preflight.fixture = fs.existsSync(options.fixturePath)
      ? pass({ entries: listFiles(options.fixturePath) })
      : unsupported(`Immutable DC334 source does not exist at ${options.fixturePath}`);
    report.preflight.mediaDestination = pass({ path: options.mediaDestination, before: listFiles(options.mediaDestination) });
    report.preflight.dependencies = pass({ playwright: require('playwright/package.json').version, packageInstall: 'not attempted' });

    const blocking = ['chromium', 'frontend', 'api', 'fixture'].filter((key) => report.preflight[key].status !== 'pass');
    if (blocking.length === 0 && Date.now() < deadline) {
      const apiEpisode = await requestJson(`${options.apiUrl.replace(/\/$/, '')}/v1/episodes/${EPISODE_ID}`, 5000);
      snapshot = { apiEpisodeStatus: apiEpisode.status, mediaBefore: listFiles(options.mediaDestination) };
      const episodeBody = apiEpisode.body && typeof apiEpisode.body === 'object' ? apiEpisode.body : null;
      const episodeEvidence = episodeBody ? {
        episodeId: episodeBody.episodeId,
        title: episodeBody.title,
        episodeNumber: episodeBody.episodeNumber,
        fileName: episodeBody.fileName,
        trailerFileName: episodeBody.trailerFileName,
        coverFileName: episodeBody.coverFileName,
        coverLowFileName: episodeBody.coverLowFileName,
        transcriptFileName: episodeBody.transcriptFileName,
      } : null;
      report.preflight.episode334 = apiEpisode.ok ? pass({ statusCode: apiEpisode.status, snapshot: episodeEvidence }) : unsupported(`Episode 334 lookup returned HTTP ${apiEpisode.status}`);
      if (report.preflight.episode334.status === 'pass') {
        browser = await chromium.launch({ executablePath: options.chromeBin, headless: true });
        context = await browser.newContext({ acceptDownloads: true });
        page = await context.newPage();
        page.on('console', (message) => report.browser.console.push({ type: message.type(), text: message.text().slice(0, 500) }));
        page.on('pageerror', (error) => report.browser.pageErrors.push(error.message));
        page.on('request', (request) => report.browser.requests.push({ method: request.method(), url: request.url().replace(/([?&](token|authorization|access_token)=)[^&]*/gi, '$1[REDACTED]') }));
        page.on('response', (response) => report.browser.responses.push({ status: response.status(), url: response.url().replace(/([?&](token|authorization|access_token)=)[^&]*/gi, '$1[REDACTED]') }));
        page.on('download', async (download) => report.browser.downloads.push({ suggestedFilename: download.suggestedFilename() }));
        await page.goto(options.frontendUrl, { waitUntil: 'domcontentloaded', timeout: options.scenarioTimeout });
        await page.getByRole('button', { name: 'Episodes', exact: true }).click();
        const episodeRow = page.locator('.episode-download-button').first();
        if (await episodeRow.count() === 0) {
          report.scenarios['modal cleanup and focus restoration'] = unsupported('Episodes table did not render a Downloads control in the real browser.');
        } else {
          await episodeRow.click();
          const dialog = page.locator('[role="dialog"][aria-modal="true"]');
          await dialog.waitFor({ state: 'visible', timeout: options.scenarioTimeout });
          const prepare = dialog.getByRole('button', { name: /Prepare archive/i });
          report.scenarios['modal cleanup and focus restoration'] = pass({ visibleState: 'dialog opened', prepareDisabled: await prepare.isDisabled() });
          const available = dialog.locator('input[type="checkbox"]:not([disabled])');
          if (await available.count() === 0) {
            report.scenarios['empty selection'] = unsupported('No available artifact checkbox was rendered; Prepare was not clicked and no job was started.');
          } else {
            for (let index = 0; index < await available.count(); index += 1) {
              const checkbox = available.nth(index);
              if (await checkbox.isChecked()) await checkbox.uncheck();
            }
            report.scenarios['empty selection'] = await prepare.isDisabled()
              ? pass({ visibleState: 'Prepare archive disabled for empty selection', preparationPosts: 0 })
              : fail('Prepare archive remained enabled after all available selections were cleared.');
          }
          const closeButton = dialog.getByRole('button', { name: 'Close download dialog', exact: true });
          await closeButton.click();
          await dialog.waitFor({ state: 'hidden', timeout: options.scenarioTimeout });
          await page.waitForTimeout(50);
          const focusEvidence = await page.evaluate(() => ({
            isDownloadsInvoker: document.activeElement?.classList.contains('episode-download-button') || false,
            tag: document.activeElement?.tagName || null,
            className: document.activeElement?.className || null,
          }));
          const focusRestored = focusEvidence.isDownloadsInvoker;
          report.scenarios['modal cleanup and focus restoration'] = focusRestored
            ? pass({ visibleState: 'dialog closed and original Downloads invoker regained focus', focus: focusEvidence })
            : fail('Dialog closed but focus was not restored to the original Downloads invoker.', { focus: focusEvidence });
        }
      }
    }
    const reason = blocking.length > 0
      ? `Prerequisites unavailable: ${blocking.join(', ')}.`
      : report.preflight.episode334?.status !== 'pass'
        ? 'Episode 334 API row could not be read; no mutation or synthetic fixture was attempted.'
        : 'A reversible verifier control/prepared completed browser job was not available within the bounded harness run.';
    for (const [name] of SCENARIOS) {
      if (report.scenarios[name].status === 'not-evaluated' || report.scenarios[name].status === 'unsupported' && report.scenarios[name].reason === 'not evaluated yet') {
        report.scenarios[name] = unsupported(reason);
      }
    }
    report.status = Object.values(report.scenarios).some((result) => result.status === 'failed') ? 'failed' : 'bounded';
  } catch (error) {
    report.status = 'failed';
    report.error = error instanceof Error ? error.message : String(error);
  } finally {
    try {
      if (context) await context.close();
      if (browser) await browser.close();
      const after = listFiles(options.mediaDestination);
      const before = report.preflight.mediaDestination?.before || [];
      report.cleanup = JSON.stringify(before) === JSON.stringify(after)
        ? pass({ reason: 'No media destination mutation was left behind.', before, after })
        : fail('Media destination changed during validation; manual restoration is required.', { before, after, snapshot });
    } catch (error) {
      report.cleanup = fail(`Cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    report.finishedAt = now();
    writeReport(report, options.reportDir);
  }
  console.log(JSON.stringify({ status: report.status, reportDir: options.reportDir, scenarios: report.scenarios, cleanup: report.cleanup }, null, 2));
  return report.status === 'failed' || report.cleanup.status === 'failed' ? 1 : 0;
};

main().then((code) => process.exitCode = code).catch((error) => { console.error(error.message); process.exitCode = 1; });
