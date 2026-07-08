import type { Vec2 } from './Car';
import { obbIntersect, type OBB } from './Collision';
import { rectToOBB, type Rect } from './Intersection';
import type { NpcSpec, VehicleKind } from './types';

/** NPC появляется за столько метров до своей стоп-линии. */
export const NPC_APPROACH_DIST = 6;

const SPEED: Record<VehicleKind, number> = {
  car: 7,
  truck: 5,
  bus: 5.5,
  tractor: 4,
  motorcycle: 7,
  bicycle: 3.5,
};

export const NPC_SIZE: Record<VehicleKind, { length: number; width: number }> = {
  car: { length: 4, width: 2 },
  truck: { length: 6.5, width: 2.4 },
  bus: { length: 8, width: 2.4 },
  tractor: { length: 3.8, width: 2 },
  motorcycle: { length: 2.2, width: 0.9 },
  bicycle: { length: 1.8, width: 0.7 },
};

/** Геометрия, в которой живут NPC (перекрёсток или прямой участок). */
export interface NpcGeom {
  npcPath(spec: NpcSpec): Vec2[];
  /** Расстояние до стоп-линии NPC (>0 — до линии; <0 — уже проехал). */
  npcStopLineDist(spec: NpcSpec, pos: Vec2): number;
  /** Конфликтная зона (перекрёсток/сужение); null — зоны нет. */
  readonly conflict: Rect | null;
  /** false — NPC стартует в начале пути, без подрезки к стоп-линии
   * (встречные на прямом участке). */
  readonly trimApproach?: boolean;
}

export class NpcAgent {
  readonly spec: NpcSpec;
  readonly path: Vec2[];
  pos: Vec2;
  heading: number;
  speed = 0;
  /** Пройденная длина вдоль пути. */
  private s = 0;
  private readonly segLen: number[];
  private readonly totalLen: number;
  private readonly geom: NpcGeom;
  entered = false;
  cleared = false;
  done = false;

  constructor(spec: NpcSpec, geom: NpcGeom) {
    this.spec = spec;
    this.geom = geom;
    const full = geom.npcPath(spec);
    // обрезаем путь так, чтобы старт был в NPC_APPROACH_DIST до стоп-линии
    this.path =
      geom.trimApproach === false
        ? full
        : NpcAgent.trimToApproach(full, (p) => geom.npcStopLineDist(spec, p));
    this.segLen = [];
    let total = 0;
    for (let i = 1; i < this.path.length; i++) {
      const l = Math.hypot(this.path[i].x - this.path[i - 1].x, this.path[i].y - this.path[i - 1].y);
      this.segLen.push(l);
      total += l;
    }
    this.totalLen = total;
    this.pos = { ...this.path[0] };
    this.heading = Math.atan2(this.path[1].y - this.path[0].y, this.path[1].x - this.path[0].x);
  }

  private static trimToApproach(path: Vec2[], distFn: (p: Vec2) => number): Vec2[] {
    if (distFn(path[0]) <= NPC_APPROACH_DIST) return path;
    // идём вдоль пути, пока не окажемся на нужной дистанции до стоп-линии
    const out: Vec2[] = [];
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i];
      const b = path[i + 1];
      const da = distFn(a);
      const db = distFn(b);
      if (da > NPC_APPROACH_DIST && db <= NPC_APPROACH_DIST) {
        const t = (da - NPC_APPROACH_DIST) / (da - db);
        out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
        out.push(...path.slice(i + 1));
        return out;
      }
    }
    return path;
  }

  get maxSpeed(): number {
    return SPEED[this.spec.kind];
  }

  get size(): { length: number; width: number } {
    return NPC_SIZE[this.spec.kind];
  }

  getOBB(): OBB {
    const { length, width } = this.size;
    return { cx: this.pos.x, cy: this.pos.y, hx: length / 2, hy: width / 2, angle: this.heading };
  }

  /** mayGo — очередь дошла (все с меньшим порядком очистили зону). */
  update(dt: number, mayGo: boolean): void {
    if (this.done) return;
    let target = this.maxSpeed;
    if (!mayGo && !this.entered) {
      // тормозим так, чтобы у линии остановился бампер, а не центр
      const d = this.geom.npcStopLineDist(this.spec, this.pos) - this.size.length / 2;
      if (d >= 0) {
        target = d < 0.4 ? 0 : this.maxSpeed * Math.min(1, d / 8);
      }
    }
    this.speed = target;
    this.s += this.speed * dt;
    if (this.s >= this.totalLen) {
      this.s = this.totalLen;
      this.done = true;
      this.cleared = true;
    }
    this.advanceTo(this.s);

    const zone = this.geom.conflict;
    if (zone) {
      const inZone = obbIntersect(this.getOBB(), rectToOBB(zone));
      if (inZone) this.entered = true;
      else if (this.entered) this.cleared = true;
    }
  }

  private advanceTo(s: number): void {
    let acc = 0;
    for (let i = 0; i < this.segLen.length; i++) {
      const l = this.segLen[i];
      if (acc + l >= s || i === this.segLen.length - 1) {
        const t = l > 0 ? Math.min(1, (s - acc) / l) : 0;
        const a = this.path[i];
        const b = this.path[i + 1];
        this.pos = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
        if (l > 0.01) this.heading = Math.atan2(b.y - a.y, b.x - a.x);
        return;
      }
      acc += l;
    }
  }
}

/** Пешеход, курсирующий по зебре туда-обратно. */
export class PedAgent {
  pos: Vec2;
  readonly radius = 0.4;
  private from: Vec2;
  private to: Vec2;
  private readonly roadMin: number;
  private readonly roadMax: number;
  private readonly axis: 'x' | 'y';
  private delay: number;
  private t = 0;
  private waitLeft = 0;
  private static readonly WALK_SPEED = 1.2;
  /** Пауза на тротуаре перед обратным переходом. */
  private static readonly PAUSE = 3.4;

  /** Идёт от from к to; на проезжей части, пока координата axis в
   * [roadMin, roadMax]. Дойдя, выжидает паузу и идёт обратно — переход
   * «живёт», и окно для проезда приходится выбирать. */
  constructor(opts: { from: Vec2; to: Vec2; axis: 'x' | 'y'; roadMin: number; roadMax: number; delay?: number }) {
    this.from = opts.from;
    this.to = opts.to;
    this.pos = { ...opts.from };
    this.axis = opts.axis;
    this.roadMin = opts.roadMin;
    this.roadMax = opts.roadMax;
    this.delay = opts.delay ?? 0;
  }

  get onRoad(): boolean {
    const c = this.axis === 'x' ? this.pos.x : this.pos.y;
    return c >= this.roadMin && c <= this.roadMax;
  }

  update(dt: number): void {
    if (this.delay > 0) {
      this.delay -= dt;
      return;
    }
    if (this.waitLeft > 0) {
      this.waitLeft -= dt;
      if (this.waitLeft <= 0) {
        [this.from, this.to] = [this.to, this.from];
        this.t = 0;
      }
      return;
    }
    const total = Math.hypot(this.to.x - this.from.x, this.to.y - this.from.y);
    this.t += (PedAgent.WALK_SPEED * dt) / total;
    if (this.t >= 1) {
      this.t = 1;
      this.waitLeft = PedAgent.PAUSE;
    }
    this.pos = {
      x: this.from.x + (this.to.x - this.from.x) * this.t,
      y: this.from.y + (this.to.y - this.from.y) * this.t,
    };
  }
}
