import { useGameStore } from "../../store/gameStore";
import { recoverCost } from "../../systems/economySystem";
import { cooldownDuration } from "../../systems/agentSystem";
import {
  AGENT_EMOJI,
  Btn,
  FATIGUE_STYLES,
  fmtClock,
  fmtMoney,
  Panel,
} from "../ui";

export function AgentCard({ agentId }: { agentId: string }) {
  const agent = useGameStore((s) => s.agents.find((a) => a.id === agentId));
  const money = useGameStore((s) => s.money);
  const runClock = useGameStore((s) => s.runClock);
  const restAgent = useGameStore((s) => s.restAgent);
  const recoverAgent = useGameStore((s) => s.recoverAgent);
  const taskName = useGameStore((s) => {
    const t = s.tasks.find(
      (x) => x.status === "active" && x.assignedAgentId === agentId && !x.isBoss,
    );
    return t?.name ?? null;
  });

  if (!agent) return null;

  const energyPct = (agent.energy / agent.maxEnergy) * 100;
  const energyColor =
    energyPct >= 50 ? "bg-success" : energyPct >= 25 ? "bg-amber-400" : "bg-danger";
  const canRest = agent.status === "idle" || (agent.status === "cooldown" && runClock >= agent.cooldownUntil);
  const recover = recoverCost(agent);

  const statusBadge = () => {
    switch (agent.status) {
      case "working":
        return (
          <span className="text-[10px] text-accent font-bold truncate" title={taskName ?? ""}>
            ⚙ {taskName ?? "busy"}
          </span>
        );
      case "failed":
        return <span className="text-[10px] text-danger font-bold">FAILED</span>;
      case "cooldown":
        return (
          <span className="text-[10px] text-amber-400 font-bold">
            ⏳ {fmtClock(agent.cooldownUntil - runClock)}
          </span>
        );
      default:
        return agent.resting ? (
          <span className="text-[10px] text-sky-300 font-bold">💤 resting</span>
        ) : (
          <span className="text-[10px] text-slate-400 font-bold">idle</span>
        );
    }
  };

  return (
    <Panel className={`p-2 ${agent.resting && agent.status !== "working" ? "ring-1 ring-sky-400/40" : ""}`}>
      <div className="flex items-center gap-1.5">
        <span className="text-lg leading-none">{AGENT_EMOJI[agent.type]}</span>
        <span className="text-xs font-bold text-slate-200 truncate" title={agent.name}>
          {agent.name}
        </span>
        <span className="text-[10px] text-gold font-bold">Lv.{agent.level}</span>
        <span className="ml-auto">{statusBadge()}</span>
      </div>
      <div className="flex items-center gap-1 mt-1">
        <span className="text-[9px] uppercase text-slate-500">{agent.type}</span>
        <span className="text-[9px] text-slate-600">·</span>
        <span className={`text-[9px] font-bold ${FATIGUE_STYLES[agent.fatigue]}`} title="Fatigue level">
          {agent.fatigue}
        </span>
        <span className="ml-auto text-[9px] text-slate-500">{Math.floor(energyPct)}%</span>
      </div>
      <div className="mt-1">
        <Barish value={energyPct / 100} colorClass={energyColor} />
      </div>
      <div className="mt-1">
        <div
          className="h-1 bg-white/10 rounded overflow-hidden"
          title={`XP ${agent.experience}/${agent.xpToNext} — task success grants XP: 20 + 10×difficulty`}
        >
          <div
            className="h-full bg-gold/70"
            style={{ width: `${Math.min(100, (agent.experience / agent.xpToNext) * 100)}%` }}
          />
        </div>
      </div>
      <div className="flex items-center gap-1 mt-1.5">
        <Btn
          variant="ghost"
          disabled={!canRest && !agent.resting}
          title="Rest: faster energy regen"
          onClick={() => restAgent(agent.id)}
          className="flex-1 !px-1 !text-[10px]"
        >
          {agent.resting ? "WORK" : "REST"}
        </Btn>
        <Btn
          variant="success"
          disabled={money < recover || agent.status === "working"}
          title={`Recover: pay ${fmtMoney(recover)} to refill energy instantly`}
          onClick={() => recoverAgent(agent.id)}
          className="flex-1 !px-1 !text-[10px]"
        >
          RECOVER {fmtMoney(recover)}
        </Btn>
      </div>
      <div className="mt-1 text-[9px] text-slate-600" title="Wage paid per assigned task">
        wage {fmtMoney(agent.costPerTask)}/task · token ×{agent.tokenCost.toFixed(2)} · failure
        cooldown {Math.max(4, Math.round(cooldownDuration(agent)))}s
      </div>
    </Panel>
  );
}

function Barish({ value, colorClass }: { value: number; colorClass: string }) {
  return (
    <div className="h-1.5 bg-white/10 rounded overflow-hidden">
      <div className={`h-full ${colorClass} transition-[width] duration-300`} style={{ width: `${Math.round(Math.min(1, value) * 100)}%` }} />
    </div>
  );
}
