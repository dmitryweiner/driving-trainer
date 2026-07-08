import { Car, type CarInput, type Vec2 } from './Car';
import { obbIntersect, pointInOBB, type OBB } from './Collision';
import { Intersection, LANE_W, rectToOBB, type Rect } from './Intersection';
import { NpcAgent, PedAgent, type NpcGeom } from './Npc';
import type { Dir, FailReason, LightState, NpcSpec, ScenarioState, Task } from './types';

const DEFAULT_TIME_LIMIT = 60;
/** Полная остановка: скорость ниже этого порога. */
const STOP_EPS = 0.12;
/** Мигающий жёлтый: максимум скорости при пересечении стоп-линии. */
const FLASHING_MAX_SPEED = 6;
/** Полуширина проезжей части в сужении. */
const NARROW_HALF = 2.3;

const FORBIDDEN_LIGHTS: LightState[] = ['red', 'red-yellow', 'yellow', 'red-flashing'];

const KIND_NAME: Record<NpcSpec['kind'], string> = {
  car: 'автомобилю',
  truck: 'грузовику',
  bus: 'автобусу',
  tractor: 'трактору',
  motorcycle: 'мотоциклисту',
  bicycle: 'велосипедисту',
};

/** Прямой участок дороги (kind: 'road'): игрок едет на север от y=0. */
export class RoadGeom implements NpcGeom {
  readonly roadLen: number;
  readonly conflict: Rect | null;
  readonly crosswalks: Rect[] = [];
  readonly speedZones: { rect: Rect; limitKmh: number }[] = [];
  readonly railway: Rect | null;
  /** Встречные на прямом участке едут издалека, без подрезки к стоп-линии. */
  readonly trimApproach = false;
  private readonly hasNarrow: boolean;
  /** Физическое сужение проезжей части (для отрисовки и off-road). */
  narrowRect: Rect | null = null;

  constructor(task: Task) {
    const zones = task.scene.zones ?? [];
    let maxEnd = 30;
    for (const z of zones) maxEnd = Math.max(maxEnd, z.at + z.length);
    this.roadLen = maxEnd + 30;
    let railway: Rect | null = null;
    for (const z of zones) {
      const rect: Rect = { xMin: -LANE_W, xMax: LANE_W, yMin: -(z.at + z.length), yMax: -z.at };
      if (z.type === 'crosswalk') this.crosswalks.push(rect);
      if (z.type === 'speed-limit') this.speedZones.push({ rect, limitKmh: z.value ?? 50 });
      if (z.type === 'railway') railway = rect;
      if (z.type === 'narrow') this.narrowRect = { ...rect, xMin: -NARROW_HALF, xMax: NARROW_HALF };
    }
    this.railway = railway;
    this.hasNarrow = this.narrowRect !== null;
    // конфликтная зона сужения включает диагонали перестроения по обе
    // стороны — пока один участник в ней, второй не начинает манёвр
    this.conflict = this.narrowRect
      ? { ...this.narrowRect, yMin: this.narrowRect.yMin - 8, yMax: this.narrowRect.yMax + 8 }
      : null;
  }

  playerSpawn(): { x: number; y: number; heading: number } {
    return { x: LANE_W / 2, y: 0, heading: -Math.PI / 2 };
  }

  playerPath(): Vec2[] {
    const x = LANE_W / 2;
    const end = -(this.roadLen + 15);
    if (!this.narrowRect) return [{ x, y: 0 }, { x, y: end }];
    const n = this.narrowRect;
    return [
      { x, y: 0 },
      { x, y: n.yMax + 6 },
      { x: 0, y: n.yMax },
      { x: 0, y: n.yMin },
      { x, y: n.yMin - 6 },
      { x, y: end },
    ];
  }

  /** Стоп-линия игрока: перед жд-переездом (если есть). */
  stopLineDist(p: Vec2): number {
    if (this.railway) return p.y - (this.railway.yMax + 1);
    return Infinity;
  }

  isOnRoad(p: Vec2): boolean {
    if (p.y > 6 || p.y < -(this.roadLen + 25)) return false;
    if (this.hasNarrow && this.narrowRect && p.y >= this.narrowRect.yMin && p.y <= this.narrowRect.yMax) {
      return Math.abs(p.x) <= NARROW_HALF;
    }
    return Math.abs(p.x) <= LANE_W;
  }

  exitedVia(p: Vec2): Dir | null {
    return p.y < -this.roadLen ? 'N' : null;
  }

  npcPath(_spec: NpcSpec): Vec2[] {
    // встречный (approach 'N'): едет на юг по своей полосе
    const x = -LANE_W / 2;
    const start = -(this.roadLen + 15);
    if (!this.narrowRect) return [{ x, y: start }, { x, y: 12 }];
    const n = this.narrowRect;
    return [
      { x, y: start },
      { x, y: n.yMin - 8 },
      { x: 0, y: n.yMin },
      { x: 0, y: n.yMax },
      { x, y: n.yMax + 8 },
      { x, y: 12 },
    ];
  }

  npcStopLineDist(_spec: NpcSpec, pos: Vec2): number {
    if (!this.conflict) return -1;
    // южное направление: ожидание перед конфликтной зоной (до диагонали)
    return this.conflict.yMin - 2 - pos.y;
  }
}

interface Participant {
  order: number;
  cleared: boolean;
}

export class Scenario {
  readonly task: Task;
  readonly car: Car;
  readonly npcs: NpcAgent[];
  readonly pedestrians: PedAgent[] = [];
  readonly inter: Intersection | null = null;
  readonly road: RoadGeom | null = null;
  readonly playerPath: Vec2[];
  readonly goalSide: Dir;
  readonly timeLimit: number;
  state: ScenarioState = { kind: 'driving' };
  time = 0;

  private playerEntered = false;
  private playerCleared = false;
  private hadFullStop = false;
  private prevStopDist: number;
  private crossedStopLine = false;
  /** Игрок подъезжал к стоп-линии — после этого выезд через свою сторону
   * значим (разворот или движение задним ходом), а не спавн. */
  private wasNearStop = false;
  private wasOnCrosswalk = false;
  /** «Подъехали одновременно»: очередь NPC трогается, только когда игрок
   * приблизился к перекрёстку — иначе те, кого надо пропустить, успевают
   * проехать до его подъезда и задача решается сама собой. */
  private queueStarted = false;
  private readonly stopRequired: boolean;
  private readonly stopZone: number;
  readonly crosswalkRects: Rect[];
  readonly speedZones: { rect: Rect; limitKmh: number }[];
  private readonly hasLight: boolean;

  constructor(task: Task) {
    this.task = task;
    const scene = task.scene;
    this.timeLimit = scene.timeLimit ?? DEFAULT_TIME_LIMIT;
    this.hasLight = scene.light !== undefined;

    let geom: NpcGeom;
    if (scene.kind === 'intersection') {
      const inter = new Intersection({
        approaches: scene.approaches ?? ['N', 'E', 'S', 'W'],
        lanes: scene.lanes,
        roundabout: scene.roundabout,
      });
      this.inter = inter;
      geom = inter;
      const spawn = inter.spawnPoint(scene.player.approach, scene.player.startLane ?? 0);
      this.car = new Car({ x: spawn.x, y: spawn.y, heading: spawn.heading });
      this.playerPath = inter.path(scene.player.approach, scene.player.goal, {
        fromLane: scene.player.startLane ?? 0,
        toLane: scene.player.goalLane ?? 0,
      });
      this.goalSide = inter.exitSide(scene.player.approach, scene.player.goal);
      this.crosswalkRects = this.buildIntersectionCrosswalks(inter);
      this.speedZones = [];
    } else {
      const road = new RoadGeom(task);
      this.road = road;
      geom = road;
      const spawn = road.playerSpawn();
      this.car = new Car({ x: spawn.x, y: spawn.y, heading: spawn.heading });
      this.playerPath = road.playerPath();
      this.goalSide = 'N';
      this.crosswalkRects = road.crosswalks;
      this.speedZones = road.speedZones;
    }

    this.npcs = (scene.npcs ?? []).map((spec) => new NpcAgent(spec, geom));
    this.buildPedestrians();
    this.prevStopDist = this.distanceToStopLine();

    const hasStopSign = (scene.signs ?? []).some(
      (s) => s.type === 'stop' && s.approach === scene.player.approach,
    );
    const railwayWithLight = this.road?.railway != null && this.hasLight;
    this.stopRequired = hasStopSign || railwayWithLight;
    this.stopZone = railwayWithLight ? 15 : 8;
  }

  private buildIntersectionCrosswalks(inter: Intersection): Rect[] {
    if (!(this.task.scene.pedestrians ?? []).length) return [];
    // зебра на подъезде игрока, у края конфликтной зоны
    const b = inter.box;
    const a = this.task.scene.player.approach;
    switch (a) {
      case 'S': return [{ xMin: b.xMin, xMax: b.xMax, yMin: b.yMax - 2.4, yMax: b.yMax }];
      case 'N': return [{ xMin: b.xMin, xMax: b.xMax, yMin: b.yMin, yMax: b.yMin + 2.4 }];
      case 'W': return [{ xMin: b.xMin, xMax: b.xMin + 2.4, yMin: b.yMin, yMax: b.yMax }];
      case 'E': return [{ xMin: b.xMax - 2.4, xMax: b.xMax, yMin: b.yMin, yMax: b.yMax }];
    }
  }

  private buildPedestrians(): void {
    const specs = this.task.scene.pedestrians ?? [];
    for (const spec of specs) {
      const rect = this.crosswalkRects[0];
      if (!rect) continue;
      const midY = (rect.yMin + rect.yMax) / 2;
      const midX = (rect.xMin + rect.xMax) / 2;
      const horizontalWalk = this.road !== null || spec.approach === 'S' || spec.approach === 'N';
      if (horizontalWalk) {
        const roadMin = this.road ? -LANE_W : rect.xMin;
        const roadMax = this.road ? LANE_W : rect.xMax;
        // 'right' для игрока, едущего на север, — восток
        const fromX = spec.from === 'right' ? roadMax + 2 : roadMin - 2;
        const toX = spec.from === 'right' ? roadMin - 2 : roadMax + 2;
        this.pedestrians.push(
          new PedAgent({
            from: { x: fromX, y: midY },
            to: { x: toX, y: midY },
            axis: 'x',
            roadMin,
            roadMax,
            delay: spec.delay,
          }),
        );
      } else {
        const fromY = spec.from === 'right' ? rect.yMax + 2 : rect.yMin - 2;
        const toY = spec.from === 'right' ? rect.yMin - 2 : rect.yMax + 2;
        this.pedestrians.push(
          new PedAgent({
            from: { x: midX, y: fromY },
            to: { x: midX, y: toY },
            axis: 'y',
            roadMin: rect.yMin,
            roadMax: rect.yMax,
            delay: spec.delay,
          }),
        );
      }
    }
  }

  lightState(): LightState {
    const light = this.task.scene.light;
    if (!light) return 'off';
    let t = this.time;
    for (const phase of light.phases) {
      if (phase.duration === undefined || t < phase.duration) return phase.state;
      t -= phase.duration;
    }
    return light.phases[light.phases.length - 1].state;
  }

  distanceToStopLine(): number {
    if (this.inter) return this.inter.distanceToStopLine(this.task.scene.player.approach, this.car.position);
    if (this.road) return this.road.stopLineDist(this.car.position);
    return Infinity;
  }

  pedestrianOnCrossing(): boolean {
    return this.pedestrians.some((p) => p.onRoad);
  }

  private conflict(): Rect | null {
    if (this.inter) return this.inter.conflict;
    return this.road?.conflict ?? null;
  }

  private isOnRoad(p: Vec2): boolean {
    if (this.inter) return this.inter.isOnRoad(p);
    if (this.road) return this.road.isOnRoad(p);
    return true;
  }

  private exitedVia(p: Vec2): Dir | null {
    if (this.inter) return this.inter.exitedVia(p);
    if (this.road) return this.road.exitedVia(p);
    return null;
  }

  private fail(reason: FailReason, message: string): void {
    this.state = { kind: 'failed', reason, message };
  }

  private participants(): Participant[] {
    const list: Participant[] = this.npcs.map((n) => ({ order: n.spec.order, cleared: n.cleared }));
    list.push({ order: this.task.scene.player.order, cleared: this.playerCleared });
    return list;
  }

  private mayGo(order: number): boolean {
    return this.participants().every((p) => p.order >= order || p.cleared);
  }

  update(dt: number, input: CarInput): void {
    if (this.state.kind !== 'driving') return;
    this.time += dt;

    this.car.update(dt, input);
    if (!this.queueStarted) {
      if (this.inter) {
        this.queueStarted = this.distanceToStopLine() < 14;
      } else if (this.road) {
        const c = this.road.conflict;
        this.queueStarted = c === null || this.car.position.y - c.yMax < 25;
      }
    }
    for (const npc of this.npcs) {
      // уже движущиеся по кольцу не ждут подъезда игрока
      const started = this.queueStarted || npc.spec.ring !== undefined;
      npc.update(dt, started && this.mayGo(npc.spec.order));
    }
    for (const ped of this.pedestrians) ped.update(dt);

    const carOBB = this.car.getOBB();
    const pos = this.car.position;
    const v = this.car.velocity;

    // столкновения (NPC, завершившие путь, считаются уехавшими)
    for (const npc of this.npcs) {
      if (npc.done) continue;
      if (obbIntersect(carOBB, npc.getOBB())) {
        return this.fail('collision', `Столкновение (${this.npcLabel(npc)}).`);
      }
    }
    for (const ped of this.pedestrians) {
      const inflated: OBB = { ...carOBB, hx: carOBB.hx + ped.radius, hy: carOBB.hy + ped.radius };
      if (pointInOBB(ped.pos, inflated)) {
        return this.fail('pedestrian', 'Вы сбили пешехода.');
      }
    }

    // приоритет: въезд в конфликтную зону раньше очереди
    // (проверяется до off-road: касание сужения важнее касания его границы)
    const zone = this.conflict();
    if (zone) {
      const inZone = obbIntersect(carOBB, rectToOBB(zone));
      if (inZone && !this.playerEntered) {
        this.playerEntered = true;
        const blocker = this.npcs.find(
          (n) => n.spec.order < this.task.scene.player.order && !n.cleared,
        );
        if (blocker) {
          return this.fail('priority', `Вы обязаны были уступить дорогу ${this.npcLabel(blocker)}.`);
        }
      }
      if (this.playerEntered && !inZone) this.playerCleared = true;
    }

    // выезд за пределы проезжей части
    for (const corner of this.car.getCorners()) {
      if (!this.isOnRoad(corner)) {
        return this.fail('off-road', 'Вы выехали за пределы проезжей части.');
      }
    }

    // пешеходный переход: нарушение — въезд на зебру, когда на ней пешеход
    // (если пешеход сошёл на дорогу, когда машина уже на зебре, — не провал;
    // наезд ловится проверкой столкновения выше)
    const onCrosswalk = this.crosswalkRects.some((rect) => obbIntersect(carOBB, rectToOBB(rect)));
    if (onCrosswalk && !this.wasOnCrosswalk && this.pedestrianOnCrossing()) {
      return this.fail('pedestrian', 'Вы обязаны были пропустить пешехода.');
    }
    this.wasOnCrosswalk = onCrosswalk;

    // стоп-линия
    const d = this.distanceToStopLine();
    if (Number.isFinite(d)) {
      if (d < 10) this.wasNearStop = true;
      if (!this.crossedStopLine && v < STOP_EPS && d >= 0 && d <= this.stopZone) {
        this.hadFullStop = true;
      }
      if (!this.crossedStopLine && this.prevStopDist > 0 && d <= 0) {
        this.crossedStopLine = true;
        const light = this.lightState();
        if (FORBIDDEN_LIGHTS.includes(light)) {
          return this.fail(
            'ran-light',
            light === 'red-flashing'
              ? 'Запрещено ехать, пока мигает красный сигнал.'
              : 'Вы проехали на запрещающий сигнал светофора.',
          );
        }
        if (light === 'yellow-flashing' && v > FLASHING_MAX_SPEED) {
          return this.fail('ran-light', 'Мигающий жёлтый: нужно снизить скорость перед перекрёстком.');
        }
        if (this.stopRequired && !this.hadFullStop) {
          return this.fail('ran-stop', 'Требовалась полная остановка перед стоп-линией.');
        }
        const startLane = this.task.scene.player.startLane;
        if (this.inter && startLane !== undefined) {
          const lane = this.inter.laneIndexAt(this.task.scene.player.approach, pos);
          if (lane !== startLane) {
            return this.fail('wrong-lane', 'Манёвр начат не из той полосы.');
          }
        }
      }
      this.prevStopDist = d;
    }

    // зоны ограничения скорости
    for (const z of this.speedZones) {
      const inZone = pos.x >= z.rect.xMin && pos.x <= z.rect.xMax && pos.y >= z.rect.yMin && pos.y <= z.rect.yMax;
      if (inZone && v > z.limitKmh / 3.6 + 0.3) {
        return this.fail('speeding', `Превышение скорости (ограничение ${z.limitKmh} км/ч).`);
      }
    }

    // выезд с перекрёстка: сторона собственного подъезда значима только
    // после подъезда к стоп-линии (разворот / откат назад), иначе это спавн
    const exited = this.exitedVia(pos);
    const ownSide = this.inter !== null && exited === this.task.scene.player.approach;
    if (exited && (!ownSide || this.wasNearStop)) {
      if (exited !== this.goalSide) {
        return this.fail(
          'wrong-way',
          ownSide ? 'Вы вернулись назад, не проехав перекрёсток.' : 'Вы уехали не в том направлении.',
        );
      }
      const goalLane = this.task.scene.player.goalLane;
      if (this.inter && goalLane !== undefined) {
        const lane = this.inter.exitLaneIndexAt(this.goalSide, pos);
        if (lane !== goalLane) {
          return this.fail('wrong-lane', 'Выезд не в ту полосу.');
        }
      }
      this.state = { kind: 'passed' };
      return;
    }

    if (this.time > this.timeLimit) {
      this.fail('timeout', 'Время вышло.');
    }
  }

  private npcLabel(npc: NpcAgent): string {
    const name = KIND_NAME[npc.spec.kind];
    return npc.spec.label ? `${name} (${npc.spec.label})` : name;
  }
}
