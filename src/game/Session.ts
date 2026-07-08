export interface SessionStats {
  passed: number;
  failed: number;
  /** Доля успешных от всех попыток, округлённая до целых процентов. */
  percent: number;
}

export interface SessionJSON {
  passed: number;
  failed: number;
  queue: string[];
  pos: number;
}

/** Очередь задач в случайном порядке + статистика успехов/неудач. */
export class Session {
  private readonly ids: string[];
  private readonly rng: () => number;
  private queue: string[];
  private pos = 0;
  private passed = 0;
  private failed = 0;

  constructor(ids: string[], rng: () => number) {
    if (ids.length === 0) throw new Error('Session: пустой список задач');
    this.ids = [...ids];
    this.rng = rng;
    this.queue = this.shuffle();
  }

  private shuffle(): string[] {
    const arr = [...this.ids];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  current(): string {
    return this.queue[this.pos];
  }

  advance(): void {
    this.pos++;
    if (this.pos >= this.queue.length) {
      this.queue = this.shuffle();
      this.pos = 0;
    }
  }

  record(success: boolean): void {
    if (success) this.passed++;
    else this.failed++;
  }

  get stats(): SessionStats {
    const total = this.passed + this.failed;
    return {
      passed: this.passed,
      failed: this.failed,
      percent: total === 0 ? 0 : Math.round((this.passed * 100) / total),
    };
  }

  resetStats(): void {
    this.passed = 0;
    this.failed = 0;
  }

  toJSON(): SessionJSON {
    return { passed: this.passed, failed: this.failed, queue: [...this.queue], pos: this.pos };
  }

  static fromJSON(ids: string[], json: SessionJSON, rng: () => number): Session {
    const s = new Session(ids, rng);
    s.passed = json.passed;
    s.failed = json.failed;
    // очередь восстанавливаем, только если набор id не изменился
    const same =
      json.queue.length === ids.length && [...json.queue].sort().join() === [...ids].sort().join();
    if (same && json.pos < json.queue.length) {
      s.queue = [...json.queue];
      s.pos = json.pos;
    }
    return s;
  }
}
