import { useGameStore } from "../../store/gameStore";
import { MAX_AGENTS } from "../../config";
import { AgentCard } from "./AgentCard";

export function AgentPanel({ horizontal = false }: { horizontal?: boolean }) {
  const agents = useGameStore((s) => s.agents);
  const header = (
    <div className="text-[10px] uppercase tracking-widest text-slate-500 px-1">
      AGENTS ({agents.length}/{MAX_AGENTS})
    </div>
  );
  if (horizontal) {
    return (
      <div>
        {header}
        <div className="flex gap-2 overflow-x-auto px-2 pb-2">
          {agents.map((a) => (
            <div key={a.id} className="w-[230px] shrink-0">
              <AgentCard agentId={a.id} />
            </div>
          ))}
          {agents.length === 0 && (
            <div className="text-xs text-slate-500 px-1">No agents hired yet.</div>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="px-2 py-2 space-y-2">
      {header}
      {agents.map((a) => (
        <AgentCard key={a.id} agentId={a.id} />
      ))}
      {agents.length === 0 && (
        <div className="text-xs text-slate-500 px-1">No agents hired yet.</div>
      )}
    </div>
  );
}
