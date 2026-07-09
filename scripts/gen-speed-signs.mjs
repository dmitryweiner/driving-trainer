// Перегенерация знаков ограничения скорости 426-30/40 и 427-30/40 из
// базовых 426.png / 427.png: стираем исходное число, рисуем новое строго
// по центру круга (по вертикали — через TextMetrics).
import { readFileSync, writeFileSync } from 'node:fs';

import { chromium } from 'playwright';

const SIGNS_DIR = new URL('../public/signs/', import.meta.url).pathname;

const browser = await chromium.launch();
const page = await browser.newPage();

const results = await page.evaluate(async ({ base426, base427 }) => {
  const load = (dataUrl) =>
    new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = dataUrl;
    });

  const img426 = await load(base426);
  const img427 = await load(base427);

  // геометрия круга: bbox «цветных» пикселей (кольцо знака)
  const circleGeom = (img, isRing) => {
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        const i = (y * c.width + x) * 4;
        if (d[i + 3] > 100 && isRing(d[i], d[i + 1], d[i + 2])) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, r: (x1 - x0 + (y1 - y0)) / 4 };
  };

  const isRed = (r, g, b) => r > 140 && g < 110 && b < 110;
  const isDark = (r, g, b) => r < 100 && g < 100 && b < 100;

  const g426 = circleGeom(img426, isRed);
  const g427 = circleGeom(img427, isDark);

  const make = (img, g, value, kind) => {
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    // толщина кольца 426 ≈ 0.22R (красная кайма), у 427 ободок тонкий
    const innerR = kind === 'limit' ? g.r * 0.72 : g.r * 0.86;
    ctx.save();
    ctx.beginPath();
    ctx.arc(g.cx, g.cy, innerR, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
    // число: жирный гротеск, центр по горизонтали и вертикали
    ctx.fillStyle = kind === 'limit' ? '#111111' : '#3c3c3c';
    ctx.font = `bold ${Math.round(innerR * 1.15)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    const m = ctx.measureText(String(value));
    const yMid = g.cy + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
    ctx.fillText(String(value), g.cx, yMid);
    if (kind === 'end') {
      // диагональ «конец ограничения»: снизу-слева вверх-направо
      ctx.strokeStyle = '#3c3c3c';
      ctx.lineWidth = Math.max(2, g.r * 0.14);
      ctx.beginPath();
      ctx.moveTo(g.cx - innerR * 0.85, g.cy + innerR * 0.85);
      ctx.lineTo(g.cx + innerR * 0.85, g.cy - innerR * 0.85);
      ctx.stroke();
    }
    ctx.restore();
    return c.toDataURL('image/png');
  };

  return {
    '426-30': make(img426, g426, 30, 'limit'),
    '426-40': make(img426, g426, 40, 'limit'),
    '427-30': make(img427, g427, 30, 'end'),
    '427-40': make(img427, g427, 40, 'end'),
    geom: { g426, g427 },
  };
}, {
  base426: `data:image/png;base64,${readFileSync(`${SIGNS_DIR}426.png`).toString('base64')}`,
  base427: `data:image/png;base64,${readFileSync(`${SIGNS_DIR}427.png`).toString('base64')}`,
});

console.log('geom:', JSON.stringify(results.geom));
for (const name of ['426-30', '426-40', '427-30', '427-40']) {
  const b64 = results[name].split(',')[1];
  writeFileSync(`${SIGNS_DIR}${name}.png`, Buffer.from(b64, 'base64'));
  console.log(`${SIGNS_DIR}${name}.png`);
}
await browser.close();
