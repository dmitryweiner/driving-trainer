import { describe, expect, it } from 'vitest';
import { LANE_W } from '../src/game/Intersection';
import { Scenario } from '../src/game/Scenario';
import type { CarInput } from '../src/game/Car';
import type { SceneSpec, Task } from '../src/game/types';

const DT = 1 / 30;
const GO: CarInput = { throttle: 1, brake: 0, steer: 0 };
const IDLE: CarInput = { throttle: 0, brake: 0, steer: 0 };

/** Стоять на месте: тормоз в покое включает задний ход, поэтому тормозим
 * только пока машина движется. */
function wait(sc: Scenario): CarInput {
  return sc.car.velocity > 0.01 ? { throttle: 0, brake: 1, steer: 0 } : IDLE;
}

function makeTask(scene: SceneSpec): Task {
  return {
    id: 'test',
    category: 'priority',
    question: 'q',
    instruction: 'i',
    explanation: 'e',
    scene,
  };
}

/** Крутит сценарий с инпутом от cb, пока не завершится или не выйдет время. */
function run(s: Scenario, cb: (s: Scenario, t: number) => CarInput, maxT = 90): void {
  for (let t = 0; t < maxT && s.state.kind === 'driving'; t += DT) {
    s.update(DT, cb(s, t));
  }
}

describe('Scenario: приоритет на перекрёстке', () => {
  const scene: SceneSpec = {
    kind: 'intersection',
    approaches: ['N', 'E', 'S', 'W'],
    npcs: [
      { approach: 'E', turn: 'straight', order: 0, kind: 'bicycle', color: '#00f', label: '1' },
    ],
    player: { approach: 'S', order: 1, goal: 'straight' },
  };

  it('въезд раньше велосипедиста — провал priority', () => {
    const s = new Scenario(makeTask(scene));
    run(s, () => GO);
    expect(s.state).toMatchObject({ kind: 'failed', reason: 'priority' });
  });

  it('подождать велосипедиста и проехать — успех', () => {
    const s = new Scenario(makeTask(scene));
    // подъехать к линии (очередь трогается при приближении игрока),
    // подождать велосипедиста, затем проехать
    run(s, (sc) => {
      if (sc.npcs[0].cleared) return GO;
      return sc.distanceToStopLine() < 10 ? wait(sc) : GO;
    });
    expect(s.state.kind).toBe('passed');
  });

  it('NPC не трогается, пока игрок далеко от перекрёстка', () => {
    const s = new Scenario(makeTask(scene));
    run(s, (sc) => wait(sc), 4);
    expect(s.npcs[0].entered).toBe(false);
  });

  it('NPC с порядком после игрока ждёт игрока', () => {
    const yieldingScene: SceneSpec = {
      ...scene,
      npcs: [
        { approach: 'W', turn: 'straight', order: 1, kind: 'car', color: '#f00', label: '2' },
      ],
      player: { approach: 'S', order: 0, goal: 'straight' },
    };
    const s = new Scenario(makeTask(yieldingScene));
    // игрок стоит 3 секунды — NPC не должен въехать
    run(s, (sc) => wait(sc), 3);
    expect(s.npcs[0].entered).toBe(false);
    run(s, () => GO);
    expect(s.state.kind).toBe('passed');
  });
});

describe('Scenario: знак «Стоп»', () => {
  const scene: SceneSpec = {
    kind: 'intersection',
    approaches: ['N', 'E', 'S', 'W'],
    signs: [{ approach: 'S', type: 'stop' }],
    player: { approach: 'S', order: 0, goal: 'straight' },
  };

  it('проезд без полной остановки — провал ran-stop', () => {
    const s = new Scenario(makeTask(scene));
    run(s, () => GO);
    expect(s.state).toMatchObject({ kind: 'failed', reason: 'ran-stop' });
  });

  it('полная остановка перед линией, затем проезд — успех', () => {
    const s = new Scenario(makeTask(scene));
    let stopped = false;
    run(s, (sc) => {
      if (stopped) return GO;
      if (sc.distanceToStopLine() < 8 && sc.car.velocity < 0.05) stopped = true;
      return sc.distanceToStopLine() < 8 ? wait(sc) : GO;
    });
    expect(s.state.kind).toBe('passed');
  });
});

describe('Scenario: светофор', () => {
  const scene: SceneSpec = {
    kind: 'intersection',
    approaches: ['N', 'E', 'S', 'W'],
    light: { phases: [{ state: 'red', duration: 4 }, { state: 'green' }] },
    player: { approach: 'S', order: 0, goal: 'straight' },
  };

  it('проезд на красный — провал ran-light', () => {
    const s = new Scenario(makeTask(scene));
    run(s, () => GO);
    expect(s.state).toMatchObject({ kind: 'failed', reason: 'ran-light' });
  });

  it('дождаться зелёного — успех', () => {
    const s = new Scenario(makeTask(scene));
    run(s, (sc) => (sc.lightState() === 'green' ? GO : wait(sc)));
    expect(s.state.kind).toBe('passed');
  });

  it('мигающий жёлтый: быстрый проезд — провал, медленный — успех', () => {
    const flashing: SceneSpec = {
      ...scene,
      light: { phases: [{ state: 'yellow-flashing' }] },
    };
    const fast = new Scenario(makeTask(flashing));
    run(fast, () => GO);
    expect(fast.state).toMatchObject({ kind: 'failed', reason: 'ran-light' });

    const slow = new Scenario(makeTask(flashing));
    run(slow, (sc) =>
      sc.car.velocity > 4 ? { throttle: 0, brake: 0.5, steer: 0 } : { throttle: 0.4, brake: 0, steer: 0 },
    );
    expect(slow.state.kind).toBe('passed');
  });
});

describe('Scenario: направление и дорога', () => {
  it('уехал прямо вместо налево — провал wrong-way', () => {
    const s = new Scenario(
      makeTask({
        kind: 'intersection',
        approaches: ['N', 'E', 'S', 'W'],
        player: { approach: 'S', order: 0, goal: 'left' },
      }),
    );
    run(s, () => GO);
    expect(s.state).toMatchObject({ kind: 'failed', reason: 'wrong-way' });
  });

  it('anyExit: уехал прямо вместо налево — засчитано', () => {
    const s = new Scenario(
      makeTask({
        kind: 'intersection',
        approaches: ['N', 'E', 'S', 'W'],
        player: { approach: 'S', order: 0, goal: 'left', anyExit: true },
      }),
    );
    run(s, () => GO);
    expect(s.state.kind).toBe('passed');
  });

  it('anyExit: возврат назад — всё равно провал wrong-way', () => {
    const s = new Scenario(
      makeTask({
        kind: 'intersection',
        approaches: ['N', 'E', 'S', 'W'],
        player: { approach: 'S', order: 0, goal: 'left', anyExit: true },
      }),
    );
    let phase = 0;
    run(s, (sc) => {
      if (phase === 0 && sc.distanceToStopLine() < 9 && sc.car.velocity < 0.05) phase = 1;
      if (phase === 0) return sc.distanceToStopLine() < 8 ? wait(sc) : GO;
      return { throttle: 0, brake: 1, steer: 0 }; // задний ход
    });
    expect(s.state).toMatchObject({ kind: 'failed', reason: 'wrong-way' });
  });

  it('anyExit: порядок проезда всё равно проверяется', () => {
    const s = new Scenario(
      makeTask({
        kind: 'intersection',
        approaches: ['N', 'E', 'S', 'W'],
        npcs: [{ approach: 'E', turn: 'straight', order: 0, kind: 'car', color: '#00f', label: '1' }],
        player: { approach: 'S', order: 1, goal: 'left', anyExit: true },
      }),
    );
    run(s, () => GO);
    expect(s.state).toMatchObject({ kind: 'failed', reason: 'priority' });
  });

  it('съезд с проезжей части — провал off-road', () => {
    const s = new Scenario(
      makeTask({
        kind: 'intersection',
        approaches: ['N', 'E', 'S', 'W'],
        player: { approach: 'S', order: 0, goal: 'straight' },
      }),
    );
    run(s, () => ({ throttle: 1, brake: 0, steer: 1 }));
    expect(s.state).toMatchObject({ kind: 'failed', reason: 'off-road' });
  });

  it('время вышло — провал timeout', () => {
    const s = new Scenario(
      makeTask({
        kind: 'intersection',
        approaches: ['N', 'E', 'S', 'W'],
        player: { approach: 'S', order: 0, goal: 'straight' },
        timeLimit: 1,
      }),
    );
    run(s, (sc) => wait(sc), 5);
    expect(s.state).toMatchObject({ kind: 'failed', reason: 'timeout' });
  });

  it('разворот выполняется и засчитывается', () => {
    const s = new Scenario(
      makeTask({
        kind: 'intersection',
        approaches: ['N', 'E', 'S', 'W'],
        // разворот требует широкой дороги в обе стороны
        // (радиус манёвра машины ~3.5 м, петля заходит за перекрёсток)
        lanes: { S: { in: 2, out: 2 }, N: { in: 2, out: 2 } },
        player: { approach: 'S', order: 0, goal: 'uturn' },
      }),
    );
    // ведём машину по эталонному пути разворота вручную (медленно, руль по пути)
    const path = s.playerPath;
    let i = 0;
    run(s, (sc) => {
      const pos = sc.car.position;
      while (i < path.length - 1 && Math.hypot(path[i].x - pos.x, path[i].y - pos.y) < 3) i++;
      const target = path[i];
      const desired = Math.atan2(target.y - pos.y, target.x - pos.x);
      let dh = desired - sc.car.heading;
      while (dh > Math.PI) dh -= 2 * Math.PI;
      while (dh < -Math.PI) dh += 2 * Math.PI;
      const steer = Math.max(-1, Math.min(1, dh * 2.5));
      const throttle = sc.car.velocity < 3 ? 0.5 : 0;
      return { throttle, brake: 0, steer };
    });
    expect(s.state.kind).toBe('passed');
  });

  it('вернулся назад вместо проезда — провал wrong-way', () => {
    const s = new Scenario(
      makeTask({
        kind: 'intersection',
        approaches: ['N', 'E', 'S', 'W'],
        player: { approach: 'S', order: 0, goal: 'straight' },
      }),
    );
    // подъехать к линии, затем сдать назад за порог выезда
    let phase = 0;
    run(s, (sc) => {
      if (phase === 0 && sc.distanceToStopLine() < 9 && sc.car.velocity < 0.05) phase = 1;
      if (phase === 0) return sc.distanceToStopLine() < 8 ? wait(sc) : GO;
      return { throttle: 0, brake: 1, steer: 0 }; // задний ход
    });
    expect(s.state).toMatchObject({ kind: 'failed', reason: 'wrong-way' });
  });

  it('старт из другой полосы при манёвре — провал wrong-lane', () => {
    const s = new Scenario(
      makeTask({
        kind: 'intersection',
        approaches: ['N', 'E', 'S', 'W'],
        lanes: { S: { in: 2, out: 1 } },
        player: { approach: 'S', order: 0, goal: 'left', startLane: 1, goalLane: 0 },
      }),
    );
    // телепортируемся в правую полосу (0) и едем — пересечение стоп-линии не из полосы 1
    s.car.position.x = LANE_W * 1.5;
    run(s, () => GO);
    expect(s.state).toMatchObject({ kind: 'failed', reason: 'wrong-lane' });
  });
});

describe('Scenario: прямой участок (kind road)', () => {
  it('превышение в зоне ограничения 40 — провал speeding', () => {
    const s = new Scenario(
      makeTask({
        kind: 'road',
        zones: [{ type: 'speed-limit', at: 10, length: 40, value: 40 }],
        player: { approach: 'S', order: 0, goal: 'straight' },
      }),
    );
    run(s, () => GO);
    expect(s.state).toMatchObject({ kind: 'failed', reason: 'speeding' });
  });

  it('соблюдение лимита — успех', () => {
    const s = new Scenario(
      makeTask({
        kind: 'road',
        zones: [{ type: 'speed-limit', at: 10, length: 40, value: 40 }],
        player: { approach: 'S', order: 0, goal: 'straight' },
      }),
    );
    const limit = 40 / 3.6;
    run(s, (sc) =>
      sc.car.velocity > limit - 1 ? { throttle: 0, brake: 0.3, steer: 0 } : GO,
    );
    expect(s.state.kind).toBe('passed');
  });

  it('пешеход на переходе: не пропустил — провал pedestrian', () => {
    const s = new Scenario(
      makeTask({
        kind: 'road',
        zones: [{ type: 'crosswalk', at: 18, length: 3 }],
        pedestrians: [{ approach: 'S', from: 'right' }],
        player: { approach: 'S', order: 0, goal: 'straight' },
      }),
    );
    run(s, () => GO);
    expect(s.state).toMatchObject({ kind: 'failed', reason: 'pedestrian' });
  });

  it('пешеход пропущен — успех', () => {
    const s = new Scenario(
      makeTask({
        kind: 'road',
        zones: [{ type: 'crosswalk', at: 18, length: 3 }],
        pedestrians: [{ approach: 'S', from: 'right' }],
        player: { approach: 'S', order: 0, goal: 'straight' },
      }),
    );
    run(s, (sc) => (sc.pedestrianOnCrossing() ? wait(sc) : GO));
    expect(s.state.kind).toBe('passed');
  });

  it('жд-переезд с мигающим красным: проезд — провал, ожидание — успех', () => {
    const scene: SceneSpec = {
      kind: 'road',
      zones: [{ type: 'railway', at: 20, length: 5 }],
      light: { phases: [{ state: 'red-flashing', duration: 6 }, { state: 'off' }] },
      player: { approach: 'S', order: 0, goal: 'straight' },
    };
    const fast = new Scenario(makeTask(scene));
    run(fast, () => GO);
    expect(fast.state).toMatchObject({ kind: 'failed', reason: 'ran-light' });

    const patient = new Scenario(makeTask(scene));
    let stopped = false;
    run(patient, (sc) => {
      if (sc.lightState() !== 'off') {
        if (sc.car.velocity < 0.05) stopped = true;
        return sc.distanceToStopLine() < 14 ? wait(sc) : GO;
      }
      return stopped ? GO : wait(sc);
    });
    expect(patient.state.kind).toBe('passed');
  });

  it('сужение с уступкой встречному: въезд первым — провал priority', () => {
    const s = new Scenario(
      makeTask({
        kind: 'road',
        zones: [{ type: 'narrow', at: 20, length: 12 }],
        signs: [{ approach: 'S', type: 'narrow-yield' }],
        npcs: [{ approach: 'N', turn: 'straight', order: 0, kind: 'car', color: '#888' }],
        player: { approach: 'S', order: 1, goal: 'straight' },
      }),
    );
    run(s, () => GO);
    expect(s.state).toMatchObject({ kind: 'failed', reason: 'priority' });
  });
});
