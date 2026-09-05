import { useEffect, useState } from "react";
import { useGameStore } from "../../store/gameStore";
import { BossSlot } from "../../types";
import { successChance } from "../../systems/taskSystem";
import { BOSS_ATTEMPT_LIMIT } from "../../config";
import { Btn, Bar, fmtMoney, fmtTokens, Panel, SkillBadge } from "../ui";

function SlotProgress({ slot, agents }: { slot: BossSlot; agents: ReturnType<typeof useGameStore.getState>["agents"] }) {
  const agent = agents.find((a) => a.id === slot.agentId);
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="w-16 shrink-0">
        <SkillBadge skill={slot.skill} />
      </span>
      {agent ? (
        <>
          <span className="text-[11px] text-slate-200 w-20 truncate">{agent.name}</span>
          <div className="flex-1">
            <Bar value={slot.progress} colorClass={slot.resolved === "failed" ? "bg-danger" : slot.resolved === "success" ? "bg-success" : "bg-gold"} />
          </div>
          <span className="w-6 text-right text-[11px]">
            {slot.resolved === "success" ? "✓" : slot.resolved === "failed" ? "✗" : `${Math.round(slot.progress * 100)}%`}
          </span>
        </>
      ) : (
        <span className="text-[10px] text-slate-600">awaiting agent</span>
      )}
    </div>
  );
}

export function BossModal() {
  const boss = useGameStore((s) => s.tasks.find((t) => t.isBoss && (t.status === "available" || t.status === "active")));
  const agents = useGameStore((s) => s.agents);
  const money = useGameStore((s) => s.money);
  const tokens = useGameStore((s) => s.tokens);
  const runClock = useGameStore((s) => s.runClock);
  const bossAttempts = useGameStore((s) => s.bossAttempts);
  const startBoss = useGameStore((s) => s.startBoss);
  const [picks, setPicks] = useState<Record<number, string>>({});

  const inFlight = !!boss && boss.status === "active" && !!boss.bossSlots?.some((sl) => sl.agentId);
  const attemptOpen = !!boss && boss.status === "active" && !inFlight;

  // clear selections whenever an attempt finishes (or boss appears fresh)
  useEffect(() => {
    setPicks({});
  }, [bossAttempts, boss?.id]);

  if (!boss || !boss.bossSlots) return null;

  const slots = boss.bossSlots;
  const attemptsLeft = Math.max(0, BOSS_ATTEMPT_LIMIT - bossAttempts);
  const pickedIds = Object.values(picks);
  const eligible = agents.filter(
    (a) => a.status === "idle" || (a.status === "cooldown" && runClock >= a.cooldownUntil),
  );

  const slotPct = (slot: BossSlot): { pct: number; match: boolean; energyOk: boolean } | null => {
    const agent = agents.find((a) => a.id === picks[slots.indexOf(slot)]);
    if (!agent) return null;
    return {
      pct: Math.round(successChance({ ...boss, skill: slot.skill }, agent, { boss: true }) * 100),
      match: agent.specialization.includes(slot.skill),
      energyOk: agent.energy >= 15 + boss.difficulty,
    };
  };

  const canPay = money >= boss.cost && tokens >= boss.tokenCost;
  const allPicked = slots.every((_, i) => picks[i] !== undefined);

  return (
    <Panel className="border-gold/60 bg-gold/[0.04] p-2.5">
      <div className="text-[10px] font-black tracking-[0.25em] text-gold">⚑ FINAL CONTRACT</div>
      <div className="mt-1 text-xs font-bold text-slate-100">{boss.name}</div>
      <div className="text-[10px] text-slate-400 leading-snug">{boss.description}</div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]">
        <span className="text-slate-400">
          reward <span className="text-success font-bold">{fmtMoney(boss.rewardMoney)}</span>{" "}
          <span className="text-accent font-bold">+{fmtTokens(boss.rewardTokens)}</span>
        </span>
        <span className="text-slate-400">
          difficulty <span className="text-gold font-bold">{boss.difficulty}/10</span>
        </span>
        <span className="text-slate-400">
          window <span className="text-slate-200 font-bold">{boss.deadline}s</span>
        </span>
        {bossAttempts > 0 && !inFlight && (
          <span className="text-danger font-bold">last attempt failed — {attemptsLeft} left</span>
        )}
        {inFlight && (
          <span className="text-orange-400 font-bold animate-pulse">attempt in progress…</span>
        )}
      </div>

      {inFlight ? (
        <div className="mt-2 border-t border-gold/20 pt-1.5">
          {slots.map((sl) => (
            <SlotProgress key={sl.skill} slot={sl} agents={agents} />
          ))}
          <div className="text-[9px] text-slate-500 mt-1">
            All four modules must pass. Any failure resets the attempt.
          </div>
        </div>
      ) : (
        <>
          <div className="mt-2 space-y-1 border-t border-gold/20 pt-1.5">
            {slots.map((slot, i) => {
              const info = slotPct(slot);
              const chosen = picks[i];
              const pool = eligible.filter((a) => !pickedIds.includes(a.id) || a.id === chosen);
              return (
                <div key={slot.skill} className="flex items-center gap-2">
                  <span className="w-16 shrink-0">
                    <SkillBadge skill={slot.skill} />
                  </span>
                  <select
                    value={chosen ?? ""}
                    onChange={(e) =>
                      setPicks((p) => {
                        const next = { ...p };
                        if (e.target.value === "") delete next[i];
                        else next[i] = e.target.value;
                        return next;
                      })
                    }
                    className="flex-1 bg-panel2 border border-white/15 rounded px-1.5 py-1 text-[11px] text-slate-200 outline-none"
                  >
                    <option value="">— select agent —</option>
                    {pool.map((a) => (
                      <option key={a.id} value={a.id} disabled={a.energy < 15 + boss.difficulty}>
                        {a.name} (Lv.{a.level})
                      </option>
                    ))}
                  </select>
                  <span className="w-24 text-right text-[10px] text-slate-400">
                    {info ? (
                      <>
                        <span className={info.match ? "text-success" : "text-slate-300"}>
                          {info.pct}%
                        </span>
                        {info.match && <span className="text-success"> +15% spec</span>}
                        {!info.energyOk && <span className="text-danger"> · low energy</span>}
                      </>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-gold/20 pt-2">
            <span className="text-[9px] text-slate-500 leading-tight">
              One-time contract: {fmtMoney(boss.cost)} + {fmtTokens(boss.tokenCost)}
              {attemptOpen ? " · already paid" : ""}
              <br />
              Each attempt costs agent energy; failure charges a reliability-scaled penalty.
            </span>
            <Btn
              variant="success"
              disabled={!allPicked || (boss.status === "available" && !canPay)}
              title={
                !allPicked
                  ? "Assign an agent to all 4 module slots"
                  : boss.status === "available" && !canPay
                    ? "Not enough money or tokens for the contract"
                    : "Begin the final contract"
              }
              onClick={() => {
                const assignments = Object.entries(picks).map(([i, agentId]) => ({
                  slotIdx: Number(i),
                  agentId,
                }));
                if (startBoss(boss.id, assignments)) setPicks({});
              }}
            >
              {boss.status === "available" ? `ACCEPT & PAY ${fmtMoney(boss.cost)}` : "START ATTEMPT"}
            </Btn>
          </div>
        </>
      )}
    </Panel>
  );
}
