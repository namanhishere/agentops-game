import { useGameStore } from "../../store/gameStore";
import { MAX_AGENTS, MARKET_REFRESH_SEC } from "../../config";
import { MarketAgent } from "../../types";
import { tokenPackages } from "../../systems/economySystem";
import { Btn, fmtClock, fmtMoney, fmtTokens, Modal, Panel } from "../ui";

const TAG_STYLES: Record<string, string> = {
  JUNIOR: "bg-slate-500/20 text-slate-300 border-slate-400/40",
  REGULAR: "bg-sky-500/15 text-sky-300 border-sky-400/40",
  SENIOR: "bg-violet-500/15 text-violet-300 border-violet-400/40",
  RELIABILITY: "bg-emerald-500/15 text-emerald-300 border-emerald-400/40",
  ELITE: "bg-gold/15 text-gold border-gold/50 animate-pulse",
};

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-14 text-[9px] text-slate-500">{label}</span>
      <div className="h-1 flex-1 bg-white/10 rounded overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${Math.round(Math.min(1, value) * 100)}%` }} />
      </div>
    </div>
  );
}

function MarketCard({ offer }: { offer: MarketAgent }) {
  const money = useGameStore((s) => s.money);
  const agents = useGameStore((s) => s.agents);
  const runClock = useGameStore((s) => s.runClock);
  const hireAgent = useGameStore((s) => s.hireAgent);
  const a = offer.agent;
  const full = agents.length >= MAX_AGENTS;
  const poor = money < offer.price;
  const expiring = offer.expiresAt > 0;
  const left = Math.max(0, offer.expiresAt - runClock);

  return (
    <Panel className={`p-2 ${expiring ? "border-gold/50" : ""}`}>
      <div className="flex items-center gap-1.5">
        <span className={`px-1.5 py-0.5 text-[9px] font-black border rounded ${TAG_STYLES[offer.tag] ?? TAG_STYLES.JUNIOR}`}>
          {offer.tag}
        </span>
        <span className="text-sm">{a.type === "coder" ? "🤖" : a.type === "researcher" ? "🧠" : a.type === "tester" ? "🧪" : a.type === "devops" ? "🛠️" : "🎨"}</span>
        <span className="text-xs font-bold text-slate-200">{a.name}</span>
        <span className="text-[10px] text-gold font-bold">Lv.{a.level}</span>
        <span className="ml-auto text-[10px] text-slate-500" title="Wage per assigned task">
          ${a.costPerTask}/task
        </span>
      </div>
      <div className="mt-1.5 space-y-0.5">
        <StatBar label="Accuracy" value={a.accuracy} color="bg-sky-400" />
        <StatBar label="Speed" value={a.speed / 1.6} color="bg-accent" />
        <StatBar label="Reliability" value={a.reliability} color="bg-success" />
      </div>
      <div className="mt-1.5 flex items-center gap-2 text-[9px] text-slate-500">
        <span>token ×{a.tokenCost.toFixed(2)}</span>
        {expiring && (
          <span className="text-gold font-bold" title="Offer expires when the timer ends">
            ⏳ {fmtClock(left)}
          </span>
        )}
        <span className="ml-auto text-[11px] font-bold text-slate-200">{fmtMoney(offer.price)}</span>
      </div>
      <div className="mt-1.5 flex justify-end">
        <Btn
          variant={offer.tag === "ELITE" ? "success" : "primary"}
          disabled={full || poor}
          title={full ? "Team roster is full" : poor ? "Not enough money" : `Hire ${a.name}`}
          onClick={() => hireAgent(offer.offerId)}
        >
          HIRE
        </Btn>
      </div>
    </Panel>
  );
}

export function ShopModal({ onClose }: { onClose: () => void }) {
  const market = useGameStore((s) => s.market);
  const runClock = useGameStore((s) => s.runClock);
  const marketRefreshAt = useGameStore((s) => s.marketRefreshAt);
  const money = useGameStore((s) => s.money);
  const buyTokens = useGameStore((s) => s.buyTokens);
  const refreshIn = Math.max(0, marketRefreshAt - runClock);

  return (
    <Modal onClose={onClose} widthClass="w-[560px]">
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-black text-slate-200 tracking-widest">
            AGENT MARKET
          </div>
          <div className="text-[10px] text-slate-500" title="Market re-rolls new offers when the timer hits zero">
            REFRESH in {fmtClock(refreshIn)} · every {MARKET_REFRESH_SEC}s
          </div>
        </div>
        <div className="mt-2 grid grid-cols-1 max-h-[46vh] overflow-y-auto gap-2 pr-1">
          {market.map((o) => (
            <MarketCard key={o.offerId} offer={o} />
          ))}
        </div>
        <div className="mt-3 border-t border-white/10 pt-2">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">
            Buy tokens — {fmtMoney(1)} = 🪙25 · you have {fmtMoney(money)}
          </div>
          <div className="flex gap-2">
            {tokenPackages.map((p) => (
              <Btn
                key={p.money}
                variant="ghost"
                disabled={money < p.money}
                onClick={() => buyTokens(p.money)}
              >
                {fmtMoney(p.money)} → {fmtTokens(p.tokens)}
              </Btn>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
