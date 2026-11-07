# XR Stores: product catalog and products in a story

An xr/stores story sells products from one shop: a Cyango shop, or a Shopify shop (or another platform) that syncs into Cyango. The product lives on an entity. The `OPEN_PRODUCT` action only points at that entity.

## Where MCP runs

| Connected app | Catalog tools | Story tools |
|---------------|---------------|-------------|
| xr/studio (Story Settings > MCP Bridge) | yes | yes |
| xr/stores (link icon in the header) | yes | no |

`bridge_status` returns `editorApp`. One tab holds the bridge. When the user connects in xr/stores, story tools fail until the user connects again in xr/studio.

## Product catalog

Catalog tools: `create_products`, `update_products`, `delete_products`, `move_products`. They change the shop, not a story. The xr/stores Product Catalog page refreshes after each call.

- **Cyango shops only, for most changes.** `list_ecommerce_stores` returns `catalogEditable: true` for Cyango (NATIVE) shops. Shopify and other synced shops let MCP change only `allowEnterAR`, `hidden` and the variant `assetId`. The rest comes from the platform on each sync.
- **Variants.** Every product has at least one variant. The first variant is the default. Price, SKU, stock and media are on the variant. In `update_products`, a `variants` row with `variantId` changes that variant. A row without `variantId` adds a variant. `removeVariantIds` deletes variants.
- **Media.** Give `assetId` from `list_assets` or `upload_assets`. Images, videos, 3D models and splats only. The asset must be `completed`. `assetId: null` removes the media. On a Shopify product it goes back to the Shopify image.
- **Read before you write.** `list_store_products` with `productId` returns one product with its full description, `hidden` and `taxRates`. Only the fields you pass change. `tags` and `taxRates` replace the whole list.
- **Delete and move keep used products.** A product that a story uses stays in its shop. The result lists it in `blockedProducts` with the story names. Tell the user. Move works only between two Cyango shops.
- Currency is an ISO 4217 code (`EUR`). The default is `USD`. `taxRates` is in percent. An empty list uses the shop rates.

## The parts

| Part | Where it is | Set it with |
|------|-------------|-------------|
| Shop link | story `ecommerceStoreId` (Story Settings > Ecommerce) | `set_story_ecommerce_store` |
| Product on an entity | entity `xrStore`: `ecommerceStoreProductId`, `ecommerceStoreProductVariantId`, `ecommerceStoreId` | `assign_products`, `add_product_entities` |
| Click opens the product | `OPEN_PRODUCT` action, `eventType: ON_CLICK` | both tools add it |
| Product slot in a template | `GROUP_BOX` with `isPlaceholder: true` | `add_entities`, `update_entities` |

Shapes: `interface IEntityXRStore`, `interface IECommerceStoreProduct` and `interface IECommerceStoreProductVariant` in [cyango-shared-types.md](../cyango-shared-types.md).

## Workflow

1. **Find the shop.** Call `list_ecommerce_stores`. When `storyEcommerceStoreId` is null and the workspace has more than one shop, ask the user which shop to use. Then call `set_story_ecommerce_store`.
2. **Find the products.** Call `list_store_products` with `search` or `page`. Keep the product `id` and the variant `id`. When `variants[].asset.placeable` is false, `add_product_entities` cannot place that variant.
3. **Put the products in the scene.** Pick one path per product:
   - Show the product media (image, video, model, splat): `add_product_entities`. Pass `parentEntityId` to put it in a placeholder.
   - Use your own design (a GUI card, a primitive, a model from the library): build it with `add_entities` or `insert_assets`, then call `assign_products` on it.
4. **Check.** Call `get_entity` and read `xrStore` and `actions.currentValue`.
5. **Hand over.** The user saves in the editor. Checkout works only in the published story, and only when the shop has an active subscription (`subscriptionActive` in `list_ecommerce_stores`).

## `OPEN_PRODUCT` at runtime

- The player takes the first target: `targetEntitiesIds[0]`, then entities that match `targetTags`. With no targets, it uses the entity that owns the action.
- It reads `xrStore.ecommerceStoreProductId` from that target. The target must be in the active scene.
- It pauses the timeline and opens the shop panel on the product page. In VR or AR, it opens the `ECOMMERCE` system modal.
- It does nothing when the story has no `ecommerceStoreId`. The panel stays empty when the product is not in the story shop.

**A separate "Buy" button.** Give the button an `OPEN_PRODUCT` action with `targetEntitiesIds: ["<product entity id>"]`. The button itself needs no `xrStore`.

```json
{
  "updates": [
    {
      "entityIds": ["entity_buy_button"],
      "propertyPath": "actions.currentValue",
      "value": [
        {
          "id": "action_buy",
          "type": "OPEN_PRODUCT",
          "eventType": "ON_CLICK",
          "targetEntitiesIds": ["entity_product_chair"]
        }
      ]
    }
  ]
}
```

Never put product or variant IDs in `targetEntitiesIds`. Only entity IDs go there. The editor inspector keeps product IDs there while its form is open and clears them on save.

## Placeholders

xr/stores templates mark each product slot with a `GROUP_BOX` that has `isPlaceholder: true`. The product step of the xr/stores wizard lists only these entities.

- The wizard puts each product as a child of the slot. The first child is visible. It sets `visibility.hiddenTotally: true` on the other children.
- A slot often has a `CAMERA_LOOK_AT` action. The wizard uses it to frame the slot. Keep it when you edit a template.
- The wizard media step skips entities that have `xrStore`.
- `isXrStoreTemplate` on the story is a database flag. MCP cannot set it.

## What the tools do for you

- Both tools write `xrStore.ecommerceStoreId` from the story shop. Do not write `xrStore` with `update_entities`, because nothing then checks the product against the shop.
- `add_product_entities` attaches the variant asset to the story. Image and video products face the camera (`billboard`) unless you pass `billboard: false`. Omit `scale` for models, so the editor keeps its unit size.
- `assign_products` with `productId: null` clears `xrStore` and removes the `OPEN_PRODUCT` action that opens this entity.
- The story field `entityAssignedEcommerceStoreProductIds` is made again from the entities on each save. Do not write it. The backend uses it to stop a product from being deleted while a story uses it.

## Limits

- One shop per story.
- MCP cannot create or connect a shop, sync Shopify, or read or change orders. Send the user to the xr/stores dashboard for these.
- MCP cannot change Shopify product names, prices or stock. The user changes them in Shopify.
- `cyango.storyState.XRStore` in custom code is the WebXR session store. It is not the shop.
