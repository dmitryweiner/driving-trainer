import { Scenario } from './game/Scenario';
import { Session, type SessionJSON } from './game/Session';
import { taskById, tasks } from './tasks';
import { Hud } from './ui/Hud';
import { Input } from './ui/Input';
import { Renderer } from './ui/Renderer';

const STORAGE_KEY = 'driving-trainer-session-v1';

const canvasEl = document.getElementById('game');
if (!(canvasEl instanceof HTMLCanvasElement)) throw new Error('Canvas #game not found');
const canvas = canvasEl;

const renderer = new Renderer(canvas);
const input = new Input();
const hud = new Hud();

const taskIds = tasks.map((t) => t.id);
// ?task=0700 — принудительно открыть конкретную задачу (для отладки)
const forcedTaskId = new URLSearchParams(window.location.search).get('task');
const session = restoreSession();
let scenario = makeScenario();
let recorded = false;

function restoreSession(): Session {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const json: unknown = JSON.parse(raw);
      if (isSessionJSON(json)) return Session.fromJSON(taskIds, json, Math.random);
    }
  } catch {
    // повреждённое хранилище — начинаем заново
  }
  return new Session(taskIds, Math.random);
}

function isSessionJSON(x: unknown): x is SessionJSON {
  return (
    typeof x === 'object' &&
    x !== null &&
    'passed' in x &&
    'failed' in x &&
    'queue' in x &&
    'pos' in x
  );
}

function saveSession(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session.toJSON()));
  } catch {
    // приватный режим и т.п. — просто не сохраняем
  }
}

function makeScenario(): Scenario {
  const id = forcedTaskId ?? session.current();
  const task = taskById.get(id);
  if (!task) throw new Error(`Задача ${id} не найдена`);
  return new Scenario(task);
}

function isMobile(): boolean {
  if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return true;
  const hasTouch = 'ontouchstart' in window || (navigator.maxTouchPoints ?? 0) > 0;
  const smallerSide = Math.min(window.innerWidth, window.innerHeight);
  return hasTouch && smallerSide < 800;
}

// сброс накопленной статистики (✓/✗/%) — очередь задач не трогаем
document.getElementById('btn-reset-stats')?.addEventListener('click', () => {
  if (!window.confirm('Сбросить результаты?')) return;
  session.resetStats();
  saveSession();
});

renderer.resize();
if (isMobile()) {
  document.body.classList.add('is-mobile');
  renderer.setZoom(1.4);
}
const handleResize = (): void => renderer.resize();
window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', handleResize);
window.visualViewport?.addEventListener('resize', handleResize);
window.visualViewport?.addEventListener('scroll', handleResize);

canvas.addEventListener(
  'wheel',
  (e: WheelEvent) => {
    e.preventDefault();
    renderer.zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12);
  },
  { passive: false },
);

let pinchInitialDist = 0;
let pinchInitialZoom = 1;
canvas.addEventListener(
  'touchstart',
  (e: TouchEvent) => {
    if (e.touches.length >= 2) {
      pinchInitialDist = touchDistance(e.touches[0], e.touches[1]);
      pinchInitialZoom = renderer.getZoom();
      e.preventDefault();
    }
  },
  { passive: false },
);
canvas.addEventListener(
  'touchmove',
  (e: TouchEvent) => {
    if (e.touches.length >= 2 && pinchInitialDist > 0) {
      renderer.setZoom(pinchInitialZoom * (touchDistance(e.touches[0], e.touches[1]) / pinchInitialDist));
      e.preventDefault();
    }
  },
  { passive: false },
);
const endPinch = (e: TouchEvent): void => {
  if (e.touches.length < 2) pinchInitialDist = 0;
};
canvas.addEventListener('touchend', endPinch);
canvas.addEventListener('touchcancel', endPinch);

let last = performance.now();
function loop(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (input.consumeRetry()) {
    scenario = makeScenario();
    recorded = false;
  }
  if (input.consumeNext() && scenario.state.kind !== 'driving') {
    session.advance();
    saveSession();
    scenario = makeScenario();
    recorded = false;
  }

  // пока открыт билет — симуляция (и таймер) стоит
  if (!hud.isTicketOpen) scenario.update(dt, input.read());

  if (scenario.state.kind !== 'driving' && !recorded) {
    recorded = true;
    session.record(scenario.state.kind === 'passed');
    saveSession();
  }

  renderer.render(scenario);
  hud.update(scenario, session.stats);

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function touchDistance(a: Touch, b: Touch): number {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}
