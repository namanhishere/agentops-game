import { Skill } from "../types";

export const TASK_TEMPLATES: Record<Skill, { name: string; desc: string }[]> = {
  coding: [
    { name: "Fix authentication", desc: "Close the JWT token replay hole before the pentest." },
    { name: "Implement API endpoint", desc: "Ship the missing REST endpoint for the new dashboard." },
    { name: "Refactor database layer", desc: "Untangle the query spaghetti before it breaks prod." },
    { name: "Fix memory leak", desc: "Find the runaway reference in the worker pool." },
    { name: "Add caching layer", desc: "Cut origin load with a sane cache tier." },
    { name: "Patch security hole", desc: "Close the injection vector found in the last scan." },
    { name: "Build dashboard widgets", desc: "Wire up the live charts the client demo needs." },
  ],
  research: [
    { name: "Analyze competitor", desc: "Map the competitor's pricing and feature gaps." },
    { name: "Summarize research papers", desc: "Turn 20 arXiv papers into one actionable brief." },
    { name: "Find market trends", desc: "Spot the shift before the client's roadmap meeting." },
    { name: "Analyze customer dataset", desc: "Find churn signals in the messy CSVs." },
    { name: "Benchmark LLM models", desc: "Which model wins on cost vs. quality? Prove it." },
    { name: "Literature review", desc: "Digest the state of the art for the grant application." },
  ],
  testing: [
    { name: "Run regression tests", desc: "Catch what the last deploy broke." },
    { name: "Find UI bugs", desc: "Click through the flows a user actually touches." },
    { name: "Verify API behavior", desc: "Confirm the contract holds under real payloads." },
    { name: "Stress test system", desc: "Break it before the client does." },
    { name: "Write test suite", desc: "Cover the critical paths that have zero tests." },
    { name: "Security audit", desc: "Probe for the holes nobody reported yet." },
  ],
  devops: [
    { name: "Deploy service", desc: "Ship the new build without waking the on-call." },
    { name: "Configure CI/CD", desc: "Make the pipeline fast, green, and loud when it breaks." },
    { name: "Fix Docker build", desc: "Unblock the image that fails at the last layer." },
    { name: "Monitor production", desc: "Add the alerts you would want at 3am." },
    { name: "Migrate database", desc: "Move the data with zero downtime." },
    { name: "Scale infrastructure", desc: "Squeeze headroom out of the current fleet." },
  ],
  creative: [
    { name: "Generate landing page", desc: "Draft a page that converts in the first fold." },
    { name: "Design UI", desc: "Polish the interface the devs already built." },
    { name: "Write documentation", desc: "Make the API docs readable by humans." },
    { name: "Create marketing copy", desc: "Find the hook that sells the platform." },
    { name: "Design logo", desc: "Give the product an identity that survives 16px." },
    { name: "Draft pitch deck", desc: "Tell the story investors will remember." },
  ],
};

// Indices 0..4 map to stages 1..5.
export const STAGE_DIFFICULTY: [number, number][] = [
  [1, 3],
  [2, 5],
  [3, 7],
  [4, 8],
  [6, 10],
];

export const SKILL_WEIGHTS: [Skill, number][] = [
  ["coding", 30],
  ["research", 20],
  ["testing", 20],
  ["devops", 15],
  ["creative", 15],
];

export const BOSS_TASK_BASE = {
  name: "Build & Deploy AI Platform",
  description:
    "Full-stack AI platform with model serving, research pipeline, QA, and DevOps.",
  difficulty: 10,
  requiredSkills: ["coding", "research", "testing", "devops"] as Skill[],
  rewardMoney: 5000,
  rewardTokens: 5000,
  cost: 1200,
  tokenCost: 2000,
  duration: 90,
  deadline: 180,
  risk: "CRITICAL",
  failurePenalty: 300,
  isBoss: true,
} as const;
