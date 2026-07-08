import { describe, expect, it } from 'vitest';
import { Scenario } from '../src/game/Scenario';
import { taskDefs, tasks } from '../src/tasks';
import { Autopilot } from './helpers/autopilot';

const DT = 1 / 30;

describe('Реестр задач', () => {
  it('задач порядка ста', () => {
    expect(tasks.length).toBeGreaterThanOrEqual(90);
  });

  it('id уникальны', () => {
    const ids = tasks.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('у каждой задачи есть вопрос, инструкция и пояснение', () => {
    for (const t of tasks) {
      expect(t.question.length, t.id).toBeGreaterThan(10);
      expect(t.instruction.length, t.id).toBeGreaterThan(10);
      // некоторые ответы — просто номер знака («115»)
      expect(t.explanation.length, t.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('ссылки сцен корректны (подъезды, полосы, порядок)', () => {
    for (const def of taskDefs) {
      const scene = def.scene;
      if (scene.kind === 'intersection') {
        const approaches = scene.approaches ?? ['N', 'E', 'S', 'W'];
        expect(approaches, def.id).toContain(scene.player.approach);
        for (const npc of scene.npcs ?? []) {
          if (!npc.ring) expect(approaches, def.id).toContain(npc.approach);
        }
        for (const sign of scene.signs ?? []) {
          expect(approaches, def.id).toContain(sign.approach);
        }
      }
      // порядок игрока не совпадает с порядком NPC
      for (const npc of scene.npcs ?? []) {
        expect(npc.order, def.id).not.toBe(scene.player.order);
      }
    }
  });
});

describe('Разрешимость: автопилот проходит каждую задачу', () => {
  for (const task of tasks) {
    it(`${task.id}: ${task.instruction.slice(0, 60)}`, () => {
      const sc = new Scenario(task);
      const ap = new Autopilot(sc);
      const limit = sc.timeLimit;
      for (let t = 0; t < limit && sc.state.kind === 'driving'; t += DT) {
        sc.update(DT, ap.update());
      }
      expect(sc.state).toEqual({ kind: 'passed' });
    });
  }
});
