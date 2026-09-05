import { useState } from "react";
import { loadHighScores } from "../persistence/save";
import { Panel } from "./ui";

export function HighScores() {
  const [rows] = useState(() => loadHighScores());
  if (rows.length === 0) {
    return (
      <div className="text-center text-[11px] text-slate-500 py-3">
        No scored runs yet — the leaderboard awaits your first company.
      </div>
    );
  }
  return (
    <Panel className="overflow-hidden">
      <table className="w-full text-left text-[11px]">
        <thead>
          <tr className="text-[9px] uppercase tracking-widest text-slate-500 border-b border-white/10">
            <th className="px-2 py-1">#</th>
            <th className="px-2 py-1">Score</th>
            <th className="px-2 py-1">Tasks</th>
            <th className="px-2 py-1">Best agent</th>
            <th className="px-2 py-1">Date</th>
            <th className="px-2 py-1 text-right">Win</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.date + "-" + i}
              className={`border-b border-white/5 ${r.victory ? "bg-gold/5" : ""}`}
            >
              <td className="px-2 py-1 text-slate-500">{i + 1}</td>
              <td className={`px-2 py-1 font-bold ${i === 0 ? "text-gold" : "text-slate-200"}`}>
                {r.score.toLocaleString("en-US")}
              </td>
              <td className="px-2 py-1 text-slate-400">{r.tasksCompleted}</td>
              <td className="px-2 py-1 text-slate-400">{r.bestAgentLabel}</td>
              <td className="px-2 py-1 text-slate-500">
                {new Date(r.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </td>
              <td className="px-2 py-1 text-right">{r.victory ? "★" : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
