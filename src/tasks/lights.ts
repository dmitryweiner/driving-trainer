import type { TaskDef } from './defs';

/** Светофоры и железнодорожные переезды. */
export const lightTasks: TaskDef[] = [
  {
    id: '0093',
    category: 'lights',
    instruction:
      'Зелёный мигает (сменится жёлтым через три мигания). Проезжайте, если успеваете; на жёлтый и красный — стойте.',
    scene: {
      kind: 'intersection',
      light: {
        phases: [
          { state: 'green-flashing', duration: 3 },
          { state: 'yellow', duration: 2 },
          { state: 'red', duration: 6 },
          { state: 'green' },
        ],
      },
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0186',
    category: 'lights',
    instruction:
      'Мигающий жёлтый: снизьте скорость и уступите автомобилю справа (правило правой руки).',
    scene: {
      kind: 'intersection',
      light: { phases: [{ state: 'yellow-flashing' }] },
      npcs: [{ approach: 'E', turn: 'straight', order: 0, kind: 'car', color: '#3355cc', label: '1' }],
      player: { approach: 'S', order: 1, goal: 'straight' },
    },
  },
  {
    id: '0246',
    category: 'lights',
    instruction: 'Мигающий жёлтый: замедлите движение и проезжайте осторожно.',
    scene: {
      kind: 'intersection',
      light: { phases: [{ state: 'yellow-flashing' }] },
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0518',
    category: 'lights',
    instruction: 'Зелёный мигает — сейчас сменится жёлтым. Проезжайте, если успеваете, иначе ждите зелёного.',
    scene: {
      kind: 'intersection',
      light: {
        phases: [
          { state: 'green-flashing', duration: 3 },
          { state: 'yellow', duration: 2 },
          { state: 'red', duration: 6 },
          { state: 'green' },
        ],
      },
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0560',
    category: 'lights',
    instruction:
      'Жёлтая стрелка светофора — только для общественного транспорта. Дождитесь зелёного сигнала.',
    scene: {
      kind: 'intersection',
      light: { phases: [{ state: 'red', duration: 6 }, { state: 'green' }] },
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0664',
    category: 'lights',
    instruction: 'Красный свет: остановитесь и дождитесь зелёного.',
    scene: {
      kind: 'intersection',
      light: { phases: [{ state: 'red', duration: 6 }, { state: 'green' }] },
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0665',
    category: 'lights',
    instruction: 'Красный свет: стойте перед стоп-линией, пока не загорится зелёный.',
    scene: {
      kind: 'intersection',
      light: { phases: [{ state: 'red', duration: 8 }, { state: 'green' }] },
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0666',
    category: 'lights',
    instruction: 'Зелёный свет: проезжайте, но только когда перекрёсток освободится от трактора.',
    scene: {
      kind: 'intersection',
      light: { phases: [{ state: 'green' }] },
      npcs: [{ approach: 'E', turn: 'straight', order: 0, kind: 'tractor', color: '#337733', label: '1' }],
      player: { approach: 'S', order: 1, goal: 'straight' },
    },
  },
  {
    id: '0667',
    category: 'lights',
    instruction: 'Немигающий жёлтый: остановитесь перед перекрёстком и дождитесь зелёного.',
    scene: {
      kind: 'intersection',
      light: {
        phases: [
          { state: 'yellow', duration: 3 },
          { state: 'red', duration: 6 },
          { state: 'green' },
        ],
      },
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0668',
    category: 'lights',
    instruction:
      'Мигающий жёлтый: снизьте скорость и действуйте по правилам приоритета — уступите велосипедисту справа.',
    scene: {
      kind: 'intersection',
      light: { phases: [{ state: 'yellow-flashing' }] },
      npcs: [{ approach: 'E', turn: 'straight', order: 0, kind: 'bicycle', color: '#2266aa', label: '1' }],
      player: { approach: 'S', order: 1, goal: 'straight' },
    },
  },
  {
    id: '0669',
    category: 'lights',
    instruction: 'Зелёная стрелка прямо: двигайтесь только в направлении стрелки.',
    scene: {
      kind: 'intersection',
      light: { phases: [{ state: 'green' }] },
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0672',
    category: 'lights',
    instruction: 'Мигающий жёлтый: продвигайтесь осторожно и дайте пешеходу перейти дорогу.',
    scene: {
      kind: 'intersection',
      light: { phases: [{ state: 'yellow-flashing' }] },
      pedestrians: [{ approach: 'S', from: 'right' }],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0673',
    category: 'lights',
    instruction:
      'Мигающий красный перед жд-переездом: остановитесь и не двигайтесь, пока сигнал не погаснет.',
    scene: {
      kind: 'road',
      zones: [{ type: 'railway', at: 22, length: 6 }],
      light: { phases: [{ state: 'red-flashing', duration: 7 }, { state: 'off' }] },
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0674',
    category: 'lights',
    instruction:
      'Красные лампочки мигают: полная остановка перед переездом, ехать можно только когда мигание прекратится.',
    scene: {
      kind: 'road',
      zones: [{ type: 'railway', at: 22, length: 6 }],
      light: { phases: [{ state: 'red-flashing', duration: 9 }, { state: 'off' }] },
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0693',
    category: 'lights',
    instruction: 'Красный свет: остановитесь перед стоп-линией и дождитесь зелёного.',
    scene: {
      kind: 'intersection',
      light: { phases: [{ state: 'red', duration: 5 }, { state: 'green' }] },
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0978',
    category: 'lights',
    instruction:
      'Красный с жёлтым: приготовьтесь, но не двигайтесь. Поезжайте, когда загорится зелёный.',
    scene: {
      kind: 'intersection',
      light: {
        phases: [
          { state: 'red', duration: 3 },
          { state: 'red-yellow', duration: 2 },
          { state: 'green' },
        ],
      },
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
];
