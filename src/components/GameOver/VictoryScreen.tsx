import { useGameStore } from "../../store/gameStore";
import { bestAgentLabel } from "../../persistence/save";
import { computeScore } from "../../systems/scoring";
import { VICTORY_BONUS } from "../../config";
import { Btn, Stat } from "../ui";
import { HighScores } from "../HighScores";

export function VictoryScreen() {
  const s = useGameStore();
  const startNewRun = useGameStore((st) => st.startNewRun);
  const score = computeScore(s, true);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-gradient-to-b from-black/70 via-black/40 to-black/70 p-4 overflow-y-auto">
      <div className="w-[460px] max-w-full my-auto animate-shake-in">
        <div className="bg-panel border-2 border-gold/60 rounded-lg overflow-hidden shadow-[0_0_80px_rgba(251,191,36,0.2)]">
          <div className="px-6 py-5 text-center bg-gold/10 border-b border-gold/40">
            <div className="text-3xl font-black tracking-[0.25em] text-gold drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]">
              VICTORY!
            </div>
            <div className="mt-1 text-[11px] text-slate-300">
              The AI platform is live. Clients are paying. Your agents earned it.
            </div>
          </div>
          <div className="py-2 divide-y divide-white/5">
            <Stat label="Tasks completed" value={s.tasksCompleted} />
            <Stat label="Tasks failed" value={s.tasksFailed} />
            <Stat label="Money earned" value={"$" + Math.floor(s.moneyEarned).toLocaleString("en-US")} valueClass="text-success" />
            <Stat label="Best agent" value={bestAgentLabel(s.agents)} />
            <Stat label="Victory bonus" value={`+$${VICTORY_BONUS}`} valueClass="text-gold" />
            <div className="px-3 py-2 flex items-center justify-between bg-gold/10">
              <span className="text-[11px] uppercase tracking-wide text-slate-400">Score</span>
              <span className="text-2xl font-black text-gold">{score.toLocaleString("en-US")}</span>
            </div>
          </div>
          <div className="px-6 py-4 flex justify-center border-t border-white/10">
            <Btn variant="primary" onClick={startNewRun} className="!px-6 !py-2 !text-xs">
              NEW RUN
            </Btn>
          </div>
          <div className="px-4 pb-4">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5 text-center">
              Leaderboard
            </div>
            <HighScores />
          </div>
        </div>
      </div>
    </div>
  );
}
