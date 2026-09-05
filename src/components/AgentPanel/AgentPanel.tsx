import { useGameStore } from "../../store/gameStore";
import { MAX_AGENTS } from "../../config";
import { AgentCard } from "./AgentCard";

export function AgentPanel() {
  const agents = useGameStore((s) => s.agents);
  return (
    <div className="overflow-y-auto px-2 py-2 space-y-2">
      <div className="text-[10px] uppercase tracking-widest text-slate-500 px-1">
        AGENTS ({agents.length}/{MAX_AGENTS})
      </div>
      {agents.map((a) => (
        <AgentCard key={a.id} agentId={a.id} />
      ))}
      {agents.length === 0 && (
        <div className="text-xs text-slate-500 px-1">No agents hired yet.</div>
      )}
    </div>
  );
}
