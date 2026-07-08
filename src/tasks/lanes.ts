import type { TaskDef } from './defs';

/** Выбор правильной полосы при повороте (серия 01xx isradrive).
 * Номера полос — как на иллюстрациях исходных вопросов. */
export const laneTasks: TaskDef[] = [
  {
    id: '0108',
    category: 'lanes',
    instruction: 'Поверните направо с улицы В на улицу С: с полосы 7 на полосу 6.',
    scene: {
      kind: 'intersection',
      lanes: {
        N: { in: 1, out: 1 },
        S: { in: 2, out: 0 },
        W: { in: 2, out: 2 },
        E: { in: 2, out: 2 },
      },
      player: { approach: 'N', order: 0, goal: 'right', startLane: 0, goalLane: 0 },
      laneLabels: [
        { side: 'N', flow: 'in', index: 0, label: '7' },
        { side: 'N', flow: 'out', index: 0, label: '8' },
        { side: 'S', flow: 'in', index: 0, label: '1' },
        { side: 'S', flow: 'in', index: 1, label: '2' },
        { side: 'W', flow: 'in', index: 0, label: '3' },
        { side: 'W', flow: 'in', index: 1, label: '4' },
        { side: 'W', flow: 'out', index: 0, label: '6' },
        { side: 'W', flow: 'out', index: 1, label: '5' },
      ],
      streetLabels: { N: 'В', S: 'А', W: 'С' },
    },
  },
  {
    id: '0110',
    category: 'lanes',
    instruction:
      'Улица С — односторонняя (налево). Поверните с улицы А на улицу С: с полосы 2 на полосу 3.',
    scene: {
      kind: 'intersection',
      approaches: ['E', 'S', 'W'],
      lanes: {
        S: { in: 2, out: 0 },
        W: { in: 0, out: 2 },
        E: { in: 2, out: 0 },
      },
      player: { approach: 'S', order: 0, goal: 'left', startLane: 1, goalLane: 1 },
      laneLabels: [
        { side: 'S', flow: 'in', index: 0, label: '1' },
        { side: 'S', flow: 'in', index: 1, label: '2' },
        { side: 'W', flow: 'out', index: 0, label: '4' },
        { side: 'W', flow: 'out', index: 1, label: '3' },
      ],
      streetLabels: { S: 'А', W: 'С', E: 'В' },
    },
  },
  {
    id: '0111',
    category: 'lanes',
    instruction: 'Поверните налево с улицы А на улицу С: с полосы 2 на полосу 4.',
    scene: {
      kind: 'intersection',
      approaches: ['E', 'S', 'W'],
      lanes: {
        S: { in: 2, out: 0 },
        W: { in: 1, out: 1 },
        E: { in: 1, out: 1 },
      },
      player: { approach: 'S', order: 0, goal: 'left', startLane: 1, goalLane: 0 },
      laneLabels: [
        { side: 'S', flow: 'in', index: 0, label: '1' },
        { side: 'S', flow: 'in', index: 1, label: '2' },
        { side: 'W', flow: 'in', index: 0, label: '3' },
        { side: 'W', flow: 'out', index: 0, label: '4' },
      ],
      streetLabels: { S: 'А', W: 'С', E: 'В' },
    },
  },
  {
    id: '0112',
    category: 'lanes',
    instruction: 'Поверните налево с улицы А на улицу С: с полосы 2 на полосу 5.',
    scene: {
      kind: 'intersection',
      approaches: ['E', 'S', 'W'],
      lanes: {
        S: { in: 2, out: 0 },
        W: { in: 2, out: 2 },
        E: { in: 2, out: 2 },
      },
      player: { approach: 'S', order: 0, goal: 'left', startLane: 1, goalLane: 1 },
      laneLabels: [
        { side: 'S', flow: 'in', index: 0, label: '1' },
        { side: 'S', flow: 'in', index: 1, label: '2' },
        { side: 'W', flow: 'in', index: 0, label: '3' },
        { side: 'W', flow: 'in', index: 1, label: '4' },
        { side: 'W', flow: 'out', index: 0, label: '6' },
        { side: 'W', flow: 'out', index: 1, label: '5' },
      ],
      streetLabels: { S: 'А', W: 'С' },
    },
  },
  {
    id: '0113',
    category: 'lanes',
    instruction:
      'Улица справа — односторонняя от перекрёстка. Поверните налево с улицы А на улицу С: с полосы 2 на полосу 4.',
    scene: {
      kind: 'intersection',
      approaches: ['E', 'S', 'W'],
      lanes: {
        S: { in: 2, out: 1 },
        W: { in: 1, out: 1 },
        E: { in: 0, out: 2 },
      },
      player: { approach: 'S', order: 0, goal: 'left', startLane: 1, goalLane: 0 },
      laneLabels: [
        { side: 'S', flow: 'in', index: 0, label: '1' },
        { side: 'S', flow: 'in', index: 1, label: '2' },
        { side: 'W', flow: 'in', index: 0, label: '3' },
        { side: 'W', flow: 'out', index: 0, label: '4' },
        { side: 'E', flow: 'out', index: 0, label: '5' },
        { side: 'E', flow: 'out', index: 1, label: '6' },
      ],
      streetLabels: { S: 'А', W: 'С', E: 'В' },
    },
  },
  {
    id: '0114',
    category: 'lanes',
    instruction:
      'Улица С — с разделительной полосой. Поверните налево с улицы А: с полосы 1 на полосу 3.',
    scene: {
      kind: 'intersection',
      approaches: ['E', 'S', 'W'],
      lanes: {
        S: { in: 1, out: 1 },
        W: { in: 2, out: 2 },
        E: { in: 2, out: 2 },
      },
      player: { approach: 'S', order: 0, goal: 'left', startLane: 0, goalLane: 1 },
      laneLabels: [
        { side: 'S', flow: 'in', index: 0, label: '1' },
        { side: 'S', flow: 'out', index: 0, label: '2' },
        { side: 'W', flow: 'in', index: 0, label: '5' },
        { side: 'W', flow: 'in', index: 1, label: '6' },
        { side: 'W', flow: 'out', index: 0, label: '4' },
        { side: 'W', flow: 'out', index: 1, label: '3' },
      ],
      streetLabels: { S: 'А', W: 'С' },
    },
  },
  {
    id: '0115',
    category: 'lanes',
    instruction: 'Поверните налево с улицы А на улицу Б: с полосы 1 на полосу 4.',
    scene: {
      kind: 'intersection',
      approaches: ['E', 'S', 'W'],
      lanes: {
        S: { in: 1, out: 1 },
        W: { in: 1, out: 1 },
        E: { in: 1, out: 1 },
      },
      player: { approach: 'S', order: 0, goal: 'left', startLane: 0, goalLane: 0 },
      laneLabels: [
        { side: 'S', flow: 'in', index: 0, label: '1' },
        { side: 'S', flow: 'out', index: 0, label: '2' },
        { side: 'W', flow: 'in', index: 0, label: '3' },
        { side: 'W', flow: 'out', index: 0, label: '4' },
      ],
      streetLabels: { S: 'А', W: 'Б', E: 'С' },
    },
  },
  {
    id: '0116',
    category: 'lanes',
    instruction:
      'Улица С — односторонняя. Поверните налево с улицы С на улицу А: с полосы 5 на полосу 4.',
    scene: {
      kind: 'intersection',
      approaches: ['E', 'S', 'W'],
      lanes: {
        S: { in: 2, out: 2 },
        E: { in: 2, out: 0 },
        W: { in: 0, out: 2 },
      },
      player: { approach: 'E', order: 0, goal: 'left', startLane: 1, goalLane: 0 },
      laneLabels: [
        { side: 'E', flow: 'in', index: 0, label: '6' },
        { side: 'E', flow: 'in', index: 1, label: '5' },
        { side: 'S', flow: 'in', index: 0, label: '1' },
        { side: 'S', flow: 'in', index: 1, label: '2' },
        { side: 'S', flow: 'out', index: 0, label: '4' },
        { side: 'S', flow: 'out', index: 1, label: '3' },
      ],
      streetLabels: { S: 'А', E: 'С' },
    },
  },
];
