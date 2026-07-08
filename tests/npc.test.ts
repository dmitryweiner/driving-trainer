import { describe, expect, it } from 'vitest';
import { Intersection, LANE_W } from '../src/game/Intersection';
import { NpcAgent, NPC_APPROACH_DIST } from '../src/game/Npc';
import type { NpcSpec } from '../src/game/types';

const DT = 1 / 30;

function makeAgent(over: Partial<NpcSpec> = {}): { inter: Intersection; npc: NpcAgent } {
  const inter = new Intersection({ approaches: ['N', 'E', 'S', 'W'] });
  const spec: NpcSpec = {
    approach: 'E',
    turn: 'straight',
    order: 0,
    kind: 'car',
    color: '#c33',
    ...over,
  };
  return { inter, npc: new NpcAgent(spec, inter) };
}

describe('NpcAgent', () => {
  it('появляется за несколько метров до стоп-линии', () => {
    const { inter, npc } = makeAgent();
    expect(inter.distanceToStopLine('E', npc.pos)).toBeCloseTo(NPC_APPROACH_DIST, 1);
    expect(npc.entered).toBe(false);
    expect(npc.cleared).toBe(false);
  });

  it('без разрешения останавливается у стоп-линии и стоит', () => {
    const { inter, npc } = makeAgent();
    for (let t = 0; t < 10; t += DT) npc.update(DT, false);
    // останавливается бампером у линии: центр — на полкорпуса раньше
    const d = inter.distanceToStopLine('E', npc.pos);
    expect(d).toBeGreaterThanOrEqual(0);
    expect(d).toBeLessThan(3.5);
    expect(npc.entered).toBe(false);
  });

  it('с разрешением проезжает: entered, затем cleared, затем done', () => {
    const { npc } = makeAgent();
    let sawEntered = false;
    for (let t = 0; t < 20 && !npc.cleared; t += DT) {
      npc.update(DT, true);
      if (npc.entered && !npc.cleared) sawEntered = true;
    }
    expect(sawEntered).toBe(true);
    expect(npc.cleared).toBe(true);
  });

  it('разрешение, выданное после ожидания, приводит к проезду', () => {
    const { npc } = makeAgent();
    for (let t = 0; t < 5; t += DT) npc.update(DT, false);
    for (let t = 0; t < 20 && !npc.cleared; t += DT) npc.update(DT, true);
    expect(npc.cleared).toBe(true);
  });

  it('велосипед медленнее машины', () => {
    const { npc: car } = makeAgent({ kind: 'car' });
    const { npc: bike } = makeAgent({ kind: 'bicycle' });
    for (let t = 0; t < 3; t += DT) {
      car.update(DT, true);
      bike.update(DT, true);
    }
    // машина уже очистила зону или дальше велосипеда
    expect(car.pos.x).toBeLessThan(bike.pos.x);
  });

  it('OBB движется вместе с агентом', () => {
    const { npc } = makeAgent();
    const before = npc.getOBB().cx;
    for (let t = 0; t < 2; t += DT) npc.update(DT, true);
    expect(npc.getOBB().cx).not.toBeCloseTo(before);
    expect(npc.getOBB().cy).toBeCloseTo(-LANE_W / 2, 1);
  });
});
