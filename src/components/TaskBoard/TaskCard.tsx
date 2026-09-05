import { useGameStore } from "../../store/gameStore";
import { Task } from "../../types";
import { effectiveDuration, effectiveTokenCost, successChance } from "../../systems/taskSystem";
import { TOKEN_SURCHARGE } from "../../config";
import {
  AGENT_EMOJI,
  Bar,
  Btn,
  DifficultyPips,
  fmtClock,
  fmtMoney,
  fmtTokens,
  Panel,
  RiskBadge,
  SkillBadge,
} from "../ui";

export function ActiveTaskRow({ taskId }: { taskId: string }) {
  const task = useGameStore((s) => s.tasks.find((t) => t.id === taskId));
  const agentName = useGameStore(
    (s) => s.agents.find((a) => a.id === task?.assignedAgentId)?.name ?? "?",
  );
  const runClock = useGameStore((s) => s.runClock);
  if (!task) return null;
  const remaining =
    task.assignedAt !== undefined ? task.deadline - (runClock - task.assignedAt) : task.deadline;
  return (
    <Panel className="p-2">
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-bold text-slate-200 truncate">{task.name}</span>
        <SkillBadge skill={task.skill} />
        <span className="ml-auto text-[10px] text-accent">{agentName}</span>
      </div>
      <div className="mt-1.5">
        <Bar value={task.progress} colorClass={task.risk === "CRITICAL" ? "bg-danger" : "bg-accent"} />
      </div>
      <div className="flex justify-between mt-1 text-[9px] text-slate-500">
        <span>{Math.round(task.progress * 100)}%</span>
        <span className={remaining < 10 ? "text-danger font-bold" : ""}>
          ⏱ {fmtClock(Math.max(0, remaining))} left
        </span>
      </div>
    </Panel>
  );
}

export function TaskCard({ task, onAssign }: { task: Task; onAssign: (id: string) => void }) {
  const isEmergency = !!task.emergency;
  const multi = task.bonusMultiplier ?? 1;
  return (
    <Panel className={`card-in p-2 ${isEmergency ? "border-danger/60 animate-pulse" : ""}`}>
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-bold text-slate-200 truncate" title={task.description}>
          {task.name}
        </span>
        {isEmergency && (
          <span className="px-1 py-0.5 text-[9px] font-black text-danger border border-danger/50 rounded">
            EMERGENCY
          </span>
        )}
        {multi > 1 && (
          <span className="px-1 py-0.5 text-[9px] font-black text-gold border border-gold/50 rounded">
            2× REWARD
          </span>
        )}
        <span className="ml-auto">
          <RiskBadge risk={task.risk} />
        </span>
      </div>
      <div className="mt-1 flex items-center gap-1.5">
        <DifficultyPips difficulty={task.difficulty} />
        <SkillBadge skill={task.skill} />
        <span className="ml-auto text-[9px] text-slate-500" title="Seconds of agent time required">
          {task.duration}s
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-2 text-[10px]">
        <span className="text-slate-400">
          cost <span className="text-slate-200 font-bold">{fmtMoney(task.cost)}</span>
        </span>
        <span className="text-slate-400">
          reward{" "}
          <span className="text-success font-bold">
            {fmtMoney(task.rewardMoney * multi)}
          </span>
          {task.rewardTokens > 0 && (
            <span className="text-accent font-bold"> +{fmtTokens(task.rewardTokens)}</span>
          )}
        </span>
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-[9px] text-slate-600">⏱ {task.deadline}s window</span>
        <Btn onClick={() => onAssign(task.id)} disabled={task.status !== "available"}>
          ASSIGN AGENT
        </Btn>
      </div>
    </Panel>
  );
}

export function AssignModalContent({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const task = useGameStore((s) => s.tasks.find((t) => t.id === taskId));
  const agents = useGameStore((s) => s.agents);
  const money = useGameStore((s) => s.money);
  const tokens = useGameStore((s) => s.tokens);
  const runClock = useGameStore((s) => s.runClock);
  const surcharged = useGameStore((s) => s.activeEvents.some((e) => e.kind === "tokenSurcharge"));
  const assignAgent = useGameStore((s) => s.assignAgent);
  if (!task) return null;
  const surcharge = surcharged ? TOKEN_SURCHARGE : 1;

  const eligible = agents.filter(
    (a) => a.status === "idle" || (a.status === "cooldown" && runClock >= a.cooldownUntil),
  );

  return (
    <div className="p-3">
      <div className="text-xs font-bold text-slate-200">
        ASSIGN AGENT — <span className="text-accent">{task.name}</span>
      </div>
      <div className="mt-0.5 text-[10px] text-slate-500">
        {task.description} · Difficulty {task.difficulty}/10 · <RiskBadge risk={task.risk} />
      </div>
      <div className="mt-2 space-y-0.5">
        {eligible.length === 0 && (
          <div className="text-[11px] text-slate-500 px-2 py-2">
            No idle agents available — wait for workers or cooldowns.
          </div>
        )}
        {eligible.map((a) => {
          const pct = Math.round(successChance(task, a) * 100);
          const dur = Math.ceil(effectiveDuration(task, a));
          const cost = task.cost + a.costPerTask;
          const tok = effectiveTokenCost(task, a, surcharge);
          const energyNeed = 15 + task.difficulty;
          const lowEnergy = a.energy < energyNeed;
          const lowMoney = money < cost;
          const lowTokens = tokens < tok;
          return (
            <div
              key={a.id}
              className={`flex items-center gap-2 px-2 py-1.5 rounded ${
                lowEnergy || lowMoney || lowTokens ? "bg-white/[0.03]" : "hover:bg-white/5"
              }`}
            >
              <span className="text-base">{AGENT_EMOJI[a.type]}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold text-slate-200">
                  {a.name} <span className="text-gold">Lv.{a.level}</span>
                </div>
                <div className="text-[9px] text-slate-500">
                  Success {pct}% · {dur}s · {fmtMoney(cost)} · 🪙{tok}
                  {surcharged ? " (×1.2 surge)" : ""}
                </div>
              </div>
              <Btn
                variant="primary"
                disabled={lowEnergy || lowMoney || lowTokens}
                title={
                  lowEnergy
                    ? "Not enough energy"
                    : lowMoney
                      ? "Not enough money"
                      : lowTokens
                        ? "Not enough tokens"
                        : "Assign this agent"
                }
                onClick={() => {
                  if (assignAgent(task.id, a.id)) onClose();
                }}
              >
                ASSIGN
              </Btn>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-end">
        <Btn variant="ghost" onClick={onClose}>
          CANCEL
        </Btn>
      </div>
    </div>
  );
}
