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


## Claude, Grok, and Cursor

The `plugin/` folder is the installable Cyango plugin. It contains this skill and starts `@cyango-tools/mcp-server` on the same computer as Cyango xr/studio. Claude's directory, the Grok Build catalog, and the Cursor Marketplace all install that folder. Cursor reads `.cursor-plugin/plugin.json` and `mcp.json`. The connector source stays in the private Cyango repository.

## ChatGPT

OpenAI lists Cyango as a desktop-only plugin. The ZIP holds the skills, the `get-started` onboarding skill, and the pinned `@cyango-tools/mcp-server` with its dependencies, because a desktop-only plugin must ship its stdio server. The manifest and the review test cases are in `openai/plugin.json`.

```bash
npm run build:openai   # writes build/openai/cyango-openai-<version>.zip
```

Upload the ZIP at platform.openai.com/plugins: **Create plugin**, **Skills only**, **Upload ZIP**. The organization must be allowlisted for local MCP first. Build after `publish:*`, so that the ZIP has the newest connector pin.

## Available skills

| Skill | Description |
|-------|-------------|
| `cyango-mcp` | Teaches AI agents how to work with the Cyango MCP live editor — plural/batched write tools, entity types, GUI layout, scene hierarchy, schema-safe values, bridge status, patch validation, and prefab instantiation. |

## Adding skills to a project manually

If you prefer not to use the CLI, copy the contents of `plugin/skills/<skill-name>/` into `.agents/skills/<skill-name>/` in your project.

## Updating a skill

The CLI copies only from the **installed npm package** (`plugin/skills/<name>/` in the tarball). It does **not** pull from GitHub. Re-run install to overwrite `.agents/skills/`:

```bash
npx @cyango-tools/skills@latest install cyango-mcp
```

Use `@latest` (or a pinned version) so `npx` does not keep an old cached tarball of the CLI.

## Generated type reference

`plugin/skills/cyango-mcp/references/cyango-shared-types.md` is generated, not hand-written. It gives the agent the exact shape of every story field, so the markdown pages can cover behaviour instead of trying to enumerate fields.

```bash
npm run types:skill
```

`prepack` runs it automatically, so a release always ships types matching the current `cyango-shared`.

**The allowlist in `scripts/extract-skill-types.mjs` is a disclosure boundary.** This package is public on npm and GitHub. The script emits only the story-editing modules, drops runtime helpers, scrubs internal notes out of doc comments, and **fails the build** if a billing, auth, storage or permission term reaches a declaration. If it refuses to write, do not loosen `SENSITIVE_PATTERNS` to get past it. Add the offending declaration to `DENY_TYPES`, or its module to `DENY_MODULES`.

Source resolution order, first hit wins: `--types-dir=<path>`, `CYANGO_SHARED_TYPES`, a sibling `../cyango-shared/src/types`, then `dist/types` from node_modules. Source is preferred because TypeScript declaration emit drops the trailing `//` comments, and those carry most of the meaning. When no source is found the committed file is kept, so publishing never silently ships an empty reference.

## Publishing a release

Publish a new `@cyango-tools/mcp-server` from the private connector repo first when the connector itself changed. Then, from this repo:

```bash
npm run publish:patch   # or publish:minor / publish:major
```

What `publish:*` does:

1. Bump `@cyango-tools/skills`, regenerate `cyango-shared-types.md`, and write the version into `plugin/skills/cyango-mcp/SKILL.md`, `plugin/.claude-plugin/plugin.json`, `plugin/.cursor-plugin/plugin.json`, and `openai/plugin.json`
2. Pin `plugin/.mcp.json`, `plugin/mcp.json`, and `plugin/package.json` to the newest `@cyango-tools/mcp-server` on npm, and refresh `plugin/package-lock.json`
3. Commit those files, tag (`v<version>`), and push to `origin`. Other changes in the working tree stay uncommitted.
4. Publish `@cyango-tools/skills` to npmjs
5. Seed skills.sh with `npx skills add joaomelorodrigues/cyango-skills/plugin --skill cyango-mcp`
6. Move the Cyango pin on `joaomelorodrigues/plugin-marketplace` branch `cyango-plugin` to this commit

Claude scans `main` after the push. Publish the passing version in the directory when auto-publish is off. Grok Build picks up the guide and the connector pin after the catalog pull request is merged. The Cursor Marketplace reviews each update before the listing moves.

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
npm run publish:patch
```

The skills.sh page can take a minute to appear after telemetry. Search indexing may lag longer than the skill page itself.

