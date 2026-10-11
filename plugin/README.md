# Cyango

Cyango edits a story that is open in Cyango Studio on this computer. This plugin includes the editing guide and starts the Cyango connector locally.

After you install it, open a story in Studio and turn MCP on in Story Settings. The connector listens on this computer, on port 3099. The assistant can then change scenes, layout, models, and interactions in that open story.

The connector is the public package `@cyango-tools/mcp-server`, pinned to version 2.0.27. The first run downloads that package from npm. Story changes stay between the assistant and the Studio session on this computer. This plugin does not send the story to a Cyango server of its own.

Studio has to be open and connected before an edit can land.
