import type { TaskDef } from './defs';

/** Пешеходные переходы. */
export const pedestrianTasks: TaskDef[] = [
  {
    id: '0132',
    category: 'pedestrians',
    instruction:
      'Перед пешеходным переходом обгон запрещён — обзор ограничен. Пропустите пешехода.',
    scene: {
      kind: 'road',
      zones: [{ type: 'crosswalk', at: 18, length: 3 }],
      signs: [{ approach: 'S', type: 'crosswalk' }],
      pedestrians: [{ approach: 'S', from: 'right' }],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0190',
    category: 'pedestrians',
    instruction:
      'Переход с разделительной полосой — это два разных перехода: пропустите пешеходов с обеих сторон.',
    scene: {
      kind: 'road',
      zones: [{ type: 'crosswalk', at: 18, length: 3 }],
      signs: [{ approach: 'S', type: 'crosswalk' }],
      pedestrians: [
        { approach: 'S', from: 'right' },
        { approach: 'S', from: 'left', delay: 4 },
      ],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0368',
    category: 'pedestrians',
    instruction: 'Знак предупреждает о пешеходах поблизости: снизьте скорость и пропустите пешехода.',
    scene: {
      kind: 'road',
      zones: [{ type: 'crosswalk', at: 20, length: 3 }],
      signs: [{ approach: 'S', type: 'crosswalk-ahead' }],
      pedestrians: [{ approach: 'S', from: 'right', delay: 1 }],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0376',
    category: 'pedestrians',
    instruction: 'Знак обозначает место пешеходного перехода: уступите дорогу пешеходу.',
    scene: {
      kind: 'road',
      zones: [{ type: 'crosswalk', at: 18, length: 3 }],
      signs: [{ approach: 'S', type: 'crosswalk' }],
      pedestrians: [{ approach: 'S', from: 'left' }],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0468',
    category: 'pedestrians',
    instruction: 'Впереди пешеходный переход: подъезжайте готовым остановиться.',
    scene: {
      kind: 'road',
      zones: [{ type: 'crosswalk', at: 22, length: 3 }],
      signs: [{ approach: 'S', type: 'crosswalk-ahead' }],
      pedestrians: [{ approach: 'S', from: 'right', delay: 2 }],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0649',
    category: 'pedestrians',
    instruction: 'Разметка «зебра» обозначает пешеходный переход: пропустите пешехода.',
    scene: {
      kind: 'road',
      zones: [{ type: 'crosswalk', at: 18, length: 3 }],
      pedestrians: [{ approach: 'S', from: 'right' }],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0915',
    category: 'pedestrians',
    instruction:
      'Чтобы избежать наезда: снизьте скорость и вовремя заметьте пешехода, выходящего на проезжую часть.',
    scene: {
      kind: 'road',
      zones: [{ type: 'crosswalk', at: 25, length: 3 }],
      pedestrians: [{ approach: 'S', from: 'right', delay: 3 }],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
];
