#!/usr/bin/env node
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { readPackageVersion } from "../bin/skill-version-patch.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = "joaomelorodrigues/cyango-skills";
const skill = "cyango-mcp";
const skillFile = "skills/cyango-mcp/SKILL.md";
const TELEMETRY_URL = "https://add-skill.vercel.sh/t";
const SKILL_PAGE = `https://skills.sh/${repo}/${skill}`;

function run(cmd, opts = {}) {
  return execSync(cmd, { cwd: root, stdio: "pipe", encoding: "utf8", ...opts }).trim();
}

function ensureGitPushed() {
  run("git fetch origin");

  const branch = run("git rev-parse --abbrev-ref HEAD");
  let remoteRef = "origin/main";
  try {
    const upstream = run(`git rev-parse --abbrev-ref ${branch}@{upstream}`, {
      stdio: ["pipe", "pipe", "ignore"],
    });
    if (upstream.includes("/")) {
      remoteRef = upstream;
    }
  } catch {
    // fall back to origin/main
  }

  const local = run("git rev-parse HEAD");
  const remote = run(`git rev-parse ${remoteRef}`);

  if (local !== remote) {
    console.error(
      [
        "Local branch is not pushed to GitHub.",
        "skills.sh installs from GitHub, not npm — push first, then re-run:",
        "  npm run publish:skills-sh",
        "",
        "Or run the full release flow:",
        "  npm run release:patch",
      ].join("\n"),
    );
    process.exit(1);
  }
}

async function sendInstallTelemetry(version) {
  if (process.env.DISABLE_TELEMETRY || process.env.DO_NOT_TRACK) {
    console.warn(
      "publish-skills-sh: telemetry disabled (DISABLE_TELEMETRY or DO_NOT_TRACK). skills.sh will not update.",
    );
    return;
  }

  const params = new URLSearchParams({
    event: "install",
    source: repo,
    skills: skill,
    agents: "release-script",
    skillFiles: JSON.stringify({ [skill]: skillFile }),
    installUrl: `https://github.com/${repo}`,
    metadata: JSON.stringify({
      version,
      package: "@cyango-tools/skills",
      source: "release",
    }),
  });

  const response = await fetch(`${TELEMETRY_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`skills.sh telemetry failed (${response.status})`);
  }
}

async function waitForSkillPage(maxAttempts = 12, delayMs = 5000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(SKILL_PAGE, { redirect: "follow" });
      if (response.ok) {
        return true;
      }
    } catch {
      // retry
    }

    if (attempt < maxAttempts) {
      console.log(
        `Waiting for skills.sh to index ${skill} (${attempt}/${maxAttempts})…`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return false;
}

const version = readPackageVersion(root);
ensureGitPushed();
await sendInstallTelemetry(version);
console.log(`Sent skills.sh telemetry for ${repo}@${skill} (v${version})`);

const indexed = await waitForSkillPage();
if (indexed) {
  console.log(`Live: ${SKILL_PAGE}`);
} else {
  console.warn(
    [
      "Telemetry sent, but the skills.sh page is not live yet.",
      "This can take a few minutes. Check later:",
      SKILL_PAGE,
    ].join("\n"),
  );
}
