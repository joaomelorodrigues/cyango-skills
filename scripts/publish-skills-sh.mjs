#!/usr/bin/env node
import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { readPackageVersion } from "../bin/skill-version-patch.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = "joaomelorodrigues/cyango-skills";
const skill = "cyango-mcp";
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

function seedSkillsShListing(version) {
  if (process.env.DISABLE_TELEMETRY || process.env.DO_NOT_TRACK) {
    console.warn(
      "publish-skills-sh: telemetry disabled (DISABLE_TELEMETRY or DO_NOT_TRACK). skills.sh will not update.",
    );
    return;
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cyango-skills-sh-seed-"));
  try {
    execSync(`npx --yes skills add ${repo} --skill ${skill} -y`, {
      cwd: tmpDir,
      stdio: "inherit",
      env: process.env,
    });
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  console.log(
    `Seeded skills.sh listing for ${repo}@${skill} (v${version}) via npx skills add`,
  );
}

async function waitForSkillPage(version, maxAttempts = 12, delayMs = 5000) {
  const versionNeedle = `\`${version}\``;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(SKILL_PAGE, { redirect: "follow" });
      if (response.ok) {
        const html = await response.text();
        if (html.includes(versionNeedle)) {
          return true;
        }
      }
    } catch {
      // retry
    }

    if (attempt < maxAttempts) {
      console.log(
        `Waiting for skills.sh to show v${version} (${attempt}/${maxAttempts})…`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return false;
}

const version = readPackageVersion(root);
ensureGitPushed();
seedSkillsShListing(version);

const indexed = await waitForSkillPage(version);
if (indexed) {
  console.log(`Live: ${SKILL_PAGE}`);
} else {
  console.warn(
    [
      "Install telemetry sent, but skills.sh has not picked up the new version yet.",
      "This can take a few minutes. Check later:",
      SKILL_PAGE,
    ].join("\n"),
  );
}
