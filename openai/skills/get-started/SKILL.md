---
name: get-started
description: 'Connect the AI app to Cyango xr/studio before the first edit. Use when the Cyango tools report no editor connection, or when the user asks how to start with Cyango.'
---

# Get started with Cyango

The Cyango tools edit the story that is open in Cyango xr/studio. They do nothing while no editor is connected.

1. Open a story in Cyango xr/studio (web or desktop app), signed in with the same Cyango account that you used to connect this app.
2. Open **Story Settings** and turn **MCP** on.
3. Call `bridge_status`. Continue when `editorConnected` is `true`.

If `editorConnected` stays `false`:

- Ask the user to check that xr/studio and this app use the same Cyango account.
- Ask the user to turn MCP off and on again in Story Settings.
- If Story Settings says MCP is connected in another tab, the edits go to that tab. Ask the user to use that tab, or to select **Use this tab**.

Saving is manual. Tell the user to save from the editor when the edits are done.

For every edit after this, follow the `cyango-mcp` skill.
