#!/usr/bin/env node

import { createServer } from "node:http";
import { watch } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const docsDir = path.join(repoRoot, "docs");
const dashboardPath = path.join(docsDir, "opencode-work-dashboard.html");
const progressPath = path.join(docsDir, "progress.md");
const opencodePath = path.join(repoRoot, "opencode.json");

const args = new Map(
  process.argv.slice(2).flatMap((arg, index, all) => {
    if (!arg.startsWith("--")) return [];
    const [key, value] = arg.includes("=") ? arg.split(/=(.*)/s, 2) : [arg, all[index + 1]];
    return [[key.replace(/^--/, ""), value]];
  }),
);

const host = args.get("host") || process.env.DASHBOARD_HOST || "0.0.0.0";
const port = Number(args.get("port") || process.env.DASHBOARD_PORT || 4174);
const clients = new Set();

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "access-control-allow-origin": "*",
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload, null, 2));
}

function sendSse(response, event, data) {
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(data)}\n\n`);
}

function broadcast(event, data) {
  for (const client of clients) sendSse(client, event, data);
}

function cleanMarkdown(value) {
  return value
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .trim();
}

function extractSection(markdown, title) {
  const lines = markdown.split("\n");
  const start = lines.findIndex((line) => line.trim() === `## ${title}`);
  if (start === -1) return "";
  const end = lines.findIndex((line, index) => index > start && line.startsWith("## "));
  return lines.slice(start + 1, end === -1 ? undefined : end).join("\n").trim();
}

function bulletsFrom(section) {
  return section
    .split("\n")
    .map((line) => line.match(/^[-*]\s+(.+)/)?.[1])
    .filter(Boolean)
    .map(cleanMarkdown);
}

function numberedFrom(section) {
  return section
    .split("\n")
    .map((line) => line.match(/^\d+\.\s+(.+)/)?.[1])
    .filter(Boolean)
    .map(cleanMarkdown);
}

function progressFor(status) {
  if (["Done", "Complete", "Updated"].includes(status)) return 100;
  if (status === "In progress") return 55;
  return 20;
}

const agentKeywordMap = {
  architect: ["supabase", "schema", "rls", "storage", "migration", "architecture", "database", "realtime"],
  build: ["implementation", "dashboard", "workflow", "issue", "fix", "build", "active agents"],
  explore: ["docs", "progress", "trace", "discovery", "files", "context", "read-only"],
  frontend: ["frontend", "react", "vite", "tailwind", "router", "redux", "ui", "dashboard", "shell"],
  monetization: ["monetization", "billing", "subscription", "pricing", "campaign fees", "x-deal"],
  plan: ["planning", "roadmap", "issue", "epic", "next recommended", "sequence", "review"],
  security: ["security", "auth", "role", "rls", "privacy", "compliance", "permission", "guard"],
  testing: ["test", "tests", "quality", "typecheck", "verification", "regression", "uat"],
};

function isDoneStatus(status = "") {
  return ["Done", "Complete", "Updated"].includes(status);
}

function scoreWorkForAgent(item, name, agent) {
  const notes = item.notes && !item.notes.startsWith("Generated from") ? item.notes : "";
  const haystack = `${item.title} ${item.scope} ${notes}`.toLowerCase();
  const keywords = [name, ...(agentKeywordMap[name] || [])];
  let score = 0;
  for (const keyword of keywords) {
    if (haystack.includes(keyword.toLowerCase())) score += keyword === name ? 12 : 4;
  }
  if (score === 0) return 0;
  if (item.status === "In progress") score += 8;
  if (["Requested", "Ready", "Backlog"].includes(item.status)) score += 3;
  if (isDoneStatus(item.status)) score -= 2;
  return score;
}

function workSummaryForAgent(name, agent, workItems) {
  const scored = workItems
    .map((item) => ({ item, score: scoreWorkForAgent(item, name, agent) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      const activeDelta = Number(!isDoneStatus(b.item.status)) - Number(!isDoneStatus(a.item.status));
      if (activeDelta) return activeDelta;
      return b.score - a.score;
    });
  const selected = scored[0]?.item;
  if (!selected) {
    return {
      currentTask: agent.description || "Monitoring project context",
      progress: agent.permission?.edit === "deny" && agent.permission?.bash === "deny" ? 38 : 45,
      workStatus: agent.permission?.edit === "deny" && agent.permission?.bash === "deny" ? "Watching" : "Idle",
      lastActivity: "No matching progress item in docs/progress.md yet.",
      relatedWorkCount: 0,
    };
  }
  return {
    currentTask: selected.title,
    progress: selected.progress,
    workStatus: selected.status,
    lastActivity: selected.notes && !selected.notes.startsWith("Generated from") ? selected.notes : selected.scope,
    relatedWorkCount: scored.length,
  };
}

function agentStatus(name, agent, summary) {
  if (summary?.workStatus === "In progress") return "Working";
  if (summary && !isDoneStatus(summary.workStatus) && summary.relatedWorkCount > 0) return "Ready";
  if (agent.permission?.edit === "deny" && agent.permission?.bash === "deny") return "Watching";
  return "Idle";
}

function logsForAgent(agent, index, workItems) {
  const now = Date.now();
  const related = workItems
    .map((item) => ({ item, score: scoreWorkForAgent(item, agent.name, agent) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item)
    .slice(0, 3);
  const base = related.length
    ? related.map((item) => `${item.status}: ${item.title}`)
    : [
        `${agent.status}: ${agent.currentTask || agent.description}`,
        `mode=${agent.mode} model=${agent.model}`,
        agent.canRunBash ? "bash permission requires approval" : "bash disabled for this agent",
      ];

  return base.map((message, messageIndex) => ({
    id: `${agent.name}-${now}-${messageIndex}`,
    agent: agent.name,
    level: message.toLowerCase().includes("error") ? "error" : message.toLowerCase().includes("done") ? "success" : "info",
    message,
    timestamp: new Date(now - (index * 43 + messageIndex * 17) * 1000).toISOString(),
  }));
}

async function getDashboardData() {
  const [markdown, progressStat, opencodeRaw, opencodeStat] = await Promise.all([
    readFile(progressPath, "utf8"),
    stat(progressPath),
    readFile(opencodePath, "utf8"),
    stat(opencodePath),
  ]);
  const opencode = JSON.parse(opencodeRaw);
  const completed = bulletsFrom(extractSection(markdown, "Completed"));
  const inProgress = bulletsFrom(extractSection(markdown, "In progress"));
  const next = numberedFrom(extractSection(markdown, "Next recommended work"));
  const snapshot = extractSection(markdown, "Current opencode work snapshot");
  const tableRows = snapshot
    .split("\n")
    .filter((line) => /^\|\s*[^|-]/.test(line))
    .slice(1)
    .map((line) => line.split("|").slice(1, -1).map(cleanMarkdown))
    .filter((cells) => cells.length >= 4)
    .map(([title, scope, status, notes]) => ({ title, scope, status, notes }));

  const generated = [
    ...completed.map((title) => ({ title, scope: "Completed project progress", status: "Complete" })),
    ...inProgress.map((title) => ({ title, scope: "Current implementation focus", status: "In progress" })),
    ...tableRows,
    ...next.map((title) => ({ title, scope: "Next recommended work", status: "Requested" })),
  ];
  const seen = new Set();
  const workItems = generated
    .filter((item) => item.title && !/^Work item$/i.test(item.title))
    .filter((item) => {
      const key = `${item.title}:${item.status}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((item) => ({
      title: item.title,
      scope: item.scope || "Current project work",
      status: item.status || "Requested",
      progress: progressFor(item.status || "Requested"),
      notes: item.notes || "Generated from docs/progress.md.",
      tags: ["docs", "progress"],
    }));

  const agents = Object.entries(opencode.agent || {}).map(([name, agent]) => {
    const normalized = {
      mode: agent.mode || "agent",
      model: agent.model || opencode.model,
      description: agent.description || "OpenCode agent",
      permission: agent.permission || {},
    };
    const summary = workSummaryForAgent(name, normalized, workItems);
    return {
      name,
      mode: normalized.mode,
      model: normalized.model,
      description: normalized.description,
      status: agentStatus(name, normalized, summary),
      canEdit: normalized.permission?.edit !== "deny",
      canRunBash: normalized.permission?.bash !== "deny",
      currentTask: summary.currentTask,
      progress: summary.progress,
      workStatus: summary.workStatus,
      lastActivity: summary.lastActivity,
      relatedWorkCount: summary.relatedWorkCount,
    };
  });
  const agentLogs = Object.fromEntries(agents.map((agent, index) => [agent.name, logsForAgent(agent, index, workItems)]));

  const sparklines = Object.fromEntries(agents.map((agent, index) => {
    const points = 14;
    const base = agent.status === "Working" ? 72 : agent.status === "Ready" ? 52 : 34;
    const seed = index * 7 + 13;
    const series = Array.from({ length: points }, (_, i) => {
      const phase = Math.sin((i / (points - 1)) * Math.PI * 2 + seed) * 14;
      const noise = Math.sin(Date.now() / 8000 + i * 0.6 + index * 3) * 10;
      return Math.max(4, Math.min(100, Math.round(base + phase + noise)));
    });
    return [agent.name, series];
  }));

  return {
    source: "docs/progress.md + opencode.json",
    updatedAt: progressStat.mtime.toISOString(),
    opencodeUpdatedAt: opencodeStat.mtime.toISOString(),
    generatedAt: new Date().toISOString(),
    workItems,
    agents,
    agentLogs,
    sparklines,
  };
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    if (url.pathname === "/" || url.pathname === "/opencode-work-dashboard.html") {
      const html = await readFile(dashboardPath, "utf8");
      response.writeHead(200, { "cache-control": "no-store", "content-type": "text/html; charset=utf-8" });
      response.end(html);
      return;
    }
    if (url.pathname === "/api/work-items") return sendJson(response, 200, await getDashboardData());
    if (url.pathname === "/events") {
      response.writeHead(200, {
        "access-control-allow-origin": "*",
        "cache-control": "no-store",
        connection: "keep-alive",
        "content-type": "text/event-stream; charset=utf-8",
      });
      response.write("retry: 1500\n\n");
      clients.add(response);
      sendSse(response, "connected", { clients: clients.size, generatedAt: new Date().toISOString() });
      request.on("close", () => clients.delete(response));
      return;
    }
    sendJson(response, 404, { error: "Not found" });
  } catch (error) {
    sendJson(response, 500, { error: error instanceof Error ? error.message : String(error) });
  }
});

let timer;
function scheduleBroadcast() {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    try {
      broadcast("progress", await getDashboardData());
    } catch (error) {
      broadcast("error", { message: error instanceof Error ? error.message : String(error) });
    }
  }, 200);
}

watch(docsDir, { persistent: true }, (_eventType, filename) => {
  if (["progress.md", "opencode-work-dashboard.html"].includes(filename?.toString())) scheduleBroadcast();
});
watch(opencodePath, { persistent: true }, scheduleBroadcast);

server.listen(port, host, () => {
  console.log(`OpenCode project dashboard: http://${host}:${port}`);
  console.log(`Local URL: http://localhost:${port}`);
  console.log("Use your Tailscale machine name/IP with this port to view it remotely.");
});
