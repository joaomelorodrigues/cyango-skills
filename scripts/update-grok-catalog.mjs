#!/usr/bin/env node
import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const fork = "joaomelorodrigues/plugin-marketplace";
const branch = "cyango-plugin";
const pluginName = "cyango";

const sha =
  process.argv[2] ||
  execSync("git rev-parse HEAD", { cwd: root, encoding: "utf8" }).trim();

if (!/^[0-9a-f]{40}$/.test(sha)) {
  console.error(`Grok catalog needs a full commit SHA, got: ${sha}`);
  process.exit(1);
}

const checkout = fs.mkdtempSync(path.join(os.tmpdir(), "cyango-grok-catalog-"));

function run(cmd) {
  execSync(cmd, { cwd: checkout, stdio: "inherit" });
}

run(
  `gh repo clone ${fork} ${checkout} -- --branch ${branch} --single-branch --depth 1`,
);

const catalogPath = path.join(checkout, ".grok-plugin", "marketplace.json");
const catalogText = fs.readFileSync(catalogPath, "utf8");
const catalog = JSON.parse(catalogText);
const plugin = catalog.plugins?.find((entry) => entry.name === pluginName);
const currentSha = plugin?.source?.sha;
if (!currentSha) {
  console.error(`No ${pluginName} source.sha in ${fork}`);
  process.exit(1);
}
if (currentSha === sha) {
  console.log(`Grok catalog already pins ${sha}`);
  process.exit(0);
}

fs.writeFileSync(catalogPath, catalogText.replaceAll(currentSha, sha));
run("python3 scripts/validate-catalog.py");
run("python3 scripts/generate-plugin-index.py");
run("git add .grok-plugin/marketplace.json .grok-plugin/plugin-index.json");

const dirty = execSync("git status --porcelain", {
  cwd: checkout,
  encoding: "utf8",
}).trim();
if (!dirty) {
  console.log(`Grok catalog already pins ${sha}`);
  process.exit(0);
}

run(`git commit -m "Pin Cyango to ${sha}."`);
run(`git push origin ${branch}`);
console.log(`Updated ${fork} ${branch} to ${sha}`);
