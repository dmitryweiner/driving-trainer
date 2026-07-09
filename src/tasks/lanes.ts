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
  {
    id: '0646',
    category: 'lanes',
    instruction: 'Поворот налево выполняется с левой полосы вашего направления.',
    scene: {
      kind: 'intersection',
      lanes: {
        S: { in: 2, out: 1 },
        N: { in: 1, out: 2 },
      },
      player: { approach: 'S', order: 0, goal: 'left', startLane: 1, goalLane: 0 },
    },
  },
  {
    id: '0651',
    category: 'lanes',
    instruction:
      'Стрелка на вашей полосе обязывает повернуть налево на ближайшем перекрёстке.',
    scene: {
      kind: 'intersection',
      approaches: ['E', 'S', 'W'],
      lanes: {
        S: { in: 2, out: 1 },
      },
      player: { approach: 'S', order: 0, goal: 'left', startLane: 1, goalLane: 0 },
    },
  },
  {
    id: '0727',
    category: 'lanes',
    instruction: 'Чтобы повернуть налево, займите левую из трёх полос и поверните с неё.',
    scene: {
      kind: 'intersection',
      lanes: {
        S: { in: 3, out: 1 },
        N: { in: 1, out: 3 },
      },
      player: { approach: 'S', order: 0, goal: 'left', startLane: 2, goalLane: 0 },
    },
  },
  {
    id: '0756',
    category: 'lanes',
    instruction: 'Две полосы в вашем направлении: двигайтесь по правой и проезжайте прямо.',
    scene: {
      kind: 'intersection',
      lanes: {
        S: { in: 2, out: 1 },
        N: { in: 1, out: 2 },
      },
      player: { approach: 'S', order: 0, goal: 'straight', startLane: 0, goalLane: 0 },
    },
  },
  {
    id: '0783',
    category: 'lanes',
    instruction:
      'Обе полосы предназначены для поворота направо: поворачивайте с левой полосы во вторую полосу.',
    scene: {
      kind: 'intersection',
      lanes: {
        S: { in: 2, out: 1 },
        E: { in: 1, out: 2 },
      },
      player: { approach: 'S', order: 0, goal: 'right', startLane: 1, goalLane: 1 },
    },
  },
  {
    id: '0791',
    category: 'lanes',
    instruction:
      'Обе полосы односторонней дороги — для поворота налево: можно повернуть и с правой из них, в правую полосу.',
    scene: {
      kind: 'intersection',
      approaches: ['E', 'S', 'W'],
      lanes: {
        S: { in: 2, out: 0 },
        W: { in: 0, out: 2 },
        E: { in: 2, out: 0 },
      },
      player: { approach: 'S', order: 0, goal: 'left', startLane: 0, goalLane: 0 },
    },
  },
  {
    id: '0784',
    category: 'lanes',
    instruction:
      'Поверните налево с двухсторонней улицы А на одностороннюю Б: с полосы 2 на полосу 5.',
    scene: {
      kind: 'intersection',
      approaches: ['E', 'S', 'W'],
      lanes: {
        S: { in: 2, out: 2 },
        W: { in: 0, out: 2 },
        E: { in: 2, out: 0 },
      },
      player: { approach: 'S', order: 0, goal: 'left', startLane: 1, goalLane: 1 },
      laneLabels: [
        { side: 'S', flow: 'in', index: 0, label: '1' },
        { side: 'S', flow: 'in', index: 1, label: '2' },
        { side: 'S', flow: 'out', index: 0, label: '4' },
        { side: 'S', flow: 'out', index: 1, label: '3' },
        { side: 'W', flow: 'out', index: 0, label: '6' },
        { side: 'W', flow: 'out', index: 1, label: '5' },
      ],
      streetLabels: { S: 'А', W: 'Б' },
    },
  },
  {
    id: '0119',
    category: 'lanes',
    instruction: 'Разворот налево выполняется с левой полосы: развернитесь на перекрёстке.',
    scene: {
      kind: 'intersection',
      lanes: { S: { in: 2, out: 2 }, N: { in: 2, out: 2 } },
      player: { approach: 'S', order: 0, goal: 'uturn', startLane: 1 },
    },
  },
  {
    id: '0559',
    category: 'lanes',
    instruction:
      'Знаков и разметки, запрещающих разворот, нет: развернитесь влево с левой полосы.',
    scene: {
      kind: 'intersection',
      lanes: { S: { in: 2, out: 2 }, N: { in: 2, out: 2 } },
      player: { approach: 'S', order: 0, goal: 'uturn', startLane: 1 },
    },
  },
  {
    id: '1742',
    category: 'lanes',
    instruction:
      'Запрещающего знака нет — разворот разрешён с любой полосы. Развернитесь с правой полосы.',
    scene: {
      kind: 'intersection',
      lanes: { S: { in: 2, out: 2 }, N: { in: 2, out: 2 } },
      player: { approach: 'S', order: 0, goal: 'uturn', startLane: 0 },
    },
  },
  {
    id: '1718',
    category: 'lanes',
    instruction:
      'Светофора нет: пропустите встречный автомобиль и развернитесь, не мешая движению.',
    scene: {
      kind: 'intersection',
      lanes: { S: { in: 2, out: 2 }, N: { in: 2, out: 2 } },
      npcs: [{ approach: 'N', turn: 'straight', order: 0, kind: 'car', color: '#3355cc', label: '1' }],
      player: { approach: 'S', order: 1, goal: 'uturn', startLane: 1 },
    },
  },
  {
    id: '0117',
    category: 'lanes',
    instruction:
      'Помех нет, запрещающего знака нет: развернитесь на перекрёстке.',
    scene: {
      kind: 'intersection',
      lanes: { S: { in: 2, out: 2 }, N: { in: 2, out: 2 } },
      player: { approach: 'S', order: 0, goal: 'uturn', startLane: 1 },
    },
  },
];
