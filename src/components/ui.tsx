import { ReactNode, useEffect } from "react";
import { AgentType, FatigueLevel, RiskLevel, Skill } from "../types";
import { sfx } from "../audio/sfx";

export const AGENT_EMOJI: Record<AgentType, string> = {
  coder: "🤖",
  researcher: "🧠",
  tester: "🧪",
  devops: "🛠️",
  creative: "🎨",
};

export const SKILL_STYLES: Record<Skill, string> = {
  coding: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  research: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  testing: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  devops: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  creative: "bg-pink-500/15 text-pink-300 border-pink-500/30",
};

export const FATIGUE_STYLES: Record<FatigueLevel, string> = {
  none: "text-slate-400",
  low: "text-amber-400",
  medium: "text-orange-400",
  high: "text-red-500",
};

export const fmtClock = (sec: number): string => {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
};

export const fmtMoney = (n: number): string => "$" + Math.floor(n).toLocaleString("en-US");
export const fmtTokens = (n: number): string => "🪙" + Math.floor(n).toLocaleString("en-US");

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-panel border border-white/10 rounded-md ${className}`}>
      {children}
    </div>
  );
}

export function Bar({
  value,
  colorClass = "bg-accent",
  className = "",
}: {
  value: number; // 0..1
  colorClass?: string;
  className?: string;
}) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div className={`h-1.5 bg-white/10 rounded overflow-hidden ${className}`}>
      <div className={`h-full ${colorClass} transition-[width] duration-200`} style={{ width: `${pct}%` }} />
    </div>
  );
}

const RISK_STYLES: Record<RiskLevel, string> = {
  LOW: "bg-slate-500/20 text-slate-300 border-slate-400/30",
  MEDIUM: "bg-amber-500/15 text-amber-300 border-amber-400/30",
  HIGH: "bg-orange-500/20 text-orange-300 border-orange-500/40",
  CRITICAL: "bg-red-500/20 text-red-300 border-red-500/40",
};

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  return (
    <span className={`px-1.5 py-0.5 text-[10px] border rounded font-bold ${RISK_STYLES[risk]}`}>
      {risk}
    </span>
  );
}

export function DifficultyPips({ difficulty }: { difficulty: number }) {
  const filled = Math.round(difficulty);
  return (
    <span className="inline-flex items-center gap-0.5" title={`Difficulty ${difficulty}/10`}>
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className={`w-1 h-2.5 rounded-[1px] ${i < filled ? "bg-accent" : "bg-white/15"}`}
        />
      ))}
    </span>
  );
}

export function SkillBadge({ skill }: { skill: Skill }) {
  return (
    <span className={`px-1.5 py-0.5 text-[10px] border rounded ${SKILL_STYLES[skill]}`}>
      {skill}
    </span>
  );
}

export function MoneyText({ value, className = "" }: { value: number; className?: string }) {
  return <span className={`text-success font-bold ${className}`}>{fmtMoney(value)}</span>;
}

export function TokenText({ value, className = "" }: { value: number; className?: string }) {
  return <span className={`text-accent font-bold ${className}`}>{fmtTokens(value)}</span>;
}

type BtnVariant = "primary" | "ghost" | "danger" | "success";
const BTN_STYLES: Record<BtnVariant, string> = {
  primary: "bg-accent/15 text-accent border-accent/40 hover:bg-accent/25",
  ghost: "bg-white/5 text-slate-300 border-white/15 hover:bg-white/10",
  danger: "bg-red-500/15 text-red-300 border-red-500/40 hover:bg-red-500/25",
  success: "bg-success/15 text-success border-success/40 hover:bg-success/25",
};

export function Btn({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  className = "",
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  disabled?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={() => {
        sfx.click();
        onClick?.();
      }}
      className={`px-2 py-1 text-[11px] font-bold border rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${BTN_STYLES[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Modal({
  children,
  onClose,
  widthClass = "w-[480px]",
}: {
  children: ReactNode;
  onClose?: () => void;
  widthClass?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className={`bg-panel border border-white/15 rounded-lg shadow-2xl ${widthClass}`}>
        {children}
      </div>
    </div>
  );
}

export function Stat({
  label,
  value,
  valueClass = "text-slate-200",
}: {
  label: string;
  value: ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-1.5">
      <span className="text-[11px] uppercase tracking-wide text-slate-500">{label}</span>
      <span className={`text-sm font-bold ${valueClass}`}>{value}</span>
    </div>
  );
}
