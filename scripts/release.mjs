#!/usr/bin/env node
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { readPackageVersion } from "../bin/skill-version-patch.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const bump = process.argv[2];

const VALID_BUMPS = new Set(["patch", "minor", "major"]);
if (!VALID_BUMPS.has(bump)) {
  console.error("Usage: node scripts/release.mjs <patch|minor|major>");
  process.exit(1);
}

function run(cmd) {
  execSync(cmd, { cwd: root, stdio: "inherit" });
}

run(`npm run bump:${bump}`);
run("npm run sync:skill-version");
run("node scripts/pin-mcp.mjs");

const version = readPackageVersion(root);
const releasePaths = [
  "package.json",
  "plugin/.claude-plugin/plugin.json",
  "plugin/.mcp.json",
  "plugin/package.json",
  "plugin/package-lock.json",
  "plugin/skills",
];

run(`git add ${releasePaths.join(" ")}`);
const dirty = execSync("git diff --cached --name-only", {
  cwd: root,
  encoding: "utf8",
}).trim();

if (dirty) {
  run(`git commit -m "chore: release v${version}"`);
}

try {
  execSync(`git rev-parse v${version}`, { cwd: root, stdio: "pipe" });
} catch {
  run(`git tag v${version}`);
}

run("git push origin HEAD");
run(`git push origin v${version}`);
run("npm run publish:npm");
run("npm run publish:skills-sh");

const sha = execSync("git rev-parse HEAD", { cwd: root, encoding: "utf8" }).trim();
run(`node scripts/update-grok-catalog.mjs ${sha}`);

console.log(`Released @cyango-tools/skills@${version}`);
console.log(
  "Claude scans main after the push. Publish the passing version in the directory if auto-publish is off.",
);
