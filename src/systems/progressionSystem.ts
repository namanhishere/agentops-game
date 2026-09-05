import { GameState, Task } from "../types";
import { STAGE_THRESHOLDS, BOSS_UNLOCK_TASKS } from "../config";
import { BOSS_TASK_BASE } from "../data/tasks";

/** 1..5 from completed tasks; 6 once the boss unlock count is reached. */
export function stageFor(completed: number): number {
  if (completed >= BOSS_UNLOCK_TASKS) return 6;
  let stage = 0;
  for (const t of STAGE_THRESHOLDS) {
    if (t <= completed) stage++;
  }
  return Math.min(5, Math.max(1, stage));
}

/** Store-only mutating helper: materialize the boss contract at stage 6. */
export function ensureBossTask(state: GameState): void {
  if (state.stage !== 6) return;
  if (state.tasks.some((t) => t.isBoss)) return;
  const task: Task = {
    ...BOSS_TASK_BASE,
    id: `t-${state.nextTaskId++}`,
    skill: "coding",
    status: "available",
    progress: 0,
    bossSlots: BOSS_TASK_BASE.requiredSkills.map((skill) => ({
      skill,
      progress: 0,
      resolved: "pending",
    })),
  };
  state.tasks.push(task);
}
