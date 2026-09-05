import { useGameStore } from "../../store/gameStore";
import { Modal } from "../ui";

export function LevelUpModal() {
  const pending = useGameStore((s) => s.pendingLevelUp);
  const agents = useGameStore((s) => s.agents);
  const pickUpgrade = useGameStore((s) => s.pickUpgrade);
  if (!pending) return null;
  const agent = agents.find((a) => a.id === pending.agentId);

  return (
    <Modal widthClass="w-[440px]">
      <div className="p-4">
        <div className="text-center text-gold text-lg font-black tracking-widest animate-pulse">
          ★ LEVEL UP! ★
        </div>
        <div className="mt-1 text-center text-xs text-slate-300">
          {agent?.name ?? "Agent"} → <span className="font-bold text-gold">Lv.{agent?.level}</span>
        </div>
        <div className="mt-1 text-center text-[10px] text-slate-500">
          Pick one permanent upgrade
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {pending.options.map((o) => (
            <button
              key={o.id}
              onClick={() => pickUpgrade(o.id)}
              title={o.detail}
              className="bg-gradient-to-b from-gold/20 to-gold/5 border border-gold/40 rounded p-2 hover:from-gold/30 hover:to-gold/10 transition-colors text-center"
            >
              <div className="text-[11px] font-black text-gold">{o.label}</div>
              <div className="mt-0.5 text-[9px] text-slate-400 leading-tight">{o.detail}</div>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
