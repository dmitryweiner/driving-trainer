import type { SceneSpec, Task } from '../game/types';

/** Определение задачи: сцена + инструкция. Текст вопроса и правильного
 * ответа подтягиваются из qbank.json по id. */
export interface TaskDef {
  id: string;
  category: Task['category'];
  instruction: string;
  scene: SceneSpec;
}
