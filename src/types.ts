export type Skill = "coding" | "research" | "testing" | "devops" | "creative";
export type AgentType = "coder" | "researcher" | "tester" | "devops" | "creative";
export type AgentStatus = "idle" | "working" | "failed" | "cooldown";
export type TaskStatus = "available" | "active" | "success" | "failed" | "abandoned";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type FatigueLevel = "none" | "low" | "medium" | "high";
export type Phase = "menu" | "running" | "gameover" | "victory";

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  level: number;
  costPerTask: number; // $ wage added on top of task cost
  tokenCost: number; // multiplier on task.tokenCost, floor 1
  speed: number; // divides task duration
  accuracy: number; // base success probability 0..1
  reliability: number; // 0..1: reduces failure penalty, fatigue, cooldown
  energy: number;
  maxEnergy: number;
  experience: number;
  xpToNext: number;
  specialization: Skill[]; // game-mechanics skills (checked by successChance and boss slots)
  status: AgentStatus;
  fatigue: FatigueLevel;
  cooldownUntil: number; // run clock seconds; 0 = none
  resting: boolean; // player-flagged rest: regen at REST rate
  debuff?: { kind: "scrambled"; tasksLeft: number }; // hallucination event
}

export interface MarketAgent {
  offerId: string;
  agent: Agent;
  price: number;
  tag: string;
  expiresAt: number; // 0 = never
}

export interface BossSlot {
  skill: Skill;
  agentId?: string;
  progress: number;
  resolved: "pending" | "success" | "failed";
}

export interface Task {
  id: string;
  name: string;
  description: string;
  difficulty: number; // 1..10
  skill: Skill; // normal tasks
  requiredSkills?: Skill[]; // boss only
  rewardMoney: number;
  rewardTokens: number;
  cost: number;
  tokenCost: number;
  duration: number; // seconds, divided by agent.speed
  deadline: number; // seconds allowed from assignment; auto-fail on exceed
  risk: RiskLevel;
  failurePenalty: number;
  status: TaskStatus;
  assignedAgentId?: string;
  assignedAt?: number;
  progress: number; // 0..1
  isBoss?: boolean;
  bossSlots?: BossSlot[];
  emergency?: boolean; // event-spawned, 30s window, no failure penalty
  spawnedAt?: number; // run-clock spawn time (emergency expiry uses this)
  hallucinated?: boolean; // scrambled debuff moved here at assignment; -0.15 on resolution roll
  bonusMultiplier?: number; // client-bonus event: reward multiplier
}

export interface LogEntry {
  id: number;
  ts: number;
  text: string;
  tone: "info" | "success" | "failure" | "warning" | "money" | "system";
}

export type GameEvent =
  | { kind: "tokenSurcharge"; label: string; tasksLeft: number }
  | { kind: "burnout"; label: string }
  | { kind: "clientBonus"; label: string; skill: Skill }
  | { kind: "emergency"; label: string }
  | { kind: "hallucination"; label: string }
  | { kind: "modelRelease"; label: string }
  | { kind: "tokenGrant"; label: string; amount: number };

export interface FxEvent {
  kind: "success" | "failure" | "levelup" | "cash" | "warning";
  agentId?: string;
  at: number;
}

export interface UpgradeOption {
  id: "speed" | "accuracy" | "reliability" | "tokenEfficiency" | "energy";
  label: string;
  detail: string;
}

export interface GameState {
  phase: Phase;
  money: number;
  tokens: number;
  runClock: number; // seconds since run start
  deadline: number; // total run length seconds (900)
  stage: number; // 1..5; 6 = boss available
  tasksCompleted: number;
  tasksFailed: number;
  criticalFailures: number;
  bossAttempts: number;
  currentStreak: number;
  bestStreak: number;
  totalDifficultyPoints: number;
  tokensWasted: number; // tokens spent on tasks that failed
  moneyEarned: number;
  moneySpent: number;
  agents: Agent[];
  tasks: Task[];
  log: LogEntry[];
  logSeq: number;
  market: MarketAgent[];
  marketRefreshAt: number;
  activeEvents: GameEvent[];
  eventNextAt: number; // next random event spawn time (0 until stage 3)
  pendingFailure: {
    taskId: string;
    agentId: string;
    reason: string;
    loss: number;
    taskSnapshot: Task;
  } | null;
  pendingLevelUp: { agentId: string; options: UpgradeOption[] } | null;
  pendingEvent: GameEvent | null; // modal event awaiting accept/dismiss
  pendingEmergencyTaskId: string | null;
  nextTaskId: number;
  gameOverReason?: string; // set by finishRun(false, reason); read by GameOverScreen
  fx: FxEvent[]; // drained by Phaser scene each frame; not persisted
  settings: { sound: boolean };
}
