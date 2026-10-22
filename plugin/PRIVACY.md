# Privacy

This plugin runs on your computer.

It starts the Cyango connector locally. The connector talks to Cyango xr/studio on that computer, on port 3099.

## Data the plugin handles

- Content of the story that is open in Cyango xr/studio: scenes, entities, settings, and asset names and links. The assistant reads and changes it through the plugin tools.
- Files and URLs given to `upload_assets`. The connector reads those files or downloads those URLs, then sends them to the editor.
- Search words given to `search_provider_assets`.

The plugin does not ask for a Cyango account, password, or API key. It does not collect contact details, location, or payment data.

## Why

The plugin uses this data only to do the story edits that you ask for.

## Who receives the data

- The AI assistant that you use (for example ChatGPT, Claude, or Cursor) receives the tool results, which include story content. Its own privacy policy applies.
- Cyango xr/studio stores story changes and uploaded assets in your Cyango account, under the Cyango terms.
- Free asset providers (for example Pexels or Poly Haven) receive search words through Cyango xr/studio.

The connector does not send data to any other server. The plugin has no analytics or tracking.

## Retention

The connector keeps no data. It holds requests in memory only while it runs, and it writes nothing to disk. Story content and uploaded assets stay in your Cyango account until you delete them there.

## Your controls

- Turn MCP off in Story Settings to stop all access to the story.
- Turn off or remove the plugin in your AI assistant.
- Delete assets and stories in Cyango xr/studio.
- Contact us at https://cyango.com/contacts.

## How the connector is installed

- Claude, Cursor, and Grok: the first run downloads `@cyango-tools/mcp-server` from the public npm registry. That download is the connector program, not the story.
- ChatGPT: the connector is inside the plugin package. Nothing is downloaded.

The full Cyango privacy policy is at https://cyango.com/privacy-policy.

Cyango account and website terms are at https://cyango.com/terms-of-service.
