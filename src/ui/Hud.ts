import type { Scenario } from '../game/Scenario';
import type { SessionStats } from '../game/Session';

export class Hud {
  private readonly passedEl = byValue('passed');
  private readonly failedEl = byValue('failed');
  private readonly percentEl = byValue('percent');
  private readonly timeEl = byValue('time');
  private readonly speedEl = byValue('speed');
  private readonly questionEl = byValue('question');
  private readonly hintEl = byValue('instruction');
  private readonly taskIdEl = byValue('task-id');
  private readonly overlayEl = document.getElementById('result-overlay');
  private readonly ticketEl = document.getElementById('ticket-overlay');
  private readonly resultTitleEl = byValue('result-title');
  private readonly resultReasonEl = byValue('result-reason');
  private readonly resultQuestionEl = byValue('result-question');
  private readonly resultExplanationEl = byValue('result-explanation');

  private lastStats = '';
  private lastSecond = -1;
  private lastSpeed = -1;
  private lastTaskId = '';
  private overlayShown = false;

  constructor() {
    // подсказка (инструкция) скрыта; показывается по кнопке (i) или клавише I
    const toggleHint = (): void => {
      if (!this.hintEl) return;
      if (this.hintEl.hasAttribute('hidden')) this.hintEl.removeAttribute('hidden');
      else this.hintEl.setAttribute('hidden', '');
    };
    document.getElementById('btn-hint')?.addEventListener('click', toggleHint);
    // билет: модалка в начале задачи («Решать!» закрывает, 🎫 открывает снова)
    document.getElementById('btn-ticket-go')?.addEventListener('click', () => this.setTicketOpen(false));
    document.getElementById('btn-ticket')?.addEventListener('click', () => this.setTicketOpen(true));
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.code === 'KeyI') toggleHint();
      if (e.code === 'KeyT') this.setTicketOpen(!this.isTicketOpen);
    });
  }

  /** Пока билет открыт, симуляция стоит (см. main.ts). */
  get isTicketOpen(): boolean {
    return this.ticketEl !== null && !this.ticketEl.hasAttribute('hidden');
  }

  private setTicketOpen(open: boolean): void {
    if (!this.ticketEl) return;
    if (open) this.ticketEl.removeAttribute('hidden');
    else this.ticketEl.setAttribute('hidden', '');
  }

  update(sc: Scenario, stats: SessionStats): void {
    const statsKey = `${stats.passed}/${stats.failed}`;
    if (statsKey !== this.lastStats) {
      this.lastStats = statsKey;
      setText(this.passedEl, String(stats.passed));
      setText(this.failedEl, String(stats.failed));
      setText(this.percentEl, String(stats.percent));
    }

    const sec = Math.max(0, Math.ceil(sc.timeLimit - sc.time));
    if (sec !== this.lastSecond) {
      this.lastSecond = sec;
      setText(this.timeEl, String(sec));
    }

    const kmh = Math.round(Math.abs(sc.car.velocity) * 3.6);
    if (kmh !== this.lastSpeed) {
      this.lastSpeed = kmh;
      setText(this.speedEl, String(kmh));
    }

    if (sc.task.id !== this.lastTaskId) {
      this.lastTaskId = sc.task.id;
      setText(this.questionEl, sc.task.question);
      setText(this.hintEl, sc.task.instruction);
      this.hintEl?.setAttribute('hidden', '');
      setText(this.taskIdEl, `№${sc.task.id}`);
      this.setTicketOpen(true);
    }

    const finished = sc.state.kind !== 'driving';
    if (finished && !this.overlayShown) {
      this.overlayShown = true;
      if (this.resultTitleEl) {
        this.resultTitleEl.textContent = sc.state.kind === 'passed' ? '✓ Пройдено' : '✗ Провал';
        this.resultTitleEl.className = sc.state.kind === 'passed' ? 'won' : 'lost';
      }
      setText(this.resultReasonEl, sc.state.kind === 'failed' ? sc.state.message : '');
      setText(this.resultQuestionEl, sc.task.question);
      setText(this.resultExplanationEl, `Правильный ответ: ${sc.task.explanation}`);
      this.overlayEl?.removeAttribute('hidden');
    } else if (!finished && this.overlayShown) {
      this.overlayShown = false;
      this.overlayEl?.setAttribute('hidden', '');
    }
  }
}

function byValue(name: string): HTMLElement | null {
  return document.querySelector(`[data-value="${name}"]`);
}

function setText(el: HTMLElement | null, text: string): void {
  if (el && el.textContent !== text) el.textContent = text;
}
