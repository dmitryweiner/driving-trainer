import type { TaskDef } from './defs';

/** Порядок проезда и предоставление приоритета (серия 07xx isradrive). */
export const priorityTasks: TaskDef[] = [
  {
    id: '0697',
    category: 'priority',
    instruction: 'Поверните налево, уступив дорогу синему автомобилю.',
    scene: {
      kind: 'intersection',
      npcs: [
        { approach: 'N', turn: 'straight', order: 0, kind: 'car', color: '#3355cc', label: '1' },
        { approach: 'W', turn: 'straight', order: 2, kind: 'car', color: '#cc3333', label: '2' },
      ],
      player: { approach: 'S', order: 1, goal: 'left' },
    },
  },
  {
    id: '0698',
    category: 'priority',
    instruction: 'Проедьте перекрёсток прямо. Велосипедист приближается справа — уступите ему.',
    scene: {
      kind: 'intersection',
      npcs: [{ approach: 'E', turn: 'straight', order: 0, kind: 'bicycle', color: '#2266aa', label: '1' }],
      player: { approach: 'S', order: 1, goal: 'straight' },
    },
  },
  {
    id: '0699',
    category: 'priority',
    instruction: 'Поверните налево, уступив мотоциклисту и велосипедисту.',
    scene: {
      kind: 'intersection',
      npcs: [
        { approach: 'E', turn: 'straight', order: 0, kind: 'motorcycle', color: '#aa2222', label: '1' },
        { approach: 'N', turn: 'straight', order: 1, kind: 'bicycle', color: '#226622', label: '2' },
      ],
      player: { approach: 'S', order: 2, goal: 'left' },
    },
  },
  {
    id: '0700',
    category: 'priority',
    instruction:
      'Знаков нет, все подъехали одновременно. Проезжайте вторым — после автомобиля справа. Направление выезда — любое.',
    scene: {
      kind: 'intersection',
      npcs: [
        { approach: 'E', turn: 'straight', order: 0, kind: 'car', color: '#337733', label: '1' },
        { approach: 'W', turn: 'straight', order: 2, kind: 'car', color: '#cc3333', label: '2' },
      ],
      player: { approach: 'S', order: 1, goal: 'left', anyExit: true },
    },
  },
  {
    id: '0701',
    category: 'priority',
    instruction:
      'Первым проедет мусоровоз, вторым — легковой автомобиль, затем вы. Направление выезда — любое.',
    scene: {
      kind: 'intersection',
      npcs: [
        { approach: 'N', turn: 'left', order: 0, kind: 'truck', color: '#cc4422', label: '1' },
        { approach: 'E', turn: 'straight', order: 1, kind: 'car', color: '#bb3333', label: '2' },
      ],
      player: { approach: 'S', order: 2, goal: 'left', anyExit: true },
    },
  },
  {
    id: '0702',
    category: 'priority',
    instruction:
      'Первым въезжает велосипедист справа, затем вы. Направление выезда — любое.',
    scene: {
      kind: 'intersection',
      npcs: [
        { approach: 'E', turn: 'straight', order: 0, kind: 'bicycle', color: '#2266aa', label: '1' },
        { approach: 'W', turn: 'straight', order: 2, kind: 'motorcycle', color: '#aa3322', label: '2' },
      ],
      player: { approach: 'S', order: 1, goal: 'straight', anyExit: true },
    },
  },
  {
    id: '0703',
    category: 'priority',
    instruction:
      'Сперва велосипедист, затем красный автомобиль, затем вы. Направление выезда — любое.',
    scene: {
      kind: 'intersection',
      npcs: [
        { approach: 'N', turn: 'straight', order: 0, kind: 'bicycle', color: '#226622', label: '2' },
        { approach: 'E', turn: 'left', order: 1, kind: 'car', color: '#cc2222', label: '1' },
      ],
      player: { approach: 'S', order: 2, goal: 'left', anyExit: true },
    },
  },
  {
    id: '0704',
    category: 'priority',
    instruction:
      'Сперва мотоциклист, затем синий автомобиль, затем вы. Направление выезда — любое.',
    scene: {
      kind: 'intersection',
      npcs: [
        { approach: 'N', turn: 'straight', order: 0, kind: 'motorcycle', color: '#993322', label: '2' },
        { approach: 'E', turn: 'straight', order: 1, kind: 'car', color: '#3355cc', label: '1' },
      ],
      player: { approach: 'S', order: 2, goal: 'left', anyExit: true },
    },
  },
  {
    id: '0705',
    category: 'priority',
    instruction:
      'Проезжайте первым (направление — любое): красный грузовик и велосипедист въезжают после вас.',
    scene: {
      kind: 'intersection',
      npcs: [
        { approach: 'W', turn: 'straight', order: 1, kind: 'truck', color: '#cc2222', label: '2' },
        { approach: 'N', turn: 'straight', order: 2, kind: 'bicycle', color: '#226622', label: '1' },
      ],
      player: { approach: 'S', order: 0, goal: 'straight', anyExit: true },
    },
  },
  {
    id: '0706',
    category: 'priority',
    instruction: 'Въезжайте на круг, уступив велосипедисту, который уже движется по кольцу.',
    scene: {
      kind: 'intersection',
      roundabout: true,
      signs: [{ approach: 'S', type: 'roundabout' }],
      npcs: [
        {
          approach: 'W',
          turn: 'straight',
          order: 0,
          kind: 'bicycle',
          color: '#2266aa',
          label: '2',
          ring: { fromAngleDeg: 180, toSide: 'E' },
        },
      ],
      player: { approach: 'S', order: 1, goal: 'straight' },
    },
  },
  {
    id: '0708',
    category: 'priority',
    instruction: 'У вас знак «уступи дорогу»: пропустите трактор и грузовик на пересекающей дороге.',
    scene: {
      kind: 'intersection',
      signs: [{ approach: 'S', type: 'yield' }],
      npcs: [
        { approach: 'E', turn: 'straight', order: 0, kind: 'tractor', color: '#337733', label: '1' },
        { approach: 'W', turn: 'straight', order: 1, kind: 'truck', color: '#cc2222', label: '2' },
      ],
      player: { approach: 'S', order: 2, goal: 'straight' },
    },
  },
  {
    id: '0709',
    category: 'priority',
    instruction: 'У вас знак «уступи дорогу»: пропустите жёлтый автобус и мотоциклиста.',
    scene: {
      kind: 'intersection',
      signs: [{ approach: 'S', type: 'yield' }],
      npcs: [
        { approach: 'N', turn: 'straight', order: 0, kind: 'bus', color: '#ddaa22', label: '1' },
        { approach: 'W', turn: 'straight', order: 1, kind: 'motorcycle', color: '#aa3322', label: '2' },
      ],
      player: { approach: 'S', order: 2, goal: 'straight' },
    },
  },
  {
    id: '0710',
    category: 'priority',
    instruction: 'Поверните налево, пропустив встречного мотоциклиста.',
    scene: {
      kind: 'intersection',
      signs: [{ approach: 'W', type: 'yield' }],
      npcs: [
        { approach: 'N', turn: 'straight', order: 0, kind: 'motorcycle', color: '#aa3322', label: '1' },
        { approach: 'W', turn: 'straight', order: 2, kind: 'car', color: '#cc4444', label: '2' },
      ],
      player: { approach: 'S', order: 1, goal: 'left' },
    },
  },
  {
    id: '0711',
    category: 'priority',
    instruction: 'Поверните налево, уступив мотоциклисту и автобусу.',
    scene: {
      kind: 'intersection',
      npcs: [
        { approach: 'N', turn: 'straight', order: 0, kind: 'motorcycle', color: '#883322', label: '1' },
        { approach: 'E', turn: 'straight', order: 1, kind: 'bus', color: '#8899cc', label: '2' },
      ],
      player: { approach: 'S', order: 2, goal: 'left' },
    },
  },
  {
    id: '0712',
    category: 'priority',
    instruction:
      'У вас знак «стоп»: полностью остановитесь и проезжайте после велосипедиста и автобуса. Направление выезда — любое.',
    scene: {
      kind: 'intersection',
      signs: [{ approach: 'S', type: 'stop' }],
      npcs: [
        { approach: 'W', turn: 'straight', order: 0, kind: 'bicycle', color: '#2266aa', label: '2' },
        { approach: 'N', turn: 'straight', order: 1, kind: 'bus', color: '#ddaa22', label: '1' },
      ],
      player: { approach: 'S', order: 2, goal: 'left', anyExit: true },
    },
  },
  {
    id: '0715',
    category: 'priority',
    instruction:
      'Поверните налево: жёлтый автомобиль обязан уступить вам. Двигайтесь осторожно, сохраняя зрительный контакт.',
    scene: {
      kind: 'intersection',
      approaches: ['E', 'S', 'W'],
      signs: [{ approach: 'E', type: 'yield' }],
      npcs: [{ approach: 'E', turn: 'straight', order: 1, kind: 'car', color: '#ddaa22', label: '1' }],
      player: { approach: 'S', order: 0, goal: 'left' },
    },
  },
  {
    id: '0716',
    category: 'priority',
    instruction:
      'Проезжайте первым (направление — любое): у трактора и синего автомобиля знак «уступи дорогу».',
    scene: {
      kind: 'intersection',
      signs: [
        { approach: 'W', type: 'yield' },
        { approach: 'N', type: 'yield' },
      ],
      npcs: [
        { approach: 'W', turn: 'straight', order: 1, kind: 'tractor', color: '#337733', label: '2' },
        { approach: 'N', turn: 'straight', order: 2, kind: 'car', color: '#3355cc', label: '1' },
      ],
      player: { approach: 'S', order: 0, goal: 'left', anyExit: true },
    },
  },
  {
    id: '0717',
    category: 'priority',
    instruction:
      'У вас знак «уступи дорогу»: сперва красный автомобиль, затем мотоцикл, затем вы. Направление выезда — любое.',
    scene: {
      kind: 'intersection',
      signs: [{ approach: 'S', type: 'yield' }],
      npcs: [
        { approach: 'E', turn: 'straight', order: 0, kind: 'car', color: '#cc2222', label: '1' },
        { approach: 'W', turn: 'straight', order: 1, kind: 'motorcycle', color: '#aa3322', label: '2' },
      ],
      player: { approach: 'S', order: 2, goal: 'straight', anyExit: true },
    },
  },
  {
    id: '0718',
    category: 'priority',
    instruction: 'Поверните налево, уступив синему легковому автомобилю.',
    scene: {
      kind: 'intersection',
      npcs: [
        { approach: 'N', turn: 'straight', order: 0, kind: 'car', color: '#3355cc', label: '1' },
        { approach: 'W', turn: 'straight', order: 2, kind: 'truck', color: '#cc2222', label: '2' },
      ],
      player: { approach: 'S', order: 1, goal: 'left' },
    },
  },
  {
    id: '0719',
    category: 'priority',
    instruction: 'Проезжайте прямо первым: у обоих автомобилей знак «уступи дорогу».',
    scene: {
      kind: 'intersection',
      signs: [
        { approach: 'E', type: 'yield' },
        { approach: 'W', type: 'yield' },
      ],
      npcs: [
        { approach: 'E', turn: 'straight', order: 1, kind: 'car', color: '#3355cc', label: '1' },
        { approach: 'W', turn: 'straight', order: 2, kind: 'car', color: '#ddaa22', label: '2' },
      ],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0720',
    category: 'priority',
    instruction: 'Поверните налево, пропустив мотоциклиста.',
    scene: {
      kind: 'intersection',
      npcs: [{ approach: 'N', turn: 'straight', order: 0, kind: 'motorcycle', color: '#aa3322', label: '1' }],
      player: { approach: 'S', order: 1, goal: 'left' },
    },
  },
  {
    id: '0724',
    category: 'priority',
    instruction:
      'Знаков нет, правило правой руки: сперва автомобиль справа, затем вы, затем автомобиль слева. Направление выезда — любое.',
    scene: {
      kind: 'intersection',
      npcs: [
        { approach: 'E', turn: 'straight', order: 0, kind: 'car', color: '#cc2222', label: '1' },
        { approach: 'W', turn: 'straight', order: 2, kind: 'car', color: '#cc2222', label: '2' },
      ],
      player: { approach: 'S', order: 1, goal: 'straight', anyExit: true },
    },
  },
  {
    id: '0725',
    category: 'priority',
    instruction: 'Поверните направо, пропустив велосипедиста, который едет прямо вдоль вашей дороги.',
    scene: {
      kind: 'intersection',
      npcs: [
        { approach: 'S', turn: 'straight', order: 0, kind: 'bicycle', color: '#2266aa', label: '1' },
        { approach: 'W', turn: 'straight', order: 2, kind: 'car', color: '#3355cc', label: '2' },
      ],
      player: { approach: 'S', order: 1, goal: 'right' },
    },
  },
  {
    id: '0973',
    category: 'priority',
    instruction: 'Вы въезжаете на дорогу со второстепенной: уступите белому автомобилю и поверните направо.',
    scene: {
      kind: 'intersection',
      approaches: ['E', 'S', 'W'],
      signs: [{ approach: 'S', type: 'yield' }],
      npcs: [{ approach: 'W', turn: 'straight', order: 0, kind: 'car', color: '#eeeeee', label: '1' }],
      player: { approach: 'S', order: 1, goal: 'right' },
    },
  },
  {
    id: '0175',
    category: 'priority',
    instruction: 'Поверните налево, уступив встречному автомобилю и автомобилю справа.',
    scene: {
      kind: 'intersection',
      npcs: [
        { approach: 'N', turn: 'straight', order: 0, kind: 'car', color: '#3355cc', label: '1' },
        { approach: 'E', turn: 'straight', order: 1, kind: 'car', color: '#cc8822', label: '2' },
      ],
      player: { approach: 'S', order: 2, goal: 'left' },
    },
  },
  {
    id: '1741',
    category: 'priority',
    instruction: 'Знаков нет: уступите автомобилю, приближающемуся справа, и проезжайте прямо.',
    scene: {
      kind: 'intersection',
      npcs: [{ approach: 'E', turn: 'straight', order: 0, kind: 'car', color: '#aa3355', label: '1' }],
      player: { approach: 'S', order: 1, goal: 'straight' },
    },
  },
  {
    id: '0707',
    category: 'priority',
    instruction: 'Поверните налево, предоставив преимущество зелёному автомобилю.',
    scene: {
      kind: 'intersection',
      npcs: [{ approach: 'N', turn: 'straight', order: 0, kind: 'car', color: '#337733', label: '1' }],
      player: { approach: 'S', order: 1, goal: 'left' },
    },
  },
  {
    id: '0904',
    category: 'priority',
    instruction:
      'Встречный белый автомобиль уже начал поворот налево: замедлитесь и позвольте ему завершить манёвр.',
    scene: {
      kind: 'intersection',
      npcs: [{ approach: 'N', turn: 'left', order: 0, kind: 'car', color: '#eeeeee', label: '1' }],
      player: { approach: 'S', order: 1, goal: 'straight' },
    },
  },
  {
    id: '0789',
    category: 'priority',
    instruction: 'Перекрёсток занят трактором: остановитесь перед ним и ждите, пока он освободится.',
    scene: {
      kind: 'intersection',
      npcs: [{ approach: 'E', turn: 'straight', order: 0, kind: 'tractor', color: '#337733', label: '1' }],
      player: { approach: 'S', order: 1, goal: 'straight' },
    },
  },
  {
    id: '0744',
    category: 'priority',
    instruction:
      'Узкое место, разъехаться невозможно: уступите встречному автомобилю, который поднимается вам навстречу.',
    scene: {
      kind: 'road',
      zones: [{ type: 'narrow', at: 20, length: 12 }],
      npcs: [{ approach: 'N', turn: 'straight', order: 0, kind: 'car', color: '#888899', label: '1' }],
      player: { approach: 'S', order: 1, goal: 'straight' },
    },
  },
  {
    id: '0788',
    category: 'priority',
    instruction:
      'По знаку преимущество у вас, но встречный уже въехал на сужение: дождитесь, пока он проедет.',
    scene: {
      kind: 'road',
      zones: [{ type: 'narrow', at: 22, length: 12 }],
      signs: [{ approach: 'S', type: 'narrow-priority' }],
      npcs: [{ approach: 'N', turn: 'straight', order: 0, kind: 'car', color: '#bb4444', label: '1' }],
      player: { approach: 'S', order: 1, goal: 'straight' },
    },
  },
  {
    id: '0192',
    category: 'priority',
    instruction: 'Ваша полоса впереди перекрыта: уступите встречному и объезжайте по свободной части.',
    scene: {
      kind: 'road',
      zones: [{ type: 'narrow', at: 18, length: 10 }],
      npcs: [{ approach: 'N', turn: 'straight', order: 0, kind: 'car', color: '#999999', label: '1' }],
      player: { approach: 'S', order: 1, goal: 'straight' },
    },
  },
  {
    id: '0551',
    category: 'priority',
    instruction:
      'Знак «круговое движение»: уступите транспорту на кольце и объезжайте островок справа.',
    scene: {
      kind: 'intersection',
      roundabout: true,
      signs: [{ approach: 'S', type: 'roundabout' }],
      npcs: [
        {
          approach: 'W',
          turn: 'straight',
          order: 0,
          kind: 'car',
          color: '#3355cc',
          label: '1',
          ring: { fromAngleDeg: 180, toSide: 'E' },
        },
      ],
      player: { approach: 'S', order: 1, goal: 'straight' },
    },
  },
  {
    id: '0976',
    category: 'priority',
    instruction:
      'Сужение дороги: по знаку у вас преимущество перед встречным. Проезжайте первым.',
    scene: {
      kind: 'road',
      zones: [{ type: 'narrow', at: 20, length: 12 }],
      signs: [{ approach: 'S', type: 'narrow-priority' }],
      npcs: [{ approach: 'N', turn: 'straight', order: 1, kind: 'car', color: '#999999', label: '2' }],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
];
