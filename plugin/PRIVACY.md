# Privacy

This plugin runs on your computer.

It starts the Cyango connector locally. The connector talks to Cyango xr/studio on that computer, on port 3099. Story changes stay between the assistant and the open Cyango xr/studio session. This plugin does not send the story to a Cyango server.

The first run downloads `@cyango-tools/mcp-server` from the public npm registry. That download is the connector program, not the story.

The plugin does not ask for a Cyango account, password, or API key.

Cyango account and website terms are at https://cyango.com/terms-of-service.
