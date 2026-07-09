import type { TaskDef } from './defs';

/** Действия по дорожным знакам. */
export const signTasks: TaskDef[] = [
  {
    id: '0153',
    category: 'signs',
    instruction: 'Знак ограничения: проезжайте прямо, не превышая 40 км/ч.',
    scene: {
      kind: 'road',
      zones: [{ type: 'speed-limit', at: 12, length: 45, value: 40 }],
      signs: [{ approach: 'S', type: 'speed-limit', value: 40 }],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0156',
    category: 'signs',
    instruction:
      'ЖД-переезд со светофором: остановитесь и пересеките пути только после того, как сигнал погаснет.',
    scene: {
      kind: 'road',
      zones: [{ type: 'railway', at: 20, length: 6 }],
      signs: [{ approach: 'S', type: 'railway' }],
      light: { phases: [{ state: 'red-flashing', duration: 6 }, { state: 'off' }] },
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0179',
    category: 'signs',
    instruction: 'Знак «уступи дорогу»: замедлитесь и пропустите автомобиль на пересекающей дороге.',
    scene: {
      kind: 'intersection',
      signs: [{ approach: 'S', type: 'yield' }],
      npcs: [{ approach: 'E', turn: 'straight', order: 0, kind: 'car', color: '#cc2222', label: '1' }],
      player: { approach: 'S', order: 1, goal: 'straight' },
    },
  },
  {
    id: '0181',
    category: 'signs',
    instruction:
      'Знак «стоп»: полностью остановитесь и уступите транспорту, приближающемуся к перекрёстку.',
    scene: {
      kind: 'intersection',
      signs: [{ approach: 'S', type: 'stop' }],
      npcs: [{ approach: 'E', turn: 'straight', order: 0, kind: 'car', color: '#3355cc', label: '1' }],
      player: { approach: 'S', order: 1, goal: 'straight' },
    },
  },
  {
    id: '0184',
    category: 'signs',
    instruction: 'Знак «стоп»: полностью остановитесь перед стоп-линией, затем проезжайте.',
    scene: {
      kind: 'intersection',
      signs: [{ approach: 'S', type: 'stop' }],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0365',
    category: 'signs',
    instruction:
      'Предупреждение: Т-образный перекрёсток с примыканием справа. Проезжайте прямо, следя за выезжающими.',
    scene: {
      kind: 'intersection',
      approaches: ['N', 'S', 'E'],
      signs: [{ approach: 'S', type: 't-junction' }],
      npcs: [{ approach: 'E', turn: 'left', order: 1, kind: 'car', color: '#999999', label: '1' }],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0367',
    category: 'signs',
    instruction: 'Знак предупреждает о светофоре. Подъезжайте готовым остановиться: горит красный.',
    scene: {
      kind: 'intersection',
      signs: [{ approach: 'S', type: 'traffic-light-ahead' }],
      light: { phases: [{ state: 'red', duration: 5 }, { state: 'green' }] },
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0380',
    category: 'signs',
    instruction: 'Развернитесь на перекрёстке, если это разрешено. Если запрещено знаком — проезжайте прямо.',
    scene: {
      kind: 'intersection',
      signs: [{ approach: 'S', type: 'no-u-turn' }],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0387',
    category: 'signs',
    instruction: 'Круговое движение: уступите транспорту на кольце и проезжайте прямо.',
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
          color: '#cc7722',
          label: '1',
          ring: { fromAngleDeg: 180, toSide: 'E' },
        },
      ],
      player: { approach: 'S', order: 1, goal: 'straight' },
    },
  },
  {
    id: '0403',
    category: 'signs',
    instruction: 'Знак «уступи дорогу»: пропустите транспорт со всех сторон, затем проезжайте прямо.',
    scene: {
      kind: 'intersection',
      signs: [{ approach: 'S', type: 'yield' }],
      npcs: [
        { approach: 'E', turn: 'straight', order: 0, kind: 'car', color: '#cc2222', label: '1' },
        { approach: 'W', turn: 'straight', order: 1, kind: 'car', color: '#3355cc', label: '2' },
      ],
      player: { approach: 'S', order: 2, goal: 'straight' },
    },
  },
  {
    id: '0404',
    category: 'signs',
    instruction:
      'Знак «стоп»: полностью остановитесь и пропустите транспорт со всех направлений.',
    scene: {
      kind: 'intersection',
      signs: [{ approach: 'S', type: 'stop' }],
      npcs: [
        { approach: 'E', turn: 'straight', order: 0, kind: 'car', color: '#cc2222', label: '1' },
        { approach: 'W', turn: 'straight', order: 1, kind: 'car', color: '#3355cc', label: '2' },
      ],
      player: { approach: 'S', order: 2, goal: 'straight' },
    },
  },
  {
    id: '0430',
    category: 'signs',
    instruction: 'Перед вами кольцо: объезжайте его справа, уступив велосипедисту на круге.',
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
          label: '1',
          ring: { fromAngleDeg: 180, toSide: 'E' },
        },
      ],
      player: { approach: 'S', order: 1, goal: 'straight' },
    },
  },
  {
    id: '0438',
    category: 'signs',
    instruction: 'Слияние с главной дорогой: уступите транспорту на ней и поверните направо.',
    scene: {
      kind: 'intersection',
      approaches: ['E', 'S', 'W'],
      signs: [{ approach: 'S', type: 'yield' }],
      npcs: [{ approach: 'W', turn: 'straight', order: 0, kind: 'car', color: '#3355cc', label: '1' }],
      player: { approach: 'S', order: 1, goal: 'right' },
    },
  },
  {
    id: '0461',
    category: 'signs',
    instruction: 'Впереди знак «стоп»: подготовьтесь заранее, полностью остановитесь у линии и проезжайте.',
    scene: {
      kind: 'intersection',
      signs: [{ approach: 'S', type: 'stop' }],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0491',
    category: 'signs',
    instruction:
      'Вам нужно на противоположную сторону, но там знак «въезд запрещён» (одностороннее движение навстречу). Поверните направо.',
    scene: {
      kind: 'intersection',
      signs: [{ approach: 'S', type: 'no-entry' }],
      player: { approach: 'S', order: 0, goal: 'right' },
    },
  },
  {
    id: '0495',
    category: 'signs',
    instruction: 'Сужение: по знаку вы обязаны уступить встречному. Дождитесь, пока он проедет.',
    scene: {
      kind: 'road',
      zones: [{ type: 'narrow', at: 20, length: 12 }],
      signs: [{ approach: 'S', type: 'narrow-yield' }],
      npcs: [{ approach: 'N', turn: 'straight', order: 0, kind: 'car', color: '#999999', label: '1' }],
      player: { approach: 'S', order: 1, goal: 'straight' },
    },
  },
  {
    id: '0523',
    category: 'signs',
    instruction: 'Знак «только разворот»: развернитесь и уезжайте в обратном направлении.',
    scene: {
      kind: 'intersection',
      lanes: { S: { in: 2, out: 2 }, N: { in: 2, out: 2 } },
      signs: [{ approach: 'S', type: 'only-u-turn' }],
      player: { approach: 'S', order: 0, goal: 'uturn' },
    },
  },
  {
    id: '0533',
    category: 'signs',
    instruction: 'Знак «уступи дорогу»: пропустите транспорт на пересекающей дороге.',
    scene: {
      kind: 'intersection',
      signs: [{ approach: 'S', type: 'yield' }],
      npcs: [
        { approach: 'E', turn: 'straight', order: 0, kind: 'car', color: '#cc2222', label: '1' },
        { approach: 'W', turn: 'straight', order: 1, kind: 'car', color: '#337733', label: '2' },
      ],
      player: { approach: 'S', order: 2, goal: 'straight' },
    },
  },
  {
    id: '0536',
    category: 'signs',
    instruction:
      'Знак «стоп» установлен слева — он обязателен для поворачивающих налево. Остановитесь и поверните налево, пропустив встречного.',
    scene: {
      kind: 'intersection',
      signs: [{ approach: 'S', type: 'stop' }],
      npcs: [{ approach: 'N', turn: 'straight', order: 0, kind: 'car', color: '#3355cc', label: '1' }],
      player: { approach: 'S', order: 1, goal: 'left' },
    },
  },
  {
    id: '0537',
    category: 'signs',
    instruction: 'Переносной знак «стоп»: полностью остановитесь, затем продолжайте движение.',
    scene: {
      kind: 'intersection',
      signs: [{ approach: 'S', type: 'stop' }],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0541',
    category: 'signs',
    instruction: 'Запрещающего знака нет — разворот разрешён. Развернитесь на перекрёстке.',
    scene: {
      kind: 'intersection',
      lanes: { S: { in: 2, out: 2 }, N: { in: 2, out: 2 } },
      player: { approach: 'S', order: 0, goal: 'uturn' },
    },
  },
  {
    id: '0545',
    category: 'signs',
    instruction: 'Знак «движение только прямо»: проезжайте перекрёсток прямо.',
    scene: {
      kind: 'intersection',
      signs: [{ approach: 'S', type: 'only-straight' }],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0546',
    category: 'signs',
    instruction: 'Вам нужно налево, но знак разрешает движение только прямо. Проезжайте прямо.',
    scene: {
      kind: 'intersection',
      signs: [{ approach: 'S', type: 'only-straight' }],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0547',
    category: 'signs',
    instruction: 'На перекрёстке знак «только прямо» — поворачивать нельзя. Проезжайте прямо.',
    scene: {
      kind: 'intersection',
      signs: [{ approach: 'S', type: 'only-straight' }],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0550',
    category: 'signs',
    instruction:
      'Круговое движение: уступите транспорту на кольце и объезжайте кольцо с правой стороны.',
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
          color: '#888888',
          label: '1',
          ring: { fromAngleDeg: 200, toSide: 'E' },
        },
      ],
      player: { approach: 'S', order: 1, goal: 'straight' },
    },
  },
  {
    id: '0579',
    category: 'signs',
    instruction: 'Сужение: по знаку у вас преимущество перед встречным транспортом. Проезжайте первым.',
    scene: {
      kind: 'road',
      zones: [{ type: 'narrow', at: 20, length: 12 }],
      signs: [{ approach: 'S', type: 'narrow-priority' }],
      npcs: [{ approach: 'N', turn: 'straight', order: 1, kind: 'car', color: '#999999', label: '1' }],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0590',
    category: 'signs',
    instruction: 'Впереди въезд на дорогу с односторонним движением (попутным). Проезжайте прямо.',
    scene: {
      kind: 'intersection',
      lanes: { N: { in: 0, out: 2 } },
      signs: [{ approach: 'S', type: 'one-way' }],
      // въезд продолжается в правую по ходу полосу односторонней дороги
      player: { approach: 'S', order: 0, goal: 'straight', goalLane: 1 },
    },
  },
  {
    id: '0591',
    category: 'signs',
    instruction:
      'Дорога односторонняя: поворачивайте налево с левой стороны проезжей части (из полосы 2).',
    scene: {
      kind: 'intersection',
      lanes: { S: { in: 2, out: 0 } },
      signs: [{ approach: 'S', type: 'one-way' }],
      player: { approach: 'S', order: 0, goal: 'left', startLane: 1, goalLane: 0 },
      laneLabels: [
        { side: 'S', flow: 'in', index: 0, label: '1' },
        { side: 'S', flow: 'in', index: 1, label: '2' },
      ],
    },
  },
  {
    id: '0593',
    category: 'signs',
    instruction: 'Знак «пешеходный переход»: дайте пешеходу перейти дорогу.',
    scene: {
      kind: 'road',
      zones: [{ type: 'crosswalk', at: 18, length: 3 }],
      signs: [{ approach: 'S', type: 'crosswalk' }],
      pedestrians: [{ approach: 'S', from: 'right' }],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0595',
    category: 'signs',
    instruction: 'Вы на главной дороге: у вас преимущество, остальные обязаны уступить. Проезжайте.',
    scene: {
      kind: 'intersection',
      signs: [{ approach: 'S', type: 'priority-road' }],
      npcs: [
        { approach: 'W', turn: 'straight', order: 1, kind: 'car', color: '#cc7722', label: '1' },
        { approach: 'E', turn: 'straight', order: 2, kind: 'car', color: '#3355cc', label: '2' },
      ],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0597',
    category: 'signs',
    instruction:
      'Главная дорога закончилась: на следующем перекрёстке действует правило правой руки — уступите автомобилю справа.',
    scene: {
      kind: 'intersection',
      signs: [{ approach: 'S', type: 'priority-road-end' }],
      npcs: [{ approach: 'E', turn: 'straight', order: 0, kind: 'car', color: '#cc2222', label: '1' }],
      player: { approach: 'S', order: 1, goal: 'straight' },
    },
  },
  {
    id: '0631',
    category: 'signs',
    instruction: 'Зона ограничения скорости 30 км/ч: не превышайте до конца зоны.',
    scene: {
      kind: 'road',
      zones: [{ type: 'speed-limit', at: 15, length: 40, value: 30 }],
      signs: [{ approach: 'S', type: 'speed-limit', value: 30 }],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0632',
    category: 'signs',
    instruction:
      'Зона ограничения 30 км/ч заканчивается знаком «конец зоны» — после него можно ехать быстрее.',
    scene: {
      kind: 'road',
      zones: [{ type: 'speed-limit', at: 10, length: 22, value: 30 }],
      signs: [{ approach: 'S', type: 'speed-limit', value: 30 }],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0647',
    category: 'signs',
    instruction:
      'Стоп-линия на проезжей части: при остановке останавливайтесь непосредственно перед ней. Горит красный.',
    scene: {
      kind: 'intersection',
      light: { phases: [{ state: 'red', duration: 4 }, { state: 'green' }] },
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0652',
    category: 'signs',
    instruction:
      'Жёлтая стрелка на полосе: прямо на ближайшем перекрёстке — только общественный транспорт. Поверните направо.',
    scene: {
      kind: 'intersection',
      signs: [{ approach: 'S', type: 'only-right' }],
      player: { approach: 'S', order: 0, goal: 'right' },
    },
  },
  {
    id: '0965',
    category: 'signs',
    instruction: 'По установленным знакам движение разрешено только прямо. Проезжайте.',
    scene: {
      kind: 'intersection',
      signs: [
        { approach: 'S', type: 'only-straight' },
        { approach: 'E', type: 'no-entry' },
      ],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0966',
    category: 'signs',
    instruction:
      'Прямо на этом перекрёстке разрешено только общественному транспорту. Поверните направо.',
    scene: {
      kind: 'intersection',
      signs: [{ approach: 'S', type: 'only-right' }],
      player: { approach: 'S', order: 0, goal: 'right' },
    },
  },
  {
    id: '1467',
    category: 'signs',
    instruction:
      'Вам нужно налево, но знак запрещает поворот налево (и разворот). Проезжайте прямо.',
    scene: {
      kind: 'intersection',
      signs: [{ approach: 'S', type: 'no-left-turn' }],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0355',
    category: 'signs',
    instruction: 'Знак 302 «стоп»: полностью остановитесь перед стоп-линией, затем проезжайте.',
    scene: {
      kind: 'intersection',
      signs: [{ approach: 'S', type: 'stop' }],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0182',
    category: 'signs',
    instruction: 'Остановитесь непосредственно перед стоп-линией, затем поверните направо.',
    scene: {
      kind: 'intersection',
      approaches: ['E', 'S', 'W'],
      signs: [{ approach: 'S', type: 'stop' }],
      player: { approach: 'S', order: 0, goal: 'right' },
    },
  },
  {
    id: '0535',
    category: 'signs',
    instruction:
      'Знак «стоп»: остановитесь перед стоп-линией — с неё хорошо видно пересекающую дорогу.',
    scene: {
      kind: 'intersection',
      signs: [{ approach: 'S', type: 'stop' }],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0183',
    category: 'signs',
    instruction:
      'Знак «уступи дорогу»: остановитесь так, чтобы видеть пересекающую дорогу, и пропустите автомобиль.',
    scene: {
      kind: 'intersection',
      signs: [{ approach: 'S', type: 'yield' }],
      npcs: [{ approach: 'E', turn: 'straight', order: 0, kind: 'car', color: '#cc4444', label: '1' }],
      player: { approach: 'S', order: 1, goal: 'straight' },
    },
  },
  {
    id: '0957',
    category: 'signs',
    instruction:
      'Знак «стоп» обязателен для поворачивающих налево: остановитесь и поверните налево.',
    scene: {
      kind: 'intersection',
      signs: [{ approach: 'S', type: 'stop' }],
      player: { approach: 'S', order: 0, goal: 'left' },
    },
  },
  {
    id: '0629',
    category: 'signs',
    instruction: 'После знака — ограничение 30 км/ч: не превышайте до конца зоны.',
    scene: {
      kind: 'road',
      zones: [{ type: 'speed-limit', at: 12, length: 40, value: 30 }],
      signs: [{ approach: 'S', type: 'speed-limit', value: 30 }],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0521',
    category: 'signs',
    instruction: 'Знак ограничивает скорость 50 км/ч: держите скорость не выше до конца зоны.',
    scene: {
      kind: 'road',
      zones: [{ type: 'speed-limit', at: 12, length: 42, value: 50 }],
      signs: [{ approach: 'S', type: 'speed-limit', value: 50 }],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0154',
    category: 'signs',
    instruction: 'Жилая улица со смешанным движением: не быстрее 30 км/ч.',
    scene: {
      kind: 'road',
      zones: [{ type: 'speed-limit', at: 10, length: 45, value: 30 }],
      signs: [{ approach: 'S', type: 'speed-limit', value: 30 }],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '1486',
    category: 'signs',
    instruction: 'Городская дорога без знаков: максимальная скорость — 50 км/ч.',
    scene: {
      kind: 'road',
      zones: [{ type: 'speed-limit', at: 8, length: 45, value: 50 }],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0157',
    category: 'signs',
    instruction:
      'Красный мигает: остановитесь перед стоп-линией переезда и ждите, пока сигнал не погаснет.',
    scene: {
      kind: 'road',
      zones: [{ type: 'railway', at: 22, length: 6 }],
      signs: [{ approach: 'S', type: 'railway' }],
      light: { phases: [{ state: 'red-flashing', duration: 8 }, { state: 'off' }] },
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0161',
    category: 'signs',
    instruction:
      'Слышен поезд — сигнал мигает красным: полная остановка перед переездом, ехать можно после отключения сигнала.',
    scene: {
      kind: 'road',
      zones: [{ type: 'railway', at: 22, length: 6 }],
      signs: [{ approach: 'S', type: 'railway' }],
      light: { phases: [{ state: 'red-flashing', duration: 9 }, { state: 'off' }] },
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0158',
    category: 'signs',
    instruction:
      'Приближается поезд: остановитесь перед переездом и ждите, пока он проедет (сигнал погаснет).',
    scene: {
      kind: 'road',
      zones: [{ type: 'railway', at: 24, length: 6 }],
      signs: [{ approach: 'S', type: 'railway' }],
      light: { phases: [{ state: 'red-flashing', duration: 10 }, { state: 'off' }] },
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0162',
    category: 'signs',
    instruction:
      'Сигнал приближения поезда: полностью остановитесь и не продолжайте движение, пока он не отключится.',
    scene: {
      kind: 'road',
      zones: [{ type: 'railway', at: 22, length: 6 }],
      signs: [{ approach: 'S', type: 'railway' }],
      light: { phases: [{ state: 'red-flashing', duration: 7 }, { state: 'off' }] },
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0392',
    category: 'signs',
    instruction:
      'Перед переездом знак «стоп»: полностью остановитесь, осмотритесь и только потом пересекайте пути.',
    scene: {
      kind: 'road',
      zones: [{ type: 'railway', at: 22, length: 6 }],
      signs: [
        { approach: 'S', type: 'stop' },
        { approach: 'S', type: 'railway' },
      ],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0460',
    category: 'signs',
    instruction:
      'Переезд без шлагбаума: замедлитесь и пересеките пути не останавливаясь и не задерживаясь на рельсах.',
    scene: {
      kind: 'road',
      zones: [{ type: 'railway', at: 22, length: 6 }],
      signs: [{ approach: 'S', type: 'railway' }],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0187',
    category: 'signs',
    instruction: 'Переезд свободен: убедитесь в безопасности и пересеките его без остановки.',
    scene: {
      kind: 'road',
      zones: [{ type: 'railway', at: 25, length: 6 }],
      signs: [{ approach: 'S', type: 'railway' }],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0155',
    category: 'signs',
    instruction:
      'Приближаясь к переезду, замедлитесь так, чтобы при необходимости успеть остановиться. Путь свободен — проезжайте.',
    scene: {
      kind: 'road',
      zones: [{ type: 'railway', at: 30, length: 6 }],
      signs: [{ approach: 'S', type: 'railway' }],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0796',
    category: 'signs',
    instruction: 'Разворот здесь запрещён знаком: проезжайте перекрёсток прямо.',
    scene: {
      kind: 'intersection',
      signs: [{ approach: 'S', type: 'no-u-turn' }],
      player: { approach: 'S', order: 0, goal: 'straight' },
    },
  },
  {
    id: '0431',
    category: 'signs',
    instruction:
      'Впереди круговое движение: замедлитесь и будьте готовы остановиться — на кольце уже есть транспорт.',
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
          color: '#cc8822',
          label: '1',
          ring: { fromAngleDeg: 180, toSide: 'E' },
        },
      ],
      player: { approach: 'S', order: 1, goal: 'straight' },
    },
  },
  {
    id: '1761',
    category: 'signs',
    instruction:
      'Односторонняя дорога, знак «стоп» справа обязателен для обеих полос: остановитесь даже на левой полосе.',
    scene: {
      kind: 'intersection',
      lanes: { S: { in: 2, out: 0 }, N: { in: 0, out: 2 } },
      signs: [{ approach: 'S', type: 'stop' }],
      player: { approach: 'S', order: 0, goal: 'straight', startLane: 1, goalLane: 1 },
    },
  },
];
