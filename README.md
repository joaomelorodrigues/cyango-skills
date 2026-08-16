# cyango-skills

Agent skills for the Cyango platform. Install them into any project with a single command.

## Install a skill

### From npm (recommended for Cyango projects)

```bash
npx @cyango-tools/skills@latest install cyango-mcp
```

This copies the skill from **inside the npm package** into `.agents/skills/cyango-mcp/` in your project. There is **no** clone from GitHub — only what ships in `@cyango-tools/skills` on npm. Cursor and other agent tools pick up `.agents/skills/` automatically.

### From skills.sh (Vercel open skills directory)

```bash
npx skills add joaomelorodrigues/cyango-skills --skill cyango-mcp
```

This installs from the public GitHub repo and registers anonymous install telemetry on [skills.sh](https://skills.sh/joaomelorodrigues/cyango-skills/cyango-mcp).

## Available skills

| Skill | Description |
|-------|-------------|
| `cyango-mcp` | Teaches AI agents how to work with the Cyango MCP live editor — plural/batched write tools, entity types, GUI layout, scene hierarchy, schema-safe values, bridge status, patch validation, and prefab instantiation. |

## Adding skills to a project manually

If you prefer not to use the CLI, copy the contents of `skills/<skill-name>/` into `.agents/skills/<skill-name>/` in your project.

## Updating a skill

The CLI copies only from the **installed npm package** (`skills/<name>/` in the tarball). It does **not** pull from GitHub. Re-run install to overwrite `.agents/skills/`:

```bash
npx @cyango-tools/skills@latest install cyango-mcp
```

Use `@latest` (or a pinned version) so `npx` does not keep an old cached tarball of the CLI.

## Generated type reference

`skills/cyango-mcp/references/cyango-shared-types.md` is generated, not hand-written. It gives the agent the exact shape of every story field, so the markdown pages can cover behaviour instead of trying to enumerate fields.

```bash
npm run types:skill
```

`prepack` runs it automatically, so a release always ships types matching the current `cyango-shared`.

**The allowlist in `scripts/extract-skill-types.mjs` is a disclosure boundary.** This package is public on npm and GitHub. The script emits only the story-editing modules, drops runtime helpers, scrubs internal notes out of doc comments, and **fails the build** if a billing, auth, storage or permission term reaches a declaration. If it refuses to write, do not loosen `SENSITIVE_PATTERNS` to get past it. Add the offending declaration to `DENY_TYPES`, or its module to `DENY_MODULES`.

Source resolution order, first hit wins: `--types-dir=<path>`, `CYANGO_SHARED_TYPES`, a sibling `../cyango-shared/src/types`, then `dist/types` from node_modules. Source is preferred because TypeScript declaration emit drops the trailing `//` comments, and those carry most of the meaning. When no source is found the committed file is kept, so publishing never silently ships an empty reference.

## Publishing a release

Releases sync the skill version, push to GitHub, publish to npm, and seed skills.sh telemetry.

```bash
npm run release:patch   # or release:minor / release:major
```

What `release:*` does:

1. Regenerate `references/cyango-shared-types.md`, bump `package.json`, and sync the version line in `skills/cyango-mcp/SKILL.md`
2. Commit, tag (`v<version>`), and push to `origin`
3. Publish `@cyango-tools/skills` to npmjs
4. Run `npx skills add joaomelorodrigues/cyango-skills --skill cyango-mcp` (skills.sh telemetry)

If you already pushed to GitHub and only need npm + skills.sh:

```bash
npm run publish:patch   # or publish:minor / publish:major
```

Republish the current version without a bump:

```bash
npm run publish:npm && npm run publish:skills-sh
```

### npm registry notes

This package uses scope **`@cyango-tools/skills`** (same org as **`@cyango-tools/mcp-server`** on npmjs). The repo `.npmrc` sends **`@cyango-tools/*`** to **npmjs** and keeps **`@cyango/*`** on Gitea for internal packages, matching the MCP server setup. If a global `~/.npmrc` overrides **`@cyango-tools:registry`**, use the scripts below so the tarball still lands on npmjs.

If you publish manually, pass both `--registry` and the scope override:

```bash
npm publish --access public --registry https://registry.npmjs.org/ '--@cyango-tools:registry=https://registry.npmjs.org/'
```

Log in when needed: `npm login --registry https://registry.npmjs.org/`.

### skills.sh shows 404 after npm publish

That is expected if you only ran `npm publish` or `npm run publish:patch` **without pushing to GitHub** and **without seeding skills.sh**.

- **npm** ships `@cyango-tools/skills` from the tarball.
- **skills.sh** lists skills from **GitHub** plus install telemetry from `npx skills add`.

Fix it:

```bash
git push origin main
npm run publish:skills-sh
```

Or run the full release next time:

```bash
npm run release:patch
```

The skills.sh page can take a minute to appear after telemetry. Search indexing may lag longer than the skill page itself.

