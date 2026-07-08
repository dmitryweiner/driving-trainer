import { describe, expect, it } from 'vitest';
import { Session } from '../src/game/Session';

/** Детерминированный ГСЧ. */
function seqRng(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('Session: порядок задач', () => {
  it('выдаёт все задачи по одному разу за цикл', () => {
    const ids = ['a', 'b', 'c', 'd', 'e'];
    const s = new Session(ids, seqRng([0.3, 0.7, 0.1, 0.9, 0.5]));
    const seen: string[] = [];
    for (let i = 0; i < ids.length; i++) {
      seen.push(s.current());
      s.advance();
    }
    expect([...seen].sort()).toEqual(ids);
  });

  it('после исчерпания перемешивает заново — каждый id дважды за два цикла', () => {
    const ids = ['a', 'b', 'c'];
    const s = new Session(ids, seqRng([0.6, 0.2, 0.8, 0.4]));
    const seen: string[] = [];
    for (let i = 0; i < 6; i++) {
      seen.push(s.current());
      s.advance();
    }
    const counts = new Map<string, number>();
    for (const id of seen) counts.set(id, (counts.get(id) ?? 0) + 1);
    expect([...counts.values()]).toEqual([2, 2, 2]);
  });

  it('порядок детерминирован при одинаковом ГСЧ', () => {
    const ids = ['a', 'b', 'c', 'd'];
    const mk = () => {
      const s = new Session(ids, seqRng([0.11, 0.42, 0.73, 0.24]));
      const out: string[] = [];
      for (let i = 0; i < 4; i++) {
        out.push(s.current());
        s.advance();
      }
      return out;
    };
    expect(mk()).toEqual(mk());
  });

  it('перемешивание действительно меняет порядок', () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    const s = new Session(ids, seqRng([0.9, 0.13, 0.55, 0.31, 0.77, 0.02, 0.6]));
    const out: string[] = [];
    for (let i = 0; i < ids.length; i++) {
      out.push(s.current());
      s.advance();
    }
    expect(out).not.toEqual(ids);
  });
});

describe('Session: статистика', () => {
  it('считает успехи, провалы и процент', () => {
    const s = new Session(['a', 'b'], Math.random);
    s.record(true);
    s.record(false);
    s.record(true);
    expect(s.stats).toEqual({ passed: 2, failed: 1, percent: 67 });
  });

  it('без попыток процент 0', () => {
    const s = new Session(['a'], Math.random);
    expect(s.stats).toEqual({ passed: 0, failed: 0, percent: 0 });
  });

  it('сериализация сохраняет статистику и очередь', () => {
    const s = new Session(['a', 'b', 'c'], seqRng([0.5, 0.2, 0.8]));
    s.record(true);
    s.record(false);
    s.advance();
    const revived = Session.fromJSON(['a', 'b', 'c'], s.toJSON(), Math.random);
    expect(revived.stats).toEqual(s.stats);
    expect(revived.current()).toEqual(s.current());
  });

  it('fromJSON с устаревшим списком id начинает очередь заново', () => {
    const s = new Session(['a', 'b'], Math.random);
    s.record(true);
    const revived = Session.fromJSON(['a', 'b', 'x'], s.toJSON(), Math.random);
    expect(revived.stats.passed).toBe(1);
    expect(['a', 'b', 'x']).toContain(revived.current());
  });

  it('reset обнуляет статистику', () => {
    const s = new Session(['a'], Math.random);
    s.record(true);
    s.resetStats();
    expect(s.stats).toEqual({ passed: 0, failed: 0, percent: 0 });
  });
});
