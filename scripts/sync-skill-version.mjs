#!/usr/bin/env node
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import {
  readPackageVersion,
  patchSkillMdFile,
} from "../bin/skill-version-patch.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillMd = path.join(root, "plugin", "skills", "cyango-mcp", "SKILL.md");
const version = readPackageVersion(root);
patchSkillMdFile(skillMd, version);

const pluginJson = path.join(root, "plugin", ".claude-plugin", "plugin.json");
const manifest = JSON.parse(fs.readFileSync(pluginJson, "utf8"));
manifest.version = version;
fs.writeFileSync(pluginJson, JSON.stringify(manifest, null, 2) + "\n");

const pluginPackagePath = path.join(root, "plugin", "package.json");
const pluginPackage = JSON.parse(fs.readFileSync(pluginPackagePath, "utf8"));
pluginPackage.version = version;
fs.writeFileSync(pluginPackagePath, JSON.stringify(pluginPackage, null, 2) + "\n");
