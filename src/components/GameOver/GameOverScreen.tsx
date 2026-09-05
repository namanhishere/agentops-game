import { useGameStore } from "../../store/gameStore";
import { bestAgentLabel } from "../../persistence/save";
import { computeScore } from "../../systems/scoring";
import { Btn, Stat } from "../ui";

const HEADERS: Record<string, string> = {
  Bankrupt: "BANKRUPT",
  "Final deadline expired": "TIME'S UP",
  "Too many critical failures": "REPUTATION COLLAPSED",
  "3 failed boss attempts": "REPUTATION COLLAPSED",
};

export function GameOverScreen() {
  const s = useGameStore();
  const startNewRun = useGameStore((st) => st.startNewRun);
  const reason = s.gameOverReason ?? "Defeat";
  const header = HEADERS[reason] ?? "GAME OVER";
  const score = computeScore(s, false);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-gradient-to-b from-red-950/80 via-black/70 to-red-950/80 p-4">
      <div className="animate-shake-in w-[440px] max-w-full">
        <div className="bg-panel border-2 border-red-900/70 rounded-lg overflow-hidden shadow-[0_0_60px_rgba(239,68,68,0.25)]">
          <div className="px-6 py-5 text-center bg-red-950/40 border-b border-red-900/50">
            <div className="text-3xl font-black tracking-[0.2em] text-danger">{header}</div>
            <div className="mt-1 text-[11px] text-slate-400">{reason} — the market moves on.</div>
          </div>
          <div className="py-2 divide-y divide-white/5">
            <Stat label="Tasks completed" value={s.tasksCompleted} />
            <Stat label="Tasks failed" value={s.tasksFailed} />
            <Stat label="Money earned" value={"$" + Math.floor(s.moneyEarned).toLocaleString("en-US")} valueClass="text-success" />
            <Stat label="Money spent" value={"$" + Math.floor(s.moneySpent).toLocaleString("en-US")} valueClass="text-danger" />
            <Stat label="Best agent" value={bestAgentLabel(s.agents)} />
            <div className="px-3 py-2 flex items-center justify-between bg-white/[0.03]">
              <span className="text-[11px] uppercase tracking-wide text-slate-500">Score</span>
              <span className="text-xl font-black text-gold">{score.toLocaleString("en-US")}</span>
            </div>
          </div>
          <div className="px-6 py-4 flex justify-center">
            <Btn variant="primary" onClick={startNewRun} className="!px-6 !py-2 !text-xs">
              TRY AGAIN
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
