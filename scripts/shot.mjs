#!/usr/bin/env node
// Скриншоты игры в headless-Chromium — для визуальной проверки сцен.
//
//   node scripts/shot.mjs                    # текущая случайная задача
//   node scripts/shot.mjs 0700 0664          # конкретные задачи (?task=)
//   node scripts/shot.mjs 0700 --drive 3     # + подержать газ 3 с и снять второй кадр
//   node scripts/shot.mjs 0184 --finish      # ехать вперёд до оверлея результата
//   node scripts/shot.mjs 0184 --mobile      # мобильный вьюпорт с кнопками
//   node scripts/shot.mjs 0700 --wait 5      # подождать перед кадром (default 1)
//
// Кадры пишутся в ./shots/<id>[-after|-result].png. Dev-сервер поднимается
// сам (и гасится), если на :5173 ещё ничего не слушает.

import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const VALUE_FLAGS = new Set(['drive', 'wait', 'out']);
const flags = new Map();
const ids = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a.startsWith('--')) {
    const name = a.slice(2);
    flags.set(name, VALUE_FLAGS.has(name) ? args[++i] : 'true');
  } else {
    ids.push(a);
  }
}
const driveSec = Number(flags.get('drive') ?? 0);
const waitSec = Number(flags.get('wait') ?? 1);
const finish = flags.has('finish');
const mobile = flags.has('mobile');
const outDir = flags.get('out') ?? 'shots';

const PORT = 5173;
const BASE = `http://localhost:${PORT}`;

async function serverUp() {
  try {
    const res = await fetch(BASE);
    return res.ok;
  } catch {
    return false;
  }
}

let devProc = null;
if (!(await serverUp())) {
  devProc = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
    stdio: 'ignore',
    detached: false,
  });
  for (let i = 0; i < 30 && !(await serverUp()); i++) {
    await new Promise((r) => setTimeout(r, 1000));
  }
  if (!(await serverUp())) {
    console.error(`dev-сервер не поднялся на :${PORT}`);
    process.exit(1);
  }
}

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage(
  mobile
    ? { viewport: { width: 420, height: 850 }, hasTouch: true, isMobile: true }
    : { viewport: { width: 1280, height: 800 } },
);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});

for (const id of ids.length ? ids : ['current']) {
  const url = id === 'current' ? BASE : `${BASE}/?task=${id}`;
  await page.goto(url);
  await page.waitForSelector('#instruction');
  await page.waitForTimeout(waitSec * 1000);
  await page.screenshot({ path: `${outDir}/${id}.png` });
  console.log(`${outDir}/${id}.png`);

  if (driveSec > 0) {
    await page.keyboard.down('w');
    await page.waitForTimeout(driveSec * 1000);
    await page.keyboard.up('w');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${outDir}/${id}-after.png` });
    console.log(`${outDir}/${id}-after.png`);
  }

  if (finish) {
    await page.keyboard.down('w');
    await page
      .waitForSelector('#result-overlay:not([hidden])', { timeout: 30000 })
      .catch(() => console.error(`${id}: оверлей результата не появился за 30 с`));
    await page.keyboard.up('w');
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${outDir}/${id}-result.png` });
    console.log(`${outDir}/${id}-result.png`);
  }
}

console.log('console/page errors:', errors.length ? errors : 'none');
await browser.close();
devProc?.kill();
