import fs from "fs";
import path from "path";

/** Read `"version"` from package.json at `pkgRoot`. */
export function readPackageVersion(pkgRoot) {
  try {
    const raw = fs.readFileSync(path.join(pkgRoot, "package.json"), "utf8");
    const v = JSON.parse(raw).version;
    return typeof v === "string" ? v : "unknown";
  } catch {
    return "unknown";
  }
}

const VERSION_LINE_RE = /\*\*@cyango-tools\/skills version:\*\* `[^`]*`/;
const COMMENTED_VERSION_RE =
  /<!--\s*\*\*@cyango-tools\/skills version:\*\* `[^`]*`\s*-->\n?/;

/** Ensure SKILL.md documents the @cyango-tools/skills package version (insert or replace). */
export function patchSkillMdContent(md, version) {
  const line = `**@cyango-tools/skills version:** \`${version}\``;
  if (COMMENTED_VERSION_RE.test(md)) {
    return md.replace(COMMENTED_VERSION_RE, `${line}\n`);
  }
  if (VERSION_LINE_RE.test(md)) {
    return md.replace(VERSION_LINE_RE, line);
  }
  const end = md.indexOf("\n---\n", 4);
  if (end === -1) {
    return `${md.trimEnd()}\n\n${line}\n`;
  }
  const after = end + "\n---\n".length;
  return `${md.slice(0, after)}\n${line}\n${md.slice(after)}`;
}

export function patchSkillMdFile(skillMdPath, version) {
  if (!fs.existsSync(skillMdPath)) return;
  const md = fs.readFileSync(skillMdPath, "utf8");
  const next = patchSkillMdContent(md, version);
  if (next !== md) {
    fs.writeFileSync(skillMdPath, next, "utf8");
  }
}
