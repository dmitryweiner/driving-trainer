import { describe, expect, it } from 'vitest';
import { Intersection, LANE_W } from '../src/game/Intersection';

describe('Intersection geometry (1+1 полоса, все 4 стороны)', () => {
  const x = new Intersection({ approaches: ['N', 'E', 'S', 'W'] });

  it('конфликтная зона симметрична и равна ширине дороги', () => {
    expect(x.box).toEqual({
      xMin: -LANE_W,
      xMax: LANE_W,
      yMin: -LANE_W,
      yMax: LANE_W,
    });
  });

  it('спавн с юга — на правой (восточной) полосе, курс на север', () => {
    const s = x.spawnPoint('S');
    expect(s.x).toBeCloseTo(LANE_W / 2);
    expect(s.y).toBeGreaterThan(x.box.yMax + 15);
    expect(s.heading).toBeCloseTo(-Math.PI / 2);
  });

  it('спавн с востока — на южной полосе, курс на запад', () => {
    const s = x.spawnPoint('E');
    expect(s.y).toBeCloseTo(-LANE_W / 2);
    expect(s.x).toBeGreaterThan(x.box.xMax + 15);
    expect(s.heading).toBeCloseTo(Math.PI);
  });

  it('стоп-линия — за метр до зоны', () => {
    // для подъезда S: положительное расстояние = ещё не доехал
    const before = x.distanceToStopLine('S', { x: LANE_W / 2, y: 10 });
    expect(before).toBeCloseTo(10 - (LANE_W + 1));
    const past = x.distanceToStopLine('S', { x: LANE_W / 2, y: 3 });
    expect(past).toBeLessThan(0);
  });

  it('exitSide: повороты из южного подъезда', () => {
    expect(x.exitSide('S', 'straight')).toBe('N');
    expect(x.exitSide('S', 'left')).toBe('W');
    expect(x.exitSide('S', 'right')).toBe('E');
    expect(x.exitSide('E', 'left')).toBe('S');
    expect(x.exitSide('N', 'right')).toBe('W');
    expect(x.exitSide('S', 'uturn')).toBe('S');
  });

  it('путь разворота возвращает на свою дорогу во встречную полосу', () => {
    const p = x.path('S', 'uturn');
    const last = p[p.length - 1];
    expect(last.y).toBeGreaterThan(x.box.yMax + 15);
    expect(last.x).toBeCloseTo(-LANE_W / 2);
    for (const q of p) {
      expect(x.isOnRoad(q), `(${q.x.toFixed(1)},${q.y.toFixed(1)})`).toBe(true);
    }
  });

  it('путь прямо: начинается на спавне, кончается за перекрёстком', () => {
    const p = x.path('S', 'straight');
    const spawn = x.spawnPoint('S');
    expect(p[0].x).toBeCloseTo(spawn.x);
    expect(p[0].y).toBeCloseTo(spawn.y);
    const last = p[p.length - 1];
    expect(last.x).toBeCloseTo(LANE_W / 2);
    expect(last.y).toBeLessThan(x.box.yMin - 15);
  });

  it('путь налево из S выходит на западную дорогу по правой полосе', () => {
    const p = x.path('S', 'left');
    const last = p[p.length - 1];
    expect(last.x).toBeLessThan(x.box.xMin - 15);
    // правая полоса западного направления — северная половина: y < 0
    expect(last.y).toBeCloseTo(-LANE_W / 2);
  });

  it('путь направо из S выходит на восточную дорогу по южной полосе', () => {
    const p = x.path('S', 'right');
    const last = p[p.length - 1];
    expect(last.x).toBeGreaterThan(x.box.xMax + 15);
    expect(last.y).toBeCloseTo(LANE_W / 2);
  });

  it('все точки пути лежат на дороге', () => {
    for (const turn of ['left', 'right', 'straight'] as const) {
      for (const a of ['N', 'E', 'S', 'W'] as const) {
        for (const p of x.path(a, turn)) {
          expect(x.isOnRoad(p), `${a}-${turn} (${p.x},${p.y})`).toBe(true);
        }
      }
    }
  });

  it('exitedVia: далеко за перекрёстком на дороге стороны', () => {
    expect(x.exitedVia({ x: LANE_W / 2, y: -(LANE_W + 13) })).toBe('N');
    expect(x.exitedVia({ x: -(LANE_W + 13), y: -LANE_W / 2 })).toBe('W');
    expect(x.exitedVia({ x: LANE_W / 2, y: 5 })).toBeNull();
  });

  it('isOnRoad: вне дорог — false', () => {
    expect(x.isOnRoad({ x: LANE_W + 2, y: LANE_W + 2 })).toBe(false);
    expect(x.isOnRoad({ x: 0, y: 0 })).toBe(true);
  });
});

describe('Intersection: T-образный без северной стороны', () => {
  const t = new Intersection({ approaches: ['E', 'S', 'W'] });

  it('северной дороги нет', () => {
    expect(t.isOnRoad({ x: LANE_W / 2, y: -(LANE_W + 5) })).toBe(false);
    expect(t.exitedVia({ x: LANE_W / 2, y: -(LANE_W + 13) })).toBeNull();
  });
});

describe('Intersection: многополосные подъезды', () => {
  // юг: 2 полосы к перекрёстку (одностороннее), запад: 2 выездных
  const m = new Intersection({
    approaches: ['N', 'E', 'S', 'W'],
    lanes: { S: { in: 2, out: 1 }, W: { in: 1, out: 2 } },
  });

  it('полоса 0 — правая (восточная для северного направления)', () => {
    const l0 = m.spawnPoint('S', 0);
    const l1 = m.spawnPoint('S', 1);
    expect(l0.x).toBeCloseTo(LANE_W * 1.5);
    expect(l1.x).toBeCloseTo(LANE_W * 0.5);
  });

  it('laneIndexAt определяет полосу по точке', () => {
    expect(m.laneIndexAt('S', { x: LANE_W * 1.5, y: 12 })).toBe(0);
    expect(m.laneIndexAt('S', { x: LANE_W * 0.5, y: 12 })).toBe(1);
  });

  it('путь налево из полосы 1 в полосу 1 выезда', () => {
    const p = m.path('S', 'left', { fromLane: 1, toLane: 1 });
    const last = p[p.length - 1];
    // западная сторона, 2 выездных полосы: полоса 1 — ближняя к осевой
    expect(last.y).toBeCloseTo(-LANE_W / 2);
    expect(p[0].x).toBeCloseTo(LANE_W * 0.5);
  });
});

describe('Intersection: круговое движение', () => {
  const r = new Intersection({ approaches: ['N', 'E', 'S', 'W'], roundabout: true });

  it('центральный островок — не дорога', () => {
    expect(r.isOnRoad({ x: 0, y: 0 })).toBe(false);
  });

  it('путь прямо огибает островок и остаётся на дороге', () => {
    const p = r.path('S', 'straight');
    for (const q of p) {
      expect(r.isOnRoad(q), `(${q.x.toFixed(1)},${q.y.toFixed(1)})`).toBe(true);
    }
    const last = p[p.length - 1];
    expect(last.y).toBeLessThan(r.box.yMin - 15);
  });
});
