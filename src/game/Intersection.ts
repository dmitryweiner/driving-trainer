import type { Vec2 } from './Car';
import type { OBB } from './Collision';
import type { Dir, LaneCount, NpcSpec, Turn } from './types';

export type { LaneCount };

/** Ширина полосы. Шире реальной, чтобы машине (радиус манёвра ~3.5 м)
 * хватало места на повороты в перекрёстке. */
export const LANE_W = 4.5;
/** Стоп-линия — за метр до конфликтной зоны. */
export const STOP_LINE_OFFSET = 1;
/** Длина подъездной дороги от края зоны. */
export const ROAD_LEN = 40;
/** Спавн игрока/NPC-путей — от края зоны. */
export const SPAWN_DIST = 20;
/** Выезд засчитывается за этим расстоянием от края зоны. */
export const EXIT_THRESHOLD = 12;

export interface Rect {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export function rectToOBB(r: Rect): OBB {
  return {
    cx: (r.xMin + r.xMax) / 2,
    cy: (r.yMin + r.yMax) / 2,
    hx: (r.xMax - r.xMin) / 2,
    hy: (r.yMax - r.yMin) / 2,
    angle: 0,
  };
}

export interface IntersectionSpec {
  approaches: Dir[];
  lanes?: Partial<Record<Dir, LaneCount>>;
  roundabout?: boolean;
}

interface PathOpts {
  fromLane?: number;
  toLane?: number;
}

const OPPOSITE: Record<Dir, Dir> = { N: 'S', S: 'N', E: 'W', W: 'E' };
const LEFT_OF: Record<Dir, Dir> = { S: 'W', W: 'N', N: 'E', E: 'S' };

/** Курс движения к центру для каждого подъезда. */
export const APPROACH_HEADING: Record<Dir, number> = {
  S: -Math.PI / 2,
  N: Math.PI / 2,
  W: 0,
  E: Math.PI,
};

/** Радиус скругления углов тротуара на перекрёстке. */
const CURB_PAD = 1.5;

const ROUNDABOUT_HALF = 2.5 * LANE_W;
const ISLAND_R = 1.2 * LANE_W;
const RING_R = 1.8 * LANE_W;

function dirVec(heading: number): Vec2 {
  return { x: Math.cos(heading), y: Math.sin(heading) };
}

/** Правый перпендикуляр (canvas-координаты, y вниз). */
function rightOf(v: Vec2): Vec2 {
  return { x: -v.y, y: v.x };
}

/** Пересечение прямых p+t·d и q+s·e. */
function lineIntersect(p: Vec2, d: Vec2, q: Vec2, e: Vec2): Vec2 {
  const denom = d.x * e.y - d.y * e.x;
  const t = ((q.x - p.x) * e.y - (q.y - p.y) * e.x) / denom;
  return { x: p.x + d.x * t, y: p.y + d.y * t };
}

export class Intersection {
  readonly approaches: Dir[];
  readonly lanes: Record<Dir, LaneCount>;
  readonly roundabout: boolean;
  readonly box: Rect;
  readonly islandRadius: number;

  constructor(spec: IntersectionSpec) {
    this.approaches = spec.approaches;
    const lanes: Record<Dir, LaneCount> = {
      N: { in: 1, out: 1 },
      E: { in: 1, out: 1 },
      S: { in: 1, out: 1 },
      W: { in: 1, out: 1 },
    };
    for (const d of ['N', 'E', 'S', 'W'] as const) {
      const l = spec.lanes?.[d];
      if (l) lanes[d] = l;
      if (!this.approaches.includes(d)) lanes[d] = { in: 0, out: 0 };
    }
    this.lanes = lanes;
    this.roundabout = spec.roundabout ?? false;
    this.islandRadius = this.roundabout ? ISLAND_R : 0;
    this.box = this.roundabout
      ? { xMin: -ROUNDABOUT_HALF, xMax: ROUNDABOUT_HALF, yMin: -ROUNDABOUT_HALF, yMax: ROUNDABOUT_HALF }
      : {
          xMin: -LANE_W * Math.max(lanes.S.out, lanes.N.in, 1),
          xMax: LANE_W * Math.max(lanes.S.in, lanes.N.out, 1),
          yMin: -LANE_W * Math.max(lanes.E.in, lanes.W.out, 1),
          yMax: LANE_W * Math.max(lanes.W.in, lanes.E.out, 1),
        };
  }

  /** Центр входной полосы (координата поперёк дороги подъезда). */
  private inLaneCoord(d: Dir, lane: number): number {
    const n = this.lanes[d].in;
    switch (d) {
      case 'S': return LANE_W * (n - 0.5 - lane);
      case 'N': return -LANE_W * (n - 0.5 - lane);
      case 'W': return LANE_W * (n - 0.5 - lane);
      case 'E': return -LANE_W * (n - 0.5 - lane);
    }
  }

  /** Центр выездной полосы на стороне d (0 — правая по ходу выезда). */
  private outLaneCoord(d: Dir, lane: number): number {
    const n = this.lanes[d].out;
    switch (d) {
      case 'N': return LANE_W * (n - 0.5 - lane);
      case 'S': return -LANE_W * (n - 0.5 - lane);
      case 'E': return LANE_W * (n - 0.5 - lane);
      case 'W': return -LANE_W * (n - 0.5 - lane);
    }
  }

  /** Координата края зоны со стороны d. */
  private boxEdge(d: Dir): number {
    switch (d) {
      case 'S': return this.box.yMax;
      case 'N': return this.box.yMin;
      case 'E': return this.box.xMax;
      case 'W': return this.box.xMin;
    }
  }

  spawnPoint(approach: Dir, lane = 0): { x: number; y: number; heading: number } {
    const lat = this.inLaneCoord(approach, lane);
    const edge = Math.abs(this.boxEdge(approach)) + SPAWN_DIST;
    const heading = APPROACH_HEADING[approach];
    switch (approach) {
      case 'S': return { x: lat, y: edge, heading };
      case 'N': return { x: lat, y: -edge, heading };
      case 'W': return { x: -edge, y: lat, heading };
      case 'E': return { x: edge, y: lat, heading };
    }
  }

  /** Расстояние до стоп-линии подъезда: > 0 — ещё не доехал. */
  distanceToStopLine(approach: Dir, p: Vec2): number {
    const edge = Math.abs(this.boxEdge(approach)) + STOP_LINE_OFFSET;
    switch (approach) {
      case 'S': return p.y - edge;
      case 'N': return -p.y - edge;
      case 'W': return -p.x - edge;
      case 'E': return p.x - edge;
    }
  }

  exitSide(approach: Dir, turn: Turn): Dir {
    if (turn === 'straight') return OPPOSITE[approach];
    if (turn === 'left') return LEFT_OF[approach];
    if (turn === 'uturn') return approach;
    return OPPOSITE[LEFT_OF[approach]];
  }

  /** Точка на границе зоны для входа с подъезда. */
  private entryPoint(approach: Dir, lane: number): Vec2 {
    const lat = this.inLaneCoord(approach, lane);
    switch (approach) {
      case 'S': return { x: lat, y: this.box.yMax };
      case 'N': return { x: lat, y: this.box.yMin };
      case 'W': return { x: this.box.xMin, y: lat };
      case 'E': return { x: this.box.xMax, y: lat };
    }
  }

  /** Точка на границе зоны при выезде на сторону side. */
  private exitPoint(side: Dir, lane: number): Vec2 {
    const lat = this.outLaneCoord(side, lane);
    switch (side) {
      case 'N': return { x: lat, y: this.box.yMin };
      case 'S': return { x: lat, y: this.box.yMax };
      case 'E': return { x: this.box.xMax, y: lat };
      case 'W': return { x: this.box.xMin, y: lat };
    }
  }

  private exitFarPoint(side: Dir, lane: number): Vec2 {
    const p = this.exitPoint(side, lane);
    const d = EXIT_THRESHOLD + 6;
    switch (side) {
      case 'N': return { x: p.x, y: p.y - d };
      case 'S': return { x: p.x, y: p.y + d };
      case 'E': return { x: p.x + d, y: p.y };
      case 'W': return { x: p.x - d, y: p.y };
    }
  }

  /** Полилиния проезда: спавн → стоп-линия → дуга через зону → выезд. */
  path(approach: Dir, turn: Turn, opts: PathOpts = {}): Vec2[] {
    const fromLane = opts.fromLane ?? 0;
    const toLane = opts.toLane ?? 0;
    const side = this.exitSide(approach, turn);
    if (this.roundabout) return this.ringPath(approach, side, fromLane, toLane);
    if (turn === 'uturn') return this.uturnPath(approach, fromLane, toLane);
    const spawn = this.spawnPoint(approach, fromLane);
    const a = this.entryPoint(approach, fromLane);
    const b = this.exitPoint(side, toLane);
    const out = this.exitFarPoint(side, toLane);
    if (turn === 'straight') {
      return [{ x: spawn.x, y: spawn.y }, a, b, out];
    }
    // повороты — дуга окружности, касательная к оси входной и выходной полос
    // (радиус не меньше физического радиуса манёвра машины)
    const R = turn === 'right' ? 4.5 : 5.5;
    const f = dirVec(APPROACH_HEADING[approach]); // к центру
    const oHeading = APPROACH_HEADING[OPPOSITE[side]]; // наружу от центра
    const o = dirVec(oHeading);
    const rA = rightOf(f);
    const rD = rightOf(o);
    const sgn = turn === 'right' ? 1 : -1;
    // центр дуги — на пересечении двух смещённых на R осей
    const c = lineIntersect(
      { x: a.x + rA.x * R * sgn, y: a.y + rA.y * R * sgn },
      f,
      { x: b.x + rD.x * R * sgn, y: b.y + rD.y * R * sgn },
      o,
    );
    const tA: Vec2 = { x: c.x - rA.x * R * sgn, y: c.y - rA.y * R * sgn };
    const tD: Vec2 = { x: c.x - rD.x * R * sgn, y: c.y - rD.y * R * sgn };
    const pts: Vec2[] = [{ x: spawn.x, y: spawn.y }, tA];
    const a0 = Math.atan2(tA.y - c.y, tA.x - c.x);
    let a1 = Math.atan2(tD.y - c.y, tD.x - c.x);
    // поворот на четверть круга в сторону манёвра
    if (sgn > 0) while (a1 < a0) a1 += 2 * Math.PI;
    else while (a1 > a0) a1 -= 2 * Math.PI;
    for (let i = 1; i <= 8; i++) {
      const phi = a0 + ((a1 - a0) * i) / 8;
      pts.push({ x: c.x + R * Math.cos(phi), y: c.y + R * Math.sin(phi) });
    }
    pts.push(b, out);
    return pts;
  }

  /** Разворот: заезд вглубь перекрёстка и эллиптическая петля назад.
   * Реализован для подъезда игрока с юга (авторские задачи так и строятся). */
  private uturnPath(approach: Dir, fromLane: number, toLane: number): Vec2[] {
    if (approach !== 'S') {
      throw new Error('uturn поддержан только для подъезда S');
    }
    const spawn = this.spawnPoint(approach, fromLane);
    const startX = this.inLaneCoord('S', fromLane);
    const targetX = this.outLaneCoord('S', toLane);
    // дуга смещена внутрь от полос на 1.05 м, чтобы углы кузова не выходили
    // за пределы полотна при вращении у краёв
    const arcStartX = startX - 1.05;
    const arcEndX = targetX + 1.05;
    const rx = Math.abs(arcStartX - arcEndX) / 2;
    const cx = (arcStartX + arcEndX) / 2;
    // вертикальный полурадиус: кривизна на входе в петлю (ry²/rx) не должна
    // опускаться ниже радиуса манёвра машины
    const ry = Math.max(4.0, Math.sqrt(3.9 * rx));
    const baseY = this.box.yMin + 2.5;
    const pts: Vec2[] = [
      { x: spawn.x, y: spawn.y },
      { x: startX, y: this.box.yMax + 4 },
      { x: arcStartX, y: baseY },
    ];
    for (let i = 1; i < 12; i++) {
      const phi = (Math.PI * i) / 12;
      pts.push({ x: cx + rx * Math.cos(phi), y: baseY - ry * Math.sin(phi) });
    }
    pts.push({ x: arcEndX, y: baseY });
    pts.push({ x: targetX, y: this.box.yMax + 4 });
    pts.push({ x: targetX, y: this.box.yMax + EXIT_THRESHOLD + 6 });
    return pts;
  }

  /** Угол сектора кольца, ближайшего к стороне (canvas-координаты). */
  private static sideAngle(d: Dir): number {
    switch (d) {
      case 'S': return Math.PI / 2;
      case 'E': return 0;
      case 'N': return -Math.PI / 2;
      case 'W': return Math.PI; // разворачивается через unwrap
    }
  }

  private ringPath(approach: Dir, side: Dir, fromLane: number, toLane: number): Vec2[] {
    const spawn = this.spawnPoint(approach, fromLane);
    const a = this.entryPoint(approach, fromLane);
    // движение по кольцу — угол монотонно убывает (против часовой в мире)
    const phiIn = Intersection.sideAngle(approach) - 0.28;
    let phiOut = Intersection.sideAngle(side) + 0.28;
    while (phiOut >= phiIn) phiOut -= 2 * Math.PI;
    const pts: Vec2[] = [{ x: spawn.x, y: spawn.y }, a];
    const steps = Math.max(4, Math.ceil((phiIn - phiOut) / 0.18));
    for (let i = 0; i <= steps; i++) {
      const phi = phiIn + (phiOut - phiIn) * (i / steps);
      pts.push({ x: RING_R * Math.cos(phi), y: RING_R * Math.sin(phi) });
    }
    pts.push(this.exitPoint(side, toLane));
    pts.push(this.exitFarPoint(side, toLane));
    return pts;
  }

  /** Полный путь NPC (в т.ч. стартующего на кольце). */
  npcPath(spec: NpcSpec): Vec2[] {
    if (spec.ring) {
      const phiIn = (spec.ring.fromAngleDeg * Math.PI) / 180;
      let phiOut = Intersection.sideAngle(spec.ring.toSide) + 0.28;
      while (phiOut >= phiIn) phiOut -= 2 * Math.PI;
      const pts: Vec2[] = [];
      const steps = Math.max(4, Math.ceil((phiIn - phiOut) / 0.18));
      for (let i = 0; i <= steps; i++) {
        const phi = phiIn + (phiOut - phiIn) * (i / steps);
        pts.push({ x: RING_R * Math.cos(phi), y: RING_R * Math.sin(phi) });
      }
      pts.push(this.exitPoint(spec.ring.toSide, 0));
      pts.push(this.exitFarPoint(spec.ring.toSide, 0));
      return pts;
    }
    return this.path(spec.approach, spec.turn);
  }

  npcStopLineDist(spec: NpcSpec, pos: Vec2): number {
    if (spec.ring) return -1; // уже на кольце — стоп-линий нет
    return this.distanceToStopLine(spec.approach, pos);
  }

  get conflict(): Rect {
    return this.box;
  }

  /** Ширина дорожного полотна стороны d (поперёк направления). */
  private roadBand(d: Dir): { min: number; max: number } | null {
    if (!this.approaches.includes(d)) return null;
    const l = this.lanes[d];
    if (this.roundabout) return { min: -LANE_W, max: LANE_W };
    switch (d) {
      case 'S': return { min: -l.out * LANE_W, max: l.in * LANE_W };
      case 'N': return { min: -l.in * LANE_W, max: l.out * LANE_W };
      case 'W': return { min: -l.out * LANE_W, max: l.in * LANE_W };
      case 'E': return { min: -l.in * LANE_W, max: l.out * LANE_W };
    }
  }

  /** Прямоугольник дорожного полотна стороны d (для отрисовки). */
  roadRect(d: Dir): Rect | null {
    const band = this.roadBand(d);
    if (!band) return null;
    const b = this.box;
    switch (d) {
      case 'S': return { xMin: band.min, xMax: band.max, yMin: b.yMax, yMax: b.yMax + ROAD_LEN };
      case 'N': return { xMin: band.min, xMax: band.max, yMin: b.yMin - ROAD_LEN, yMax: b.yMin };
      case 'W': return { xMin: b.xMin - ROAD_LEN, xMax: b.xMin, yMin: band.min, yMax: band.max };
      case 'E': return { xMin: b.xMax, xMax: b.xMax + ROAD_LEN, yMin: band.min, yMax: band.max };
    }
  }

  isOnRoad(p: Vec2): boolean {
    const b = this.box;
    if (p.x >= b.xMin && p.x <= b.xMax && p.y >= b.yMin && p.y <= b.yMax) {
      if (this.roundabout && Math.hypot(p.x, p.y) < this.islandRadius) return false;
      return true;
    }
    // скруглённые углы тротуаров: небольшие «подушки» у углов зоны
    for (const cx of [b.xMin, b.xMax]) {
      for (const cy of [b.yMin, b.yMax]) {
        if (Math.hypot(p.x - cx, p.y - cy) <= CURB_PAD) return true;
      }
    }
    for (const d of this.approaches) {
      const band = this.roadBand(d);
      if (!band) continue;
      switch (d) {
        case 'S':
          if (p.y >= b.yMax && p.y <= b.yMax + ROAD_LEN && p.x >= band.min && p.x <= band.max) return true;
          break;
        case 'N':
          if (p.y <= b.yMin && p.y >= b.yMin - ROAD_LEN && p.x >= band.min && p.x <= band.max) return true;
          break;
        case 'W':
          if (p.x <= b.xMin && p.x >= b.xMin - ROAD_LEN && p.y >= band.min && p.y <= band.max) return true;
          break;
        case 'E':
          if (p.x >= b.xMax && p.x <= b.xMax + ROAD_LEN && p.y >= band.min && p.y <= band.max) return true;
          break;
      }
    }
    return false;
  }

  /** Если точка дальше порога выезда на дороге стороны — эта сторона. */
  exitedVia(p: Vec2): Dir | null {
    const b = this.box;
    for (const d of this.approaches) {
      const band = this.roadBand(d);
      if (!band) continue;
      switch (d) {
        case 'N':
          if (p.y < b.yMin - EXIT_THRESHOLD && p.x >= band.min && p.x <= band.max) return 'N';
          break;
        case 'S':
          if (p.y > b.yMax + EXIT_THRESHOLD && p.x >= band.min && p.x <= band.max) return 'S';
          break;
        case 'E':
          if (p.x > b.xMax + EXIT_THRESHOLD && p.y >= band.min && p.y <= band.max) return 'E';
          break;
        case 'W':
          if (p.x < b.xMin - EXIT_THRESHOLD && p.y >= band.min && p.y <= band.max) return 'W';
          break;
      }
    }
    return null;
  }

  /** Номер входной полосы подъезда, в которой лежит точка (0 — правая). */
  laneIndexAt(approach: Dir, p: Vec2): number | null {
    const n = this.lanes[approach].in;
    let coord: number;
    switch (approach) {
      case 'S': coord = p.x; break;
      case 'N': coord = -p.x; break;
      case 'W': coord = p.y; break;
      case 'E': coord = -p.y; break;
    }
    const i = Math.round(n - 0.5 - coord / LANE_W);
    return i >= 0 && i < n ? i : null;
  }

  /** Номер выездной полосы стороны side по точке. */
  exitLaneIndexAt(side: Dir, p: Vec2): number | null {
    const n = this.lanes[side].out;
    let coord: number;
    switch (side) {
      case 'N': coord = p.x; break;
      case 'S': coord = -p.x; break;
      case 'E': coord = p.y; break;
      case 'W': coord = -p.y; break;
    }
    const i = Math.round(n - 0.5 - coord / LANE_W);
    return i >= 0 && i < n ? i : null;
  }
}
