import type { CarInput, Vec2 } from '../../src/game/Car';
import type { Scenario } from '../../src/game/Scenario';
import type { LightState } from '../../src/game/types';

const FORBIDDEN: LightState[] = ['red', 'red-yellow', 'yellow', 'red-flashing'];
const CRUISE = 8;
const TURN_SPEED = 2.8;
const BRAKE_DECEL = 8;

/** «Идеальный водитель»: ведёт машину по эталонному пути, соблюдая
 * светофоры, стоп-знаки, приоритеты и пешеходов. Используется тестом
 * разрешимости всех авторских задач. */
export class Autopilot {
  private didStop = false;
  private readonly needsStop: boolean;
  /** Прогресс вдоль пути (длина дуги). */
  private s = 0;
  private readonly cum: number[];

  constructor(private readonly sc: Scenario) {
    const scene = sc.task.scene;
    const stopSign = (scene.signs ?? []).some(
      (s) => s.type === 'stop' && s.approach === scene.player.approach,
    );
    const railway = (scene.zones ?? []).some((z) => z.type === 'railway') && scene.light !== undefined;
    this.needsStop = stopSign || railway;
    this.cum = [0];
    const path = sc.playerPath;
    for (let i = 1; i < path.length; i++) {
      this.cum.push(this.cum[i - 1] + dist(path[i - 1], path[i]));
    }
  }

  /** Точка на пути на дуговой дистанции s. */
  private pointAt(s: number): Vec2 {
    const path = this.sc.playerPath;
    const cl = Math.max(0, Math.min(s, this.cum[this.cum.length - 1]));
    for (let i = 1; i < path.length; i++) {
      if (this.cum[i] >= cl) {
        const segLen = this.cum[i] - this.cum[i - 1];
        const t = segLen > 0 ? (cl - this.cum[i - 1]) / segLen : 0;
        return {
          x: path[i - 1].x + (path[i].x - path[i - 1].x) * t,
          y: path[i - 1].y + (path[i].y - path[i - 1].y) * t,
        };
      }
    }
    return path[path.length - 1];
  }

  /** Продвигает прогресс до проекции позиции машины на путь. */
  private advanceProgress(pos: Vec2): void {
    const path = this.sc.playerPath;
    let best = this.s;
    let bestD = Infinity;
    for (let i = 1; i < path.length; i++) {
      if (this.cum[i] < this.s - 1) continue;
      if (this.cum[i - 1] > this.s + 10) break;
      const a = path[i - 1];
      const b = path[i];
      const len = this.cum[i] - this.cum[i - 1];
      if (len === 0) continue;
      const t = clamp(((pos.x - a.x) * (b.x - a.x) + (pos.y - a.y) * (b.y - a.y)) / (len * len), 0, 1);
      const px = a.x + (b.x - a.x) * t;
      const py = a.y + (b.y - a.y) * t;
      const d = Math.hypot(pos.x - px, pos.y - py);
      const sHere = this.cum[i - 1] + len * t;
      if (d < bestD && sHere >= this.s - 0.5) {
        bestD = d;
        best = sHere;
      }
    }
    this.s = Math.max(this.s, best);
  }

  update(): CarInput {
    const sc = this.sc;
    const pos = sc.car.position;
    const v = sc.car.velocity;
    const heading = sc.car.heading;

    // следование пути: цель — точка на пути в lookahead метрах впереди
    this.advanceProgress(pos);
    const lookahead = Math.max(3, v * 0.55);
    const target = this.pointAt(this.s + lookahead);
    const desired = Math.atan2(target.y - pos.y, target.x - pos.x);
    // классический pure pursuit: угол передних колёс из геометрии дуги
    // (MAX_STEER машины = 0.6 рад)
    const dh = angleDiff(desired, heading);
    const ld = Math.max(lookahead, dist(target, pos));
    const steerAngle = Math.atan2(2 * sc.car.wheelBase * Math.sin(dh), ld);
    const steer = clamp(steerAngle / 0.6, -1, 1);

    // целевая скорость
    let speed = CRUISE;
    if (Math.abs(steer) > 0.45) speed = Math.min(speed, TURN_SPEED);

    // замедление заранее перед поворотом: изгиб пути в ближайших 14 м
    const hNow = Math.atan2(
      this.pointAt(this.s + 2).y - this.pointAt(this.s).y,
      this.pointAt(this.s + 2).x - this.pointAt(this.s).x,
    );
    for (let ahead = 3; ahead <= 14; ahead += 2) {
      const p1 = this.pointAt(this.s + ahead);
      const p2 = this.pointAt(this.s + ahead + 2);
      if (dist(p1, p2) < 0.5) break; // конец пути
      const hAhead = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      if (Math.abs(angleDiff(hAhead, hNow)) > 0.3) {
        speed = Math.min(speed, TURN_SPEED);
        break;
      }
    }

    // дистанция до NPC впереди по курсу (не таранить попутных);
    // стоящие у своих стоп-линий не считаются — они ждут нас
    for (const n of sc.npcs) {
      if (n.done || n.speed < 0.5) continue;
      const dx = n.pos.x - pos.x;
      const dy = n.pos.y - pos.y;
      const fwd = dx * Math.cos(heading) + dy * Math.sin(heading);
      const lat = -dx * Math.sin(heading) + dy * Math.cos(heading);
      if (fwd > 0 && fwd < 9 && Math.abs(lat) < 2.2) {
        speed = Math.min(speed, fwd < 5.5 ? 0 : n.speed * 0.9);
      }
    }

    // зоны ограничения скорости (прямой участок)
    if (sc.road) {
      for (const z of sc.road.speedZones) {
        const near = pos.y <= z.rect.yMax + 14 && pos.y >= z.rect.yMin - 2;
        if (near) speed = Math.min(speed, (z.limitKmh / 3.6) * 0.8);
      }
      // осторожность у перехода: пешеходы курсируют постоянно
      if (sc.pedestrians.length > 0 && sc.road.crosswalks.length > 0) {
        const d = pos.y - sc.road.crosswalks[0].yMax;
        if (d < 16 && d > -3) speed = Math.min(speed, 3.5);
      }
    }

    // мигающий жёлтый — медленно у перекрёстка
    const light = sc.lightState();
    const dStop = sc.distanceToStopLine();
    if (light === 'yellow-flashing' && dStop < 16 && dStop > -6) {
      speed = Math.min(speed, 4);
    }

    // причины остановиться и дистанции до точек удержания
    const holds: number[] = [];
    if (FORBIDDEN.includes(light) && Number.isFinite(dStop)) holds.push(dStop);
    if (this.needsStop && !this.didStop && Number.isFinite(dStop)) {
      holds.push(dStop);
      if (v < 0.08 && dStop >= 0 && dStop < 6) this.didStop = true;
    }
    const playerOrder = sc.task.scene.player.order;
    const blocked = sc.npcs.some((n) => n.spec.order < playerOrder && !n.cleared);
    if (blocked) {
      if (sc.road?.conflict) {
        holds.push(pos.y - (sc.road.conflict.yMax + 6));
      } else if (Number.isFinite(dStop)) {
        holds.push(dStop);
      }
    }
    if (sc.pedestrianOnCrossing()) {
      if (sc.road && sc.road.crosswalks.length > 0) {
        holds.push(pos.y - (sc.road.crosswalks[0].yMax + 1.5));
      } else if (Number.isFinite(dStop)) {
        holds.push(dStop);
      }
    }

    for (const h of holds) {
      if (h < 0.8) {
        speed = 0;
      } else {
        // остановка бампером за ~1.5 м до точки
        const room = Math.max(0, h - 1.5 - sc.car.length / 2);
        speed = Math.min(speed, Math.sqrt(2 * BRAKE_DECEL * room) * 0.7);
      }
    }

    // управление газом/тормозом
    if (v > speed + 0.2) {
      return { throttle: 0, brake: clamp((v - speed) * 0.8, 0.2, 1), steer };
    }
    if (v < speed - 0.2) {
      return { throttle: clamp((speed - v) * 0.5, 0.2, 1), brake: 0, steer };
    }
    return { throttle: 0, brake: 0, steer };
  }
}

function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function angleDiff(a: number, b: number): number {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}
