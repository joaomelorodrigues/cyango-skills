#!/usr/bin/env node
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { readPackageVersion, patchSkillMdFile } from "./skill-version-patch.mjs";

const SKILLS_PATH = "plugin/skills";

/** Skills shipped inside the npm tarball (`files`: bin, plugin/skills). */
const AVAILABLE_SKILLS = ["cyango-mcp"];

const pkgRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function bundledSkillPath(skillName) {
  return path.join(pkgRoot, SKILLS_PATH, skillName);
}

function installFromBundled(skillName, dest) {
  const src = bundledSkillPath(skillName);
  if (!fs.existsSync(src) || !fs.statSync(src).isDirectory()) {
    return false;
  }
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
  patchSkillMdFile(path.join(dest, "SKILL.md"), readPackageVersion(pkgRoot));
  return true;
}

const [, , command, skillName] = process.argv;

if (command === "install" && skillName) {
  if (!AVAILABLE_SKILLS.includes(skillName)) {
    console.error(`Unknown skill: "${skillName}"`);
    console.error(`Available: ${AVAILABLE_SKILLS.join(", ")}`);
    process.exit(1);
  }

  const dest = path.join(process.cwd(), ".agents", "skills", skillName);
  console.log(`Installing ${skillName} from @cyango-tools/skills (npm bundle only)...`);

  if (!installFromBundled(skillName, dest)) {
    console.error(
      `Missing bundled skill at ${bundledSkillPath(skillName)}.\n` +
        "This CLI only installs files that ship inside the npm package (no GitHub fallback).\n" +
        "Use: npx @cyango-tools/skills@latest install cyango-mcp",
    );
    process.exit(1);
  }

  console.log(`✓ Installed to ${dest}`);
} else if (command === "list") {
  console.log("Available skills (from npm package):");
  for (const s of AVAILABLE_SKILLS) {
    console.log(`  - ${s}`);
  }
} else {
  console.log("Usage:");
  console.log("  npx @cyango-tools/skills@latest install cyango-mcp");
  console.log("  npx @cyango-tools/skills@latest list");
}
