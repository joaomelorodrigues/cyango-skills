# Privacy

This plugin connects your AI app to the Cyango MCP server at `https://mcp.cyango.com`, which Cyango operates. The server passes requests between your AI app and the Cyango xr/studio tab where you turned MCP on.

## Data the plugin handles

- Content of the story that is open in Cyango xr/studio: scenes, entities, settings, and asset names and links. The assistant reads and changes it through the plugin tools.
- URLs given to `upload_assets`. The server downloads those files and sends them to the editor.
- Search words given to `search_provider_assets`.
- Sign-in records: your Cyango user ID, the AI apps you allowed, and refresh tokens (stored only as hashes).

The plugin does not collect contact details, location, or payment data. You sign in with your Cyango account. The AI app never sees your password.

## Why

The plugin uses this data only to sign you in and to do the story edits that you ask for.

## Who receives the data

- The AI app that you use (for example ChatGPT, Claude, Cursor or Grok) receives the tool results, which include story content. Its own privacy policy applies.
- Cyango xr/studio stores story changes and uploaded assets in your Cyango account, under the Cyango terms.
- Free asset providers (for example Pexels or Poly Haven) receive search words through Cyango xr/studio.

The plugin has no analytics or tracking.

## Retention

The MCP server does not store story content. It holds each request in memory only while it runs. Refresh tokens expire after 30 days without use. Your approvals stay until you ask us to remove them. Story content and uploaded assets stay in your Cyango account until you delete them there.

## Your controls

- Turn MCP off in Story Settings to stop all access to the story.
- Disconnect or remove the plugin in your AI app.
- Delete assets and stories in Cyango xr/studio.
- Contact us at https://cyango.com/contacts to remove your approvals.

The full Cyango privacy policy is at https://cyango.com/privacy-policy.

Cyango account and website terms are at https://cyango.com/terms-of-service.
