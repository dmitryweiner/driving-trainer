import type { Car } from '../game/Car';
import { LANE_W, STOP_LINE_OFFSET, type Intersection, type Rect } from '../game/Intersection';
import type { NpcAgent, PedAgent } from '../game/Npc';
import type { RoadGeom, Scenario } from '../game/Scenario';
import type { Dir, LightState, SignSpec, SignType, Turn } from '../game/types';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const MAX_DPR = 2;
/** Видимая высота мира при zoom=1, м. */
const VIEW_M = 64;

const GRASS = '#2c4034';
const ASPHALT = '#3a3f4a';
const MARK = '#e8e8e8';

export class Renderer {
  private zoom = 1;

  constructor(private readonly canvas: HTMLCanvasElement) {}

  resize(): void {
    const vv = window.visualViewport;
    const cssW = vv ? vv.width : window.innerWidth;
    const cssH = vv ? vv.height : window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    this.canvas.width = Math.max(1, Math.round(cssW * dpr));
    this.canvas.height = Math.max(1, Math.round(cssH * dpr));
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;
  }

  getZoom(): number {
    return this.zoom;
  }

  setZoom(z: number): void {
    this.zoom = clamp(z, MIN_ZOOM, MAX_ZOOM);
  }

  zoomBy(factor: number): void {
    this.setZoom(this.zoom * factor);
  }

  render(sc: Scenario): void {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = GRASS;
    ctx.fillRect(0, 0, w, h);

    const scale = (Math.min(w, h) / VIEW_M) * this.zoom;
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(scale, scale);
    ctx.translate(-sc.car.position.x, -sc.car.position.y);

    if (sc.inter) this.drawIntersection(ctx, sc, sc.inter);
    if (sc.road) this.drawRoad(ctx, sc, sc.road);

    for (const npc of sc.npcs) {
      if (!npc.done) drawNpc(ctx, npc);
    }
    for (const ped of sc.pedestrians) drawPedestrian(ctx, ped);

    const dead = sc.state.kind === 'failed';
    drawPlayerCar(ctx, sc.car, dead);

    // знаки и светофоры поверх машин
    if (sc.inter) this.drawIntersectionFurniture(ctx, sc, sc.inter);
    if (sc.road) this.drawRoadFurniture(ctx, sc, sc.road);

    ctx.restore();
  }

  // ==== перекрёсток ====

  private drawIntersection(ctx: CanvasRenderingContext2D, sc: Scenario, inter: Intersection): void {
    const b = inter.box;

    // полотно: зона + подъезды (у кольца подъезды продлеваются до круга)
    ctx.fillStyle = ASPHALT;
    const inset = inter.roundabout ? 6 : 0;
    for (const d of inter.approaches) {
      const r = inter.roadRect(d);
      if (!r) continue;
      switch (d) {
        case 'S': ctx.fillRect(r.xMin, r.yMin - inset, r.xMax - r.xMin, r.yMax - r.yMin + inset); break;
        case 'N': ctx.fillRect(r.xMin, r.yMin, r.xMax - r.xMin, r.yMax - r.yMin + inset); break;
        case 'W': ctx.fillRect(r.xMin, r.yMin, r.xMax - r.xMin + inset, r.yMax - r.yMin); break;
        case 'E': ctx.fillRect(r.xMin - inset, r.yMin, r.xMax - r.xMin + inset, r.yMax - r.yMin); break;
      }
    }

    if (inter.roundabout) {
      // круглое полотно кольца, островок и пунктир полосы движения
      ctx.beginPath();
      ctx.arc(0, 0, inter.outerRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = GRASS;
      ctx.beginPath();
      ctx.arc(0, 0, inter.islandRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = MARK;
      ctx.lineWidth = 0.25;
      ctx.stroke();
      ctx.setLineDash([1.6, 1.6]);
      ctx.beginPath();
      ctx.arc(0, 0, inter.ringRadius + LANE_W / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      ctx.fillRect(b.xMin, b.yMin, b.xMax - b.xMin, b.yMax - b.yMin);
    }

    // разметка подъездов
    for (const d of inter.approaches) this.drawApproachMarkings(ctx, inter, d);

    // контур зоны там, где её не накрывает подъездная дорога (иначе края
    // полотна «не доходят» до перекрёстка и асфальт сливается с газоном)
    if (!inter.roundabout) this.drawBoxOutline(ctx, inter);

    // стоп-линия игрока (толстая) и подъездов со знаками
    this.drawStopLine(ctx, inter, sc.task.scene.player.approach, 0.6);
    for (const sign of sc.task.scene.signs ?? []) {
      if (sign.approach !== sc.task.scene.player.approach && (sign.type === 'stop' || sign.type === 'yield')) {
        this.drawStopLine(ctx, inter, sign.approach, 0.3);
      }
    }

    // зебра (если в сцене есть пешеходы)
    for (const rect of sc.crosswalkRects) drawZebra(ctx, rect);

    // стрелка цели на полосе игрока
    this.drawGoalArrow(ctx, sc, inter);

    // подписи полос и улиц
    this.drawLabels(ctx, sc, inter);
  }

  private drawApproachMarkings(ctx: CanvasRenderingContext2D, inter: Intersection, d: Dir): void {
    const r = inter.roadRect(d);
    if (!r) return;
    const lanes = inter.lanes[d];
    const vertical = d === 'S' || d === 'N';
    // ось координат поперёк дороги: 0 — граница направлений
    const drawLine = (lat: number, dashed: boolean, width = 0.18): void => {
      ctx.lineWidth = width;
      ctx.strokeStyle = MARK;
      ctx.setLineDash(dashed ? [1.8, 1.8] : []);
      ctx.beginPath();
      if (vertical) {
        ctx.moveTo(lat, r.yMin);
        ctx.lineTo(lat, r.yMax);
      } else {
        ctx.moveTo(r.xMin, lat);
        ctx.lineTo(r.xMax, lat);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    };
    // края полотна
    const lo = vertical ? r.xMin : r.yMin;
    const hi = vertical ? r.xMax : r.yMax;
    drawLine(lo, false, 0.22);
    drawLine(hi, false, 0.22);
    // осевая между направлениями (если оба есть)
    if (lanes.in > 0 && lanes.out > 0) drawLine(0, false, 0.22);
    // разделители полос одного направления
    const inSide = d === 'S' || d === 'W' ? 1 : -1;
    for (let i = 1; i < lanes.in; i++) drawLine(inSide * i * LANE_W, true);
    for (let i = 1; i < lanes.out; i++) drawLine(-inSide * i * LANE_W, true);
  }

  /** Сегменты границы зоны перекрёстка, не занятые «проёмами» дорог. */
  private drawBoxOutline(ctx: CanvasRenderingContext2D, inter: Intersection): void {
    const b = inter.box;
    ctx.strokeStyle = MARK;
    ctx.lineWidth = 0.22;
    ctx.setLineDash([]);
    const seg = (x1: number, y1: number, x2: number, y2: number): void => {
      if (Math.hypot(x2 - x1, y2 - y1) < 0.05) return;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };
    const sides: { d: Dir; horizontal: boolean; at: number; from: number; to: number }[] = [
      { d: 'N', horizontal: true, at: b.yMin, from: b.xMin, to: b.xMax },
      { d: 'S', horizontal: true, at: b.yMax, from: b.xMin, to: b.xMax },
      { d: 'W', horizontal: false, at: b.xMin, from: b.yMin, to: b.yMax },
      { d: 'E', horizontal: false, at: b.xMax, from: b.yMin, to: b.yMax },
    ];
    for (const s of sides) {
      const r = inter.roadRect(s.d);
      // интервал стороны, занятый дорогой (поперёк её направления)
      const covered = r
        ? s.horizontal
          ? { min: r.xMin, max: r.xMax }
          : { min: r.yMin, max: r.yMax }
        : null;
      const gaps = covered
        ? [
            { from: s.from, to: Math.max(s.from, covered.min) },
            { from: Math.min(s.to, covered.max), to: s.to },
          ]
        : [{ from: s.from, to: s.to }];
      for (const g of gaps) {
        if (s.horizontal) seg(g.from, s.at, g.to, s.at);
        else seg(s.at, g.from, s.at, g.to);
      }
    }
  }

  private drawStopLine(ctx: CanvasRenderingContext2D, inter: Intersection, d: Dir, width: number): void {
    const lanes = inter.lanes[d];
    if (lanes.in === 0) return;
    const b = inter.box;
    ctx.strokeStyle = MARK;
    ctx.lineWidth = width;
    ctx.beginPath();
    const off = STOP_LINE_OFFSET;
    switch (d) {
      case 'S':
        ctx.moveTo(0, b.yMax + off);
        ctx.lineTo(lanes.in * LANE_W, b.yMax + off);
        break;
      case 'N':
        ctx.moveTo(0, b.yMin - off);
        ctx.lineTo(-lanes.in * LANE_W, b.yMin - off);
        break;
      case 'W':
        ctx.moveTo(b.xMin - off, 0);
        ctx.lineTo(b.xMin - off, lanes.in * LANE_W);
        break;
      case 'E':
        ctx.moveTo(b.xMax + off, 0);
        ctx.lineTo(b.xMax + off, -lanes.in * LANE_W);
        break;
    }
    ctx.stroke();
  }

  private drawGoalArrow(ctx: CanvasRenderingContext2D, sc: Scenario, inter: Intersection): void {
    const player = sc.task.scene.player;
    const spawn = inter.spawnPoint(player.approach, player.startLane ?? 0);
    // стрелка на полосе, за ~7 м до зоны
    const d = distToBoxEdge(spawn, inter);
    const ax = spawn.x + Math.cos(spawn.heading) * (d - 7);
    const ay = spawn.y + Math.sin(spawn.heading) * (d - 7);
    // вопрос про порядок проезда: направление любое — «трезубец»
    drawTurnArrow(ctx, ax, ay, spawn.heading, player.anyExit ? 'any' : player.goal);
  }

  private drawLabels(ctx: CanvasRenderingContext2D, sc: Scenario, inter: Intersection): void {
    ctx.fillStyle = '#f8e9b0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 2px sans-serif';
    for (const l of sc.task.scene.laneLabels ?? []) {
      const p = laneLabelPos(inter, l.side, l.flow, l.index);
      ctx.fillText(l.label, p.x, p.y);
    }
    ctx.font = 'bold 2.6px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    const b = inter.box;
    const streets = sc.task.scene.streetLabels ?? {};
    // близко к перекрёстку, иначе на мобильном экране буквы не видны
    const off = 8;
    const rN = inter.roadRect('N');
    const rS = inter.roadRect('S');
    const rW = inter.roadRect('W');
    const rE = inter.roadRect('E');
    if (streets.N && rN) ctx.fillText(streets.N, rN.xMax + 3, b.yMin - off);
    if (streets.S && rS) ctx.fillText(streets.S, rS.xMax + 3, b.yMax + off);
    if (streets.W && rW) ctx.fillText(streets.W, b.xMin - off, rW.yMin - 2.6);
    if (streets.E && rE) ctx.fillText(streets.E, b.xMax + off, rE.yMin - 2.6);
  }

  private drawIntersectionFurniture(ctx: CanvasRenderingContext2D, sc: Scenario, inter: Intersection): void {
    // знаки: у правого края соответствующего подъезда, недалеко от стоп-линии
    const counts: Partial<Record<Dir, number>> = {};
    for (const sign of sc.task.scene.signs ?? []) {
      const i = counts[sign.approach] ?? 0;
      counts[sign.approach] = i + 1;
      const pos = signPos(inter, sign.approach, i);
      drawSign(ctx, pos.x, pos.y, sign);
    }
    // светофор игрока
    if (sc.task.scene.light) {
      const a = sc.task.scene.player.approach;
      const pos = signPos(inter, a, (counts[a] ?? 0) + 0.2);
      drawTrafficLight(
        ctx,
        pos.x,
        pos.y,
        sc.lightState(),
        sc.time,
        false,
        sc.task.scene.light.busArrow,
        sc.task.scene.light.greenArrow,
      );
    }
  }

  // ==== прямой участок ====

  private drawRoad(ctx: CanvasRenderingContext2D, sc: Scenario, road: RoadGeom): void {
    const half = LANE_W;
    const yTop = -(road.roadLen + 20);
    ctx.fillStyle = ASPHALT;
    ctx.fillRect(-half, yTop, half * 2, 6 - yTop);

    // сужение: газонные клинья с обеих сторон
    if (road.narrowRect) {
      const n = road.narrowRect;
      ctx.fillStyle = GRASS;
      ctx.fillRect(-half, n.yMin, n.xMin + half, n.yMax - n.yMin);
      ctx.fillRect(n.xMax, n.yMin, half - n.xMax, n.yMax - n.yMin);
      ctx.strokeStyle = MARK;
      ctx.lineWidth = 0.2;
      ctx.strokeRect(-half, n.yMin, n.xMin + half, n.yMax - n.yMin);
      ctx.strokeRect(n.xMax, n.yMin, half - n.xMax, n.yMax - n.yMin);
    }

    // края и осевая
    ctx.strokeStyle = MARK;
    ctx.lineWidth = 0.22;
    for (const x of [-half, half]) {
      ctx.beginPath();
      ctx.moveTo(x, yTop);
      ctx.lineTo(x, 6);
      ctx.stroke();
    }
    ctx.setLineDash([2.2, 2.2]);
    ctx.beginPath();
    ctx.moveTo(0, yTop);
    ctx.lineTo(0, 6);
    ctx.stroke();
    ctx.setLineDash([]);

    // зоны
    for (const rect of sc.crosswalkRects) drawZebra(ctx, rect);
    if (road.railway) drawRailway(ctx, road.railway);
    for (const z of road.speedZones) {
      // отметка лимита на асфальте в начале зоны
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = 'bold 1.8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(z.limitKmh), LANE_W / 2, z.rect.yMax + 2);
    }
  }

  private drawRoadFurniture(ctx: CanvasRenderingContext2D, sc: Scenario, road: RoadGeom): void {
    const signX = LANE_W + 1.6;
    const zones = sc.task.scene.zones ?? [];
    for (const sign of sc.task.scene.signs ?? []) {
      const zone = zones.find((z) =>
        (sign.type === 'narrow-yield' || sign.type === 'narrow-priority') ? z.type === 'narrow'
        : sign.type === 'speed-limit' ? z.type === 'speed-limit'
        : sign.type === 'railway' ? z.type === 'railway'
        : z.type === 'crosswalk',
      );
      // знак жд при наличии светофора отодвигаем дальше от переезда,
      // чтобы не накладывался на сам светофор (он стоит у стоп-линии)
      const back = sign.type === 'railway' && sc.task.scene.light ? 7 : 4;
      const y = zone ? -(zone.at - back) : -8;
      drawSign(ctx, signX, y, sign);
      // конец зоны ограничения скорости
      if (sign.type === 'speed-limit' && zone) {
        drawSign(ctx, signX, -(zone.at + zone.length + 2), { ...sign, type: 'speed-limit' }, true);
      }
    }
    if (sc.task.scene.light && road.railway) {
      drawTrafficLight(ctx, signX, road.railway.yMax + 2.2, sc.lightState(), sc.time, true);
    }
  }
}

// ==== примитивы ====

function distToBoxEdge(spawn: { x: number; y: number }, inter: Intersection): number {
  const b = inter.box;
  // расстояние от спавна до края зоны вдоль подъезда
  const dx = Math.max(b.xMin - spawn.x, spawn.x - b.xMax, 0);
  const dy = Math.max(b.yMin - spawn.y, spawn.y - b.yMax, 0);
  return Math.max(dx, dy);
}

function laneLabelPos(inter: Intersection, side: Dir, flow: 'in' | 'out', index: number): { x: number; y: number } {
  const b = inter.box;
  const n = flow === 'in' ? inter.lanes[side].in : inter.lanes[side].out;
  const lat = (n - 0.5 - index) * LANE_W;
  const off = 3.2;
  switch (side) {
    case 'S': return flow === 'in' ? { x: lat, y: b.yMax + off } : { x: -lat, y: b.yMax + off };
    case 'N': return flow === 'in' ? { x: -lat, y: b.yMin - off } : { x: lat, y: b.yMin - off };
    case 'W': return flow === 'in' ? { x: b.xMin - off, y: lat } : { x: b.xMin - off, y: -lat };
    case 'E': return flow === 'in' ? { x: b.xMax + off, y: -lat } : { x: b.xMax + off, y: lat };
  }
}

function signPos(inter: Intersection, d: Dir, slot: number): { x: number; y: number } {
  const b = inter.box;
  const lanes = inter.lanes[d];
  const gap = 1.8 + slot * 3.4;
  switch (d) {
    case 'S': return { x: lanes.in * LANE_W + 1.6, y: b.yMax + STOP_LINE_OFFSET + 1.2 + gap };
    case 'N': return { x: -lanes.in * LANE_W - 1.6, y: b.yMin - STOP_LINE_OFFSET - 1.2 - gap };
    case 'W': return { x: b.xMin - STOP_LINE_OFFSET - 1.2 - gap, y: lanes.in * LANE_W + 1.6 };
    case 'E': return { x: b.xMax + STOP_LINE_OFFSET + 1.2 + gap, y: -lanes.in * LANE_W - 1.6 };
  }
}

function drawZebra(ctx: CanvasRenderingContext2D, r: Rect): void {
  ctx.fillStyle = 'rgba(240,240,240,0.85)';
  const horizontal = r.xMax - r.xMin >= r.yMax - r.yMin;
  if (horizontal) {
    for (let x = r.xMin + 0.4; x < r.xMax - 0.6; x += 1.5) {
      ctx.fillRect(x, r.yMin + 0.2, 0.8, r.yMax - r.yMin - 0.4);
    }
  } else {
    for (let y = r.yMin + 0.4; y < r.yMax - 0.6; y += 1.5) {
      ctx.fillRect(r.xMin + 0.2, y, r.xMax - r.xMin - 0.4, 0.8);
    }
  }
}

function drawRailway(ctx: CanvasRenderingContext2D, r: Rect): void {
  ctx.fillStyle = '#4a4640';
  ctx.fillRect(r.xMin - 3, r.yMin, r.xMax - r.xMin + 6, r.yMax - r.yMin);
  // шпалы
  ctx.fillStyle = '#5f574a';
  for (let x = r.xMin - 3; x < r.xMax + 3; x += 1.4) {
    ctx.fillRect(x, r.yMin + 0.6, 0.7, r.yMax - r.yMin - 1.2);
  }
  // рельсы
  ctx.strokeStyle = '#b8bcc4';
  ctx.lineWidth = 0.3;
  const midY = (r.yMin + r.yMax) / 2;
  for (const off of [-1.1, 1.1]) {
    ctx.beginPath();
    ctx.moveTo(r.xMin - 3, midY + off);
    ctx.lineTo(r.xMax + 3, midY + off);
    ctx.stroke();
  }
}

function drawTurnArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  heading: number,
  turn: Turn | 'any',
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(heading + Math.PI / 2); // локально: вперёд = -y
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 0.34;
  ctx.lineCap = 'round';
  // острый наконечник: длинный (1.35) и узкий (полуширина 0.42)
  const head = (tx: number, ty: number, ang: number): void => {
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-0.42, 1.35);
    ctx.lineTo(0.42, 1.35);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  if (turn === 'any') {
    // три направления сразу: прямо, налево и направо
    ctx.beginPath();
    ctx.moveTo(0, 1.8);
    ctx.lineTo(0, -0.9);
    ctx.stroke();
    head(0, -2.2, 0);
    for (const sgn of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, 1.0);
      ctx.quadraticCurveTo(0, 0, sgn * 0.9, 0);
      ctx.stroke();
      head(sgn * 2.2, 0, (sgn * Math.PI) / 2);
    }
    ctx.restore();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(0, 1.8);
  if (turn === 'straight') {
    ctx.lineTo(0, -0.9);
    ctx.stroke();
    head(0, -2.2, 0);
  } else if (turn === 'left') {
    ctx.lineTo(0, -0.4);
    ctx.quadraticCurveTo(0, -1.4, -1.0, -1.4);
    ctx.stroke();
    head(-2.3, -1.4, -Math.PI / 2);
  } else if (turn === 'right') {
    ctx.lineTo(0, -0.4);
    ctx.quadraticCurveTo(0, -1.4, 1.0, -1.4);
    ctx.stroke();
    head(2.3, -1.4, Math.PI / 2);
  } else {
    // разворот
    ctx.lineTo(0, -0.6);
    ctx.quadraticCurveTo(0, -1.6, -0.8, -1.6);
    ctx.quadraticCurveTo(-1.6, -1.6, -1.6, -0.6);
    ctx.stroke();
    head(-1.6, 0.7, Math.PI);
  }
  ctx.restore();
}

function drawTrafficLight(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  state: LightState,
  time: number,
  railway = false,
  busArrow = false,
  greenArrow = false,
): void {
  const blinkOn = time % 0.9 < 0.5;
  ctx.save();
  ctx.translate(x, y);
  if (railway) {
    // жд: два красных фонаря рядом, мигают поочерёдно
    ctx.fillStyle = '#22242a';
    ctx.fillRect(-1.5, -1, 3, 2);
    const active = state === 'red-flashing';
    for (const [i, dx] of [-0.7, 0.7].entries()) {
      const on = active && (i === 0 ? blinkOn : !blinkOn);
      ctx.fillStyle = on ? '#ff3b30' : '#4a1f1f';
      ctx.beginPath();
      ctx.arc(dx, 0, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }
  ctx.fillStyle = '#22242a';
  const w = 1.6;
  const h = 4.2;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  const lamps: [string, boolean][] = [
    ['#ff3b30', state === 'red' || state === 'red-yellow'],
    ['#ffcc00', state === 'yellow' || state === 'red-yellow' || (state === 'yellow-flashing' && blinkOn)],
    ['#34c759', state === 'green' || (state === 'green-flashing' && blinkOn)],
  ];
  for (const [i, [color, on]] of lamps.entries()) {
    const cy = -1.3 + i * 1.3;
    if (i === 2 && greenArrow) {
      // зелёная секция — стрелка «прямо» вместо круглого сигнала
      ctx.fillStyle = '#15171c';
      ctx.beginPath();
      ctx.arc(0, cy, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = on ? color : '#2a4a35';
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = 0.14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, cy + 0.3);
      ctx.lineTo(0, cy - 0.02);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, cy - 0.34);
      ctx.lineTo(-0.22, cy - 0.02);
      ctx.lineTo(0.22, cy - 0.02);
      ctx.closePath();
      ctx.fill();
      continue;
    }
    ctx.fillStyle = on ? color : '#3a3d45';
    ctx.beginPath();
    ctx.arc(0, cy, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  if (busArrow) {
    // дополнительная секция: жёлтая стрелка для общественного транспорта,
    // горит, пока основной сигнал запрещающий
    ctx.fillStyle = '#22242a';
    ctx.fillRect(w / 2, -h / 2, 1.4, 1.4);
    const on = state === 'red' || state === 'red-yellow';
    ctx.strokeStyle = on ? '#ffcc00' : '#4a442a';
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = 0.2;
    ctx.lineCap = 'round';
    const cx = w / 2 + 0.7;
    const cy = -h / 2 + 0.75;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 0.4);
    ctx.lineTo(cx, cy - 0.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - 0.45);
    ctx.lineTo(cx - 0.28, cy - 0.05);
    ctx.lineTo(cx + 0.28, cy - 0.05);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** Изображения израильских знаков (public/signs/<номер>.png,
 * вырезаны из справочника isradrive). */
const SIGN_FILE: Record<SignType, string> = {
  'stop': '302',
  'yield': '301',
  'priority-road': '309',
  'priority-road-end': '310',
  'only-straight': '203',
  'only-right': '204',
  'only-left': '205',
  'no-left-turn': '429',
  'no-right-turn': '428',
  'no-u-turn': '431',
  'only-u-turn': '212',
  'no-entry': '402',
  'one-way': '618',
  'roundabout': '303',
  'crosswalk': '306',
  'crosswalk-ahead': '135',
  'pedestrians-near': '136',
  'speed-limit': '426',
  'narrow-yield': '307',
  'narrow-priority': '308',
  'railway': '129',
  'traffic-light-ahead': '122',
  't-junction': '115',
};

const signImages = new Map<string, HTMLImageElement>();

function signImage(num: string): HTMLImageElement {
  let img = signImages.get(num);
  if (!img) {
    img = new Image();
    img.src = `signs/${num}.png`;
    signImages.set(img.src, img);
    signImages.set(num, img);
  }
  return img;
}

/** Высота знака в метрах мира. */
const SIGN_H = 3.0;
const SIGN_W = SIGN_H * (78 / 63);

function drawSign(ctx: CanvasRenderingContext2D, x: number, y: number, sign: SignSpec, endOfZone = false): void {
  let num = SIGN_FILE[sign.type];
  if (sign.type === 'speed-limit') {
    // для лимитов, отличных от «50» на исходной картинке, есть готовые
    // варианты (426-30.png и т.п.), для конца зоны — 427-*
    num = endOfZone ? '427' : '426';
    if (sign.value !== undefined && sign.value !== 50) num = `${num}-${sign.value}`;
  }
  const img = signImage(num);
  if (!img.complete || img.naturalWidth === 0) return; // появится на следующем кадре
  ctx.drawImage(img, x - SIGN_W / 2, y - SIGN_H / 2, SIGN_W, SIGN_H);
}

function drawNpc(ctx: CanvasRenderingContext2D, npc: NpcAgent): void {
  const { length, width } = npc.size;
  const kind = npc.spec.kind;
  if (kind === 'bicycle' || kind === 'motorcycle') {
    ctx.save();
    ctx.translate(npc.pos.x, npc.pos.y);
    ctx.rotate(npc.heading);
    const hl = length / 2;
    // колёса — вытянутые тёмные «капсулы»
    ctx.fillStyle = '#1c1e22';
    roundRect(ctx, hl - 0.85, -0.14, 0.85, 0.28, 0.14);
    ctx.fill();
    roundRect(ctx, -hl, -0.14, 0.85, 0.28, 0.14);
    ctx.fill();
    // рама между колёсами
    ctx.strokeStyle = npc.spec.color;
    ctx.lineWidth = kind === 'motorcycle' ? 0.34 : 0.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-hl + 0.4, 0);
    ctx.lineTo(hl - 0.4, 0);
    ctx.stroke();
    // руль
    ctx.lineWidth = 0.16;
    ctx.beginPath();
    ctx.moveTo(hl - 0.55, -0.55);
    ctx.lineTo(hl - 0.55, 0.55);
    ctx.stroke();
    // водитель: плечи поперёк движения + голова со шлемом
    ctx.fillStyle = npc.spec.color;
    ctx.beginPath();
    ctx.ellipse(-0.25, 0, 0.42, 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = kind === 'motorcycle' ? '#2b2f38' : '#f5d6a8';
    ctx.beginPath();
    ctx.arc(0.05, 0, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(20,20,20,0.55)';
    ctx.lineWidth = 0.06;
    ctx.stroke();
    ctx.restore();
  } else {
    drawCarBody(ctx, {
      cx: npc.pos.x,
      cy: npc.pos.y,
      angle: npc.heading,
      hl: length / 2,
      hw: width / 2,
      bodyColor: npc.spec.color,
      windshieldColor: '#222',
      headlightColor: '#fff',
      taillightColor: '#a52323',
    });
  }
  if (npc.spec.label) {
    // у двухколёсных номер рисуем рядом, чтобы не закрывать силуэт
    const off = kind === 'bicycle' || kind === 'motorcycle' ? 1.1 : 0;
    ctx.save();
    ctx.translate(npc.pos.x + off, npc.pos.y - off);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, 0.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c33';
    ctx.lineWidth = 0.12;
    ctx.stroke();
    ctx.fillStyle = '#222';
    ctx.font = 'bold 1px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(npc.spec.label, 0, 0.05);
    ctx.restore();
  }
}

function drawPedestrian(ctx: CanvasRenderingContext2D, ped: PedAgent): void {
  ctx.save();
  ctx.translate(ped.pos.x, ped.pos.y);
  // светлая обводка, чтобы фигура читалась и на асфальте, и на зебре
  ctx.fillStyle = '#2563eb';
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 0.12;
  ctx.beginPath();
  ctx.ellipse(0, 0, 0.62, 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f5d6a8';
  ctx.beginPath();
  ctx.arc(0, 0, 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPlayerCar(ctx: CanvasRenderingContext2D, car: Car, dead: boolean): void {
  const reversing = car.velocity < -0.05 || (car.velocity < 0.5 && car.brakeInput > 0.1);
  const braking = !reversing && car.brakeInput > 0.1;
  drawCarBody(ctx, {
    cx: car.position.x,
    cy: car.position.y,
    angle: car.heading,
    hl: car.length / 2,
    hw: car.width / 2,
    bodyColor: dead ? '#6b6f78' : '#ffce4d',
    windshieldColor: dead ? '#3b3e45' : '#222',
    headlightColor: dead ? '#2a2c32' : '#fff',
    taillightColor: dead ? '#2a2c32' : reversing ? '#ffffff' : braking ? '#ff2828' : '#a52323',
    glowTaillight: braking && !dead,
  });
}

interface CarVisual {
  cx: number;
  cy: number;
  angle: number;
  hl: number;
  hw: number;
  bodyColor: string;
  windshieldColor: string;
  headlightColor: string;
  taillightColor: string;
  glowTaillight?: boolean;
}

function drawCarBody(ctx: CanvasRenderingContext2D, v: CarVisual): void {
  ctx.save();
  ctx.translate(v.cx, v.cy);
  ctx.rotate(v.angle);
  ctx.fillStyle = v.bodyColor;
  roundRect(ctx, -v.hl, -v.hw, v.hl * 2, v.hw * 2, 0.4);
  ctx.fill();
  ctx.fillStyle = v.windshieldColor;
  ctx.fillRect(v.hl * 0.45, -v.hw * 0.75, v.hl * 0.35, v.hw * 1.5);

  ctx.fillStyle = v.headlightColor;
  ctx.beginPath();
  ctx.arc(v.hl * 0.95, -v.hw * 0.6, 0.15, 0, Math.PI * 2);
  ctx.arc(v.hl * 0.95, v.hw * 0.6, 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = v.taillightColor;
  ctx.beginPath();
  ctx.arc(-v.hl * 0.95, -v.hw * 0.6, 0.18, 0, Math.PI * 2);
  ctx.arc(-v.hl * 0.95, v.hw * 0.6, 0.18, 0, Math.PI * 2);
  ctx.fill();
  if (v.glowTaillight) {
    ctx.shadowColor = '#ff2828';
    ctx.shadowBlur = 0.5;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}
