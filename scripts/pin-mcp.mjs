#!/usr/bin/env node
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pluginDir = path.join(root, "plugin");
const PACKAGE = "@cyango-tools/mcp-server";

function latestMcpVersion() {
  const output = execSync(
    `npm view ${PACKAGE} version --registry https://registry.npmjs.org/`,
    { encoding: "utf8" },
  );
  const version = output
    .split("\n")
    .map((line) => line.trim())
    .find((line) => /^\d+\.\d+\.\d+/.test(line));
  if (!version) {
    throw new Error(`npm did not return a version for ${PACKAGE}`);
  }
  return version;
}

const version = latestMcpVersion();

function pinMcpConfig(filePath) {
  const mcp = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const args = mcp.mcpServers?.cyango?.args;
  const pinIndex = Array.isArray(args)
    ? args.findIndex((arg) => typeof arg === "string" && arg.startsWith(`${PACKAGE}@`))
    : -1;
  if (pinIndex < 0) {
    throw new Error(`${filePath} has no ${PACKAGE}@ pin`);
  }
  args[pinIndex] = `${PACKAGE}@${version}`;
  fs.writeFileSync(filePath, `${JSON.stringify(mcp, null, 2)}\n`);
}

pinMcpConfig(path.join(pluginDir, ".mcp.json"));
pinMcpConfig(path.join(pluginDir, "mcp.json"));

const pluginPackagePath = path.join(pluginDir, "package.json");
const pluginPackage = JSON.parse(fs.readFileSync(pluginPackagePath, "utf8"));
pluginPackage.dependencies ??= {};
pluginPackage.dependencies[PACKAGE] = version;
fs.writeFileSync(pluginPackagePath, `${JSON.stringify(pluginPackage, null, 2)}\n`);

execSync(
  "npm install --package-lock-only --ignore-scripts --registry https://registry.npmjs.org/",
  { cwd: pluginDir, stdio: "inherit" },
);

console.log(`Pinned ${PACKAGE}@${version}`);
