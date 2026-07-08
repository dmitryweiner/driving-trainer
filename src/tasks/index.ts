import type { Task } from '../game/types';
import type { TaskDef } from './defs';
import { laneTasks } from './lanes';
import { lightTasks } from './lights';
import { pedestrianTasks } from './pedestrians';
import { priorityTasks } from './priority';
import { signTasks } from './signs';
import qbankJson from './qbank.json';

interface QbankEntry {
  question: string;
  answer: string;
  pic: string | null;
}

const qbank: Record<string, QbankEntry> = qbankJson;

export const taskDefs: TaskDef[] = [
  ...priorityTasks,
  ...laneTasks,
  ...lightTasks,
  ...signTasks,
  ...pedestrianTasks,
];

/** Все задачи: определения сцен + тексты вопросов из базы isradrive. */
export const tasks: Task[] = taskDefs.map((def) => {
  const q = qbank[def.id];
  if (!q) throw new Error(`Вопрос ${def.id} отсутствует в qbank.json`);
  return {
    id: def.id,
    category: def.category,
    question: q.question,
    instruction: def.instruction,
    explanation: q.answer,
    scene: def.scene,
  };
});

export const taskById = new Map(tasks.map((t) => [t.id, t]));
