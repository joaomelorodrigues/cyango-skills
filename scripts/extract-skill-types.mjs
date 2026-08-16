#!/usr/bin/env node
// Generates references/cyango-shared-types.md for the cyango-mcp skill: a
// filtered projection of @cyango/cyango-shared covering only the story-editing
// surface the MCP tools can reach.
//
// Output is Markdown, not .d.ts, on purpose. The skill installs into arbitrary
// user projects, and TypeScript's default `include` picks up **/*.d.ts, so a
// stray declaration file would be pulled into a customer's compilation.
//
// This repo publishes to public npm and a public GitHub repo, so the allowlist
// below is a disclosure boundary, not a size optimisation. Modules are included
// wholesale so the projection stays complete as cyango-shared grows; DENY_TYPES
// removes known non-story declarations, and SENSITIVE_PATTERNS fails the build
// if anything unexpected reaches the output.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "skills", "cyango-mcp", "references", "cyango-shared-types.md");

// Modules reachable through the MCP story tools.
const INCLUDE_MODULES = [
  "assetProviders/",
  "assets/",
  "character/",
  "common/",
  "editor/modal/",
  "story/",
];

const DENY_MODULES = ["story/storyTransfers/"];

// Included modules are grab-bags in places. These declarations are backend,
// auth or editor-chrome surface with no story-editing meaning.
const DENY_TYPES = new Set([
  "KeycloakToken",
  "IGeneralRequest",
  "IGeneralResponse",
  "IGeneralResponseBody",
  "SubscriptionType",
  "EmailTemplatesTypeEnum",
  "EmailReplacements",
  "QuestionaireAnswerTypes",
  "LocalStorageTypes",
  "UrlQuery",
  "IItem",
  "RFC5646_LANGUAGE_TAGS", // 233 lines of tags; LanguageTypes is what stories use
]);

// If any of these reach a declaration, generation fails. Guards against a new
// sensitive type landing inside an already-included module.
const SENSITIVE_PATTERNS = [
  /\bstripe\b/i,
  /\bshopify\b/i,
  /\bkeycloak\b/i,
  /\bbilling\b/i,
  /\binvoice\b/i,
  /\bpermission\b/i,
  /\bcredential\b/i,
  /\bapi[_-]?key\b/i,
  /\bclient[_-]?secret\b/i,
  /\baccess_token\b/i,
  // Server-side storage layout and admin privilege boundaries. Internal
  // architecture, and useless to an agent writing story JSON.
  /\bs3\b/i,
  /\buserAssets\//,
  /\bsuper-?admin\b/i,
  /\badmin-(curated|authored)\b/i,
  /\bworker job\b/i,
];

// src/types is preferred over dist/types: TypeScript declaration emit keeps
// JSDoc but drops trailing `//` comments, and those carry most of the semantics
// an agent needs (for example that modalAssetDomElementId is a composite id).
function resolveTypesDir() {
  const fromArg = process.argv.find((a) => a.startsWith("--types-dir="));
  const candidates = [
    fromArg && fromArg.slice("--types-dir=".length),
    process.env.CYANGO_SHARED_TYPES,
    path.join(root, "../cyango-shared/src/types"),
    path.join(root, "node_modules/@cyango/cyango-shared/dist/types"),
    path.join(root, "../cyango-shared/dist/types"),
    path.join(root, "../cyango-cloud-editor/node_modules/@cyango/cyango-shared/dist/types"),
  ].filter(Boolean);
  return candidates.find((c) => fs.existsSync(c)) || null;
}

function walk(dir, base = dir, out = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, base, out);
    else if (/\.(d\.)?ts$/.test(f) && !/\.(test|spec)\.ts$/.test(f)) out.push(path.relative(base, p));
  }
  return out;
}

function included(rel) {
  const unix = rel.split(path.sep).join("/");
  if (DENY_MODULES.some((m) => unix.startsWith(m))) return false;
  return INCLUDE_MODULES.some((m) => unix.startsWith(m));
}

// Type-only declarations. Runtime helpers are editor/player implementation an
// agent cannot call through MCP, so they are not data shapes worth shipping.
// `as const` arrays are the exception: they are where literal union types get
// their allowed values, so dropping them turns a type like PointerEvents into
// an unreadable `(typeof POINTER_EVENTS_VALUES)[number]`.
function isTypeDeclaration(node) {
  if (ts.isVariableStatement(node)) return /\bas const\b/.test(node.getText());
  return (
    ts.isInterfaceDeclaration(node) ||
    ts.isTypeAliasDeclaration(node) ||
    ts.isEnumDeclaration(node) ||
    ts.isModuleDeclaration(node)
  );
}

function declarationName(node) {
  if (ts.isVariableStatement(node)) {
    const d = node.declarationList.declarations[0];
    return d && ts.isIdentifier(d.name) ? d.name.text : null;
  }
  return node.name && ts.isIdentifier(node.name) ? node.name.text : null;
}

// Statement text including the JSDoc directly above it.
function declarationText(node, src) {
  const ranges = ts.getLeadingCommentRanges(src, node.getFullStart()) || [];
  const start = ranges.length ? ranges[ranges.length - 1].pos : node.getStart();
  return src.slice(start, node.getEnd()).trim();
}

// A sensitive word in a doc comment is an internal architecture note that means
// nothing to an agent writing story JSON, so drop the comment. Whole comment
// tokens are removed, never single lines: a sensitive word can sit on the line
// carrying `*/`, and deleting that line alone leaves the comment unterminated
// and swallows the next declaration.
function redactComments(text) {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.Standard, text);
  const cuts = [];
  let token = scanner.scan();
  while (token !== ts.SyntaxKind.EndOfFileToken) {
    const isComment =
      token === ts.SyntaxKind.SingleLineCommentTrivia || token === ts.SyntaxKind.MultiLineCommentTrivia;
    if (isComment) {
      const start = scanner.getTokenStart ? scanner.getTokenStart() : scanner.getTokenPos();
      const end = scanner.getTextPos();
      if (sensitive(text.slice(start, end))) cuts.push([start, end]);
    }
    token = scanner.scan();
  }
  let out = text;
  for (const [start, end] of cuts.reverse()) out = out.slice(0, start) + out.slice(end);
  // Tidy the blank lines and trailing whitespace a removed comment leaves behind.
  return out
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .filter((l, i, a) => !(l === "" && a[i - 1] === ""))
    .join("\n")
    .trim();
}

const typesDir = resolveTypesDir();
if (!typesDir) {
  const msg = "cyango-shared types not found. Pass --types-dir=<path> or set CYANGO_SHARED_TYPES.";
  if (fs.existsSync(OUT)) {
    console.warn(`[skill-types] ${msg} Keeping the committed ${path.basename(OUT)}.`);
    process.exit(0);
  }
  console.error(`[skill-types] ${msg}`);
  process.exit(1);
}

const sensitive = (s) => SENSITIVE_PATTERNS.some((re) => re.test(s));
const files = walk(typesDir).filter(included).sort();
const sections = [];
const offenders = [];
let kept = 0;
let dropped = 0;
let scrubbed = 0;

for (const rel of files) {
  const full = path.join(typesDir, rel);
  const src = fs.readFileSync(full, "utf8");
  const sf = ts.createSourceFile(full, src, ts.ScriptTarget.Latest, true);
  const decls = [];

  for (const node of sf.statements) {
    if (!isTypeDeclaration(node)) continue;
    const name = declarationName(node);
    if (name && DENY_TYPES.has(name)) {
      dropped++;
      continue;
    }

    const raw = declarationText(node, src).replace(/\bexport declare /g, "export ");
    const text = redactComments(raw);
    if (text !== raw) scrubbed++;

    // Comments are gone by now, so anything still matching is a real leak.
    if (sensitive(text)) {
      const line = text.split("\n").find((l) => sensitive(l)) || "";
      offenders.push(`  ${rel}: ${line.trim().slice(0, 100)}`);
    }

    decls.push(text);
    kept++;
  }

  if (decls.length) sections.push({ rel: rel.split(path.sep).join("/"), decls });
}

if (offenders.length) {
  console.error(
    `[skill-types] Refusing to write: ${offenders.length} declaration line(s) match a sensitive pattern.\n` +
      `This repo publishes publicly. Add the declaration to DENY_TYPES, or its module to\n` +
      `DENY_MODULES, then re-run.\n${offenders.slice(0, 20).join("\n")}`,
  );
  process.exit(1);
}

let out = `# cyango-shared type reference

GENERATED by \`scripts/extract-skill-types.mjs\`. Do not edit by hand.

The exact shape of every story field the MCP tools read and write, taken from the types the editor itself runs on. Use it whenever a field's shape is not spelled out in the other reference pages.

**Grep this file by name** (\`interface IModal\`, \`enum ActionType\`) instead of reading it top to bottom.

This is a filtered projection, not the whole package: backend, billing, workspace, analytics and auth modules are excluded, and so are runtime helpers. Some declarations below therefore reference types that are not in this file. That is expected. This is reference material, not a compilation unit.

`;

for (const s of sections) {
  out += `## ${s.rel}\n\n\`\`\`ts\n${s.decls.join("\n\n")}\n\`\`\`\n\n`;
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out.trimEnd() + "\n", "utf8");

console.log(
  `[skill-types] Wrote ${path.relative(root, OUT)} from ${typesDir}\n` +
    `  ${sections.length} modules, ${kept} declarations, ${dropped} denied, ` +
    `${scrubbed} comment lines scrubbed, ${out.split("\n").length} lines.`,
);
