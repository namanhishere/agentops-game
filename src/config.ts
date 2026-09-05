export const START_MONEY = 500;
export const START_TOKENS = 10000;
export const RUN_DEADLINE = 900; // seconds = 15 min
export const TICK_MS = 250;
export const TASK_POOL_SIZE = 4; // available tasks kept in queue
export const MAX_AGENTS = 8;
export const LEVEL_CAP = 12;
export const MARKET_SIZE = 5;
export const MARKET_REFRESH_SEC = 60;
export const TOKENS_PER_DOLLAR = 25;
export const CRITICAL_FAILURE_LIMIT = 3;
export const BOSS_ATTEMPT_LIMIT = 3;
export const BOSS_UNLOCK_TASKS = 30;
export const STAGE_THRESHOLDS = [0, 3, 8, 15, 23, 30]; // completed count reaching stage 1..5, boss
export const ENERGY_REGEN_IDLE = 2.5; // per second
export const ENERGY_REGEN_REST = 6; // per second (resting only)
export const ENERGY_COST_BASE = 15; // + task.difficulty
export const FATIGUE_THRESHOLDS = [70, 40, 15]; // energy %: >=70 none, >=40 low, >=15 medium, else high
export const FATIGUE_PENALTY = [0, 0.05, 0.1, 0.18]; // indexed by fatigue tier
export const XP_BASE = 20;
export const XP_PER_DIFFICULTY = 10;
export const XP_TO_NEXT = (level: number) => 80 + level * 40;
export const COOLDOWN_AFTER_FAIL = (reliability: number) => Math.max(4, 10 - reliability * 8);
export const EVENT_MIN_GAP = 45; // seconds between random events
export const EVENT_MAX_GAP = 90;
export const EVENT_START_STAGE = 3;
export const VICTORY_BONUS = 2000;
export const TASK_DIFFICULTY_PENALTY = 0.05; // per difficulty, normal task success roll
export const BOSS_DIFFICULTY_PENALTY = 0.03; // per difficulty, boss slot success roll
export const TOKEN_SURCHARGE = 1.2; // tokenSurcharge event multiplier
