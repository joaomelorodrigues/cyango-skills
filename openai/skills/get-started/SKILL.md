---
name: get-started
description: 'Connect ChatGPT to Cyango xr/studio before the first edit. Use when the Cyango tools report no editor connection, or when the user asks how to start with Cyango.'
---

# Get started with Cyango

The Cyango tools edit the story that is open in Cyango xr/studio on this computer. They do nothing while the editor is closed.

1. Open a story in Cyango xr/studio (web or desktop app) on this computer.
2. Open **Story Settings** and turn **MCP** on. The editor connects to the local connector on port 3099.
3. Call `bridge_status`. Continue when `editorConnected` is `true`.

If `editorConnected` stays `false`:

- Ask the user to turn MCP off and on again in Story Settings.
- Ask the user to check that no other program uses port 3099. Other AI tools that run the Cyango connector can share it.

Saving is manual. Tell the user to save from the editor when the edits are done.

For every edit after this, follow the `cyango-mcp` skill.
