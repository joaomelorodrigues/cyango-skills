#!/usr/bin/env node
// Builds the OpenAI desktop-only plugin ZIP: manifest, skills, icon, and the pinned connector with its dependencies.
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pluginDir = path.join(root, "plugin");
const openaiDir = path.join(root, "openai");
const buildDir = path.join(root, "build", "openai");
const stageDir = path.join(buildDir, "cyango");

const manifest = JSON.parse(fs.readFileSync(path.join(openaiDir, "plugin.json"), "utf8"));
fs.rmSync(buildDir, { recursive: true, force: true });
fs.mkdirSync(path.join(stageDir, "assets"), { recursive: true });
fs.mkdirSync(path.join(stageDir, "server"), { recursive: true });

fs.copyFileSync(path.join(openaiDir, "plugin.json"), path.join(stageDir, "plugin.json"));
fs.copyFileSync(path.join(openaiDir, "mcp.json"), path.join(stageDir, "mcp.json"));
fs.copyFileSync(path.join(pluginDir, "LICENSE"), path.join(stageDir, "LICENSE"));
fs.copyFileSync(path.join(pluginDir, ".claude-plugin", "icon.png"), path.join(stageDir, "assets", "icon.png"));
fs.cpSync(path.join(pluginDir, "skills"), path.join(stageDir, "skills"), { recursive: true });
fs.cpSync(path.join(openaiDir, "skills"), path.join(stageDir, "skills"), { recursive: true });
fs.copyFileSync(path.join(pluginDir, "package.json"), path.join(stageDir, "server", "package.json"));
fs.copyFileSync(path.join(pluginDir, "package-lock.json"), path.join(stageDir, "server", "package-lock.json"));

execSync(
  "npm ci --omit=dev --ignore-scripts --no-audit --no-fund --registry https://registry.npmjs.org/ '--@cyango-tools:registry=https://registry.npmjs.org/'",
  { cwd: path.join(stageDir, "server"), stdio: "inherit" },
);

const zipPath = path.join(buildDir, `cyango-openai-${manifest.version}.zip`);
execSync(`zip -qr -X "${zipPath}" . -x "*.DS_Store"`, { cwd: stageDir, stdio: "inherit" });
console.log(`Built ${path.relative(root, zipPath)}`);
