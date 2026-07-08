/** Сторона перекрёстка. Координаты: x — на восток, y — на юг (как на canvas).
 * Подъезд 'S' — машина снизу, едет на север (heading -π/2). */
export type Dir = 'N' | 'E' | 'S' | 'W';

export type Turn = 'left' | 'right' | 'straight' | 'uturn';

export type VehicleKind =
  | 'car'
  | 'truck'
  | 'bus'
  | 'tractor'
  | 'motorcycle'
  | 'bicycle';

/** Знаки, влияющие на поведение (израильские номера — в комментариях). */
export type SignType =
  | 'stop'            // 302: полная остановка + уступить всем
  | 'yield'           // 301: уступить дорогу
  | 'priority-road'   // 309: главная дорога (у игрока приоритет)
  | 'priority-road-end' // 310: конец главной дороги
  | 'only-straight'   // 424
  | 'only-right'      // 425/414
  | 'only-left'       // 413
  | 'no-left-turn'    // 209
  | 'no-right-turn'   // 210
  | 'no-u-turn'       // 203
  | 'only-u-turn'     // 212
  | 'no-entry'        // 402: въезд запрещён (вешается на выезд)
  | 'one-way'         // 620: одностороннее движение
  | 'roundabout'      // 303: круговое движение
  | 'crosswalk'       // 306: пешеходный переход
  | 'crosswalk-ahead' // 135/136: предупреждение о переходе
  | 'speed-limit'     // 426: ограничение скорости (км/ч в signValue)
  | 'narrow-yield'    // 502: уступи встречному на сужении
  | 'narrow-priority' // 504: у тебя приоритет на сужении
  | 'railway'         // жд переезд
  | 'traffic-light-ahead' // 122
  | 't-junction';     // 115/117: Т-образный перекрёсток

export interface LaneCount {
  /** Полос к перекрёстку (по направлению движения этого подъезда). */
  in: number;
  /** Полос от перекрёстка на этой стороне. */
  out: number;
}

export type LightState =
  | 'red'
  | 'red-yellow'
  | 'green'
  | 'green-flashing'
  | 'yellow'
  | 'yellow-flashing'
  | 'red-flashing'  // жд переезд
  | 'off';

export interface LightPhase {
  state: LightState;
  /** Секунды; последняя фаза может быть без duration — длится вечно. */
  duration?: number;
}

export interface SignSpec {
  /** На каком подъезде стоит знак (обращён к едущим по нему). */
  approach: Dir;
  type: SignType;
  /** Числовое значение (напр. ограничение скорости в км/ч). */
  value?: number;
}

export interface NpcSpec {
  approach: Dir;
  turn: Turn;
  /** Позиция в правильном порядке проезда, 0 = первый. Порядок игрока —
   * в PlayerSpec.order; NPC с порядком больше игрока ждут его проезда. */
  order: number;
  kind: VehicleKind;
  /** Цвет кузова — как в картинке исходного вопроса. */
  color: string;
  /** Подпись-номер из исходной картинки (напр. "1"). */
  label?: string;
  /** NPC уже движется по кольцу (для задач с круговым движением):
   * стартовый угол на кольце (в градусах, canvas) и сторона съезда. */
  ring?: { fromAngleDeg: number; toSide: Dir };
}

export interface PedestrianSpec {
  /** Переход на этом подъезде (полоса зебры поперёк дороги). */
  approach: Dir;
  /** Откуда идёт: слева или справа от направления подъезда. */
  from: 'left' | 'right';
  /** Задержка появления, с. */
  delay?: number;
}

export interface PlayerSpec {
  approach: Dir;
  /** Порядок игрока среди NpcSpec.order (см. выше). */
  order: number;
  /** Куда игрок должен уехать, чтобы задача была пройдена. */
  goal: Turn;
  /** Полосы (для многополосных задач): номер полосы старта (0 — правая)
   * и требуемая полоса на выезде. */
  startLane?: number;
  goalLane?: number;
}

/** Дорога через перекрёсток либо прямой участок (kind 'road' — перекрёстка
 * нет, есть зоны: переход/переезд/сужение/ограничение скорости). */
export interface SceneSpec {
  kind: 'intersection' | 'road';
  /** Какие стороны перекрёстка существуют (T-образный — три). Для 'road'
   * игнорируется. */
  approaches?: Dir[];
  /** Число полос к перекрёстку/от перекрёстка на каждой стороне
   * (по умолчанию 1+1). */
  lanes?: Partial<Record<Dir, LaneCount>>;
  roundabout?: boolean;
  signs?: SignSpec[];
  /** Светофор для подъезда игрока (и всех, если не указано иное). */
  light?: { phases: LightPhase[] };
  npcs?: NpcSpec[];
  pedestrians?: PedestrianSpec[];
  /** Зоны на прямом участке ('road'). Расстояния в метрах от старта игрока. */
  zones?: RoadZone[];
  player: PlayerSpec;
  /** Лимит времени на задачу, с (по умолчанию 60). */
  timeLimit?: number;
  /** Подписи полос для отрисовки (номера как в исходной картинке). */
  laneLabels?: { side: Dir; flow: 'in' | 'out'; index: number; label: string }[];
  /** Подписи улиц по сторонам (А/Б/В/С — как в исходной картинке). */
  streetLabels?: Partial<Record<Dir, string>>;
}

export interface RoadZone {
  type: 'crosswalk' | 'railway' | 'narrow' | 'speed-limit';
  /** Начало зоны: метров вперёд от точки старта игрока. */
  at: number;
  length: number;
  /** Для speed-limit: км/ч. */
  value?: number;
}

export interface Task {
  /** Номер вопроса isradrive, напр. "0700". */
  id: string;
  /** Тип из data/selection.json. */
  category: 'priority' | 'lanes' | 'lights' | 'signs' | 'pedestrians';
  /** Исходный текст вопроса. */
  question: string;
  /** Что должен сделать игрок. */
  instruction: string;
  /** Текст правильного ответа — показывается после завершения. */
  explanation: string;
  scene: SceneSpec;
}

export type FailReason =
  | 'collision'      // столкновение с машиной или пешеходом
  | 'off-road'       // выезд за пределы проезжей части
  | 'priority'       // не уступил дорогу
  | 'ran-stop'       // не остановился (стоп-знак / стоп-линия)
  | 'ran-light'      // проехал на запрещающий сигнал
  | 'wrong-way'      // уехал не туда / в запрещённом направлении
  | 'wrong-lane'     // манёвр не из той полосы / не в ту полосу
  | 'speeding'       // превышение скорости в зоне ограничения
  | 'pedestrian'     // не пропустил пешехода
  | 'timeout';       // время вышло

export type ScenarioState =
  | { kind: 'driving' }
  | { kind: 'passed' }
  | { kind: 'failed'; reason: FailReason; message: string };
