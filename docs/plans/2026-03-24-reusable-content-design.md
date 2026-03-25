# ReusableContent Feature Design

**Date:** 2026-03-24
**Status:** Approved

## Overview

Port the `ReusableContent` block/feature from `www/website` into `www/website-template`, adapted to the template's simpler conventions. Simultaneously refactor the template to use Payload's `blockReferences` pattern everywhere instead of inline block imports.

## Architecture

Two-layer architecture:

1. **`reusable-content` collection** — editors create reusable content composed of blocks
2. **`reusableContentBlock` block** — placed in page/post layouts to reference that content

The component recursively calls `RenderBlocks` with the linked content's `layout` array.

## Part 1 — Global block registration

`blockReferences` with string slugs requires blocks to be registered globally in `payload.config.ts` via a top-level `blocks` array. Currently the template registers blocks inline in each collection field.

**Changes:**

- Add `blocks: [ArchiveBlock, Banner, CallToAction, Code, Content, FormBlock, MediaBlock]` to `payload.config.ts`
- **Pages collection** (`src/collections/Pages/index.ts`): replace `blocks: [CallToAction, Content, MediaBlock, Archive, FormBlock]` with `blockReferences: ['cta', 'banner', 'code', 'content', 'mediaBlock', 'archive', 'formBlock'], blocks: []`
- **Posts collection** (`src/collections/Posts/index.ts`): replace `blocks: [Banner, Code, MediaBlock]` with `blockReferences: ['banner', 'code', 'mediaBlock'], blocks: []`
- `RelatedPosts` is component-only (no config), no change needed

## Part 2 — `ReusableContent` collection

**File:** `src/collections/ReusableContent.ts`

- Slug: `reusable-content`
- `useAsTitle: 'title'`
- Access: create/update/delete → admins only; read → open
- Fields:
  - `title` — text, required
  - `layout` — blocks, required; `blockReferences: ['archive', 'banner', 'cta', 'code', 'content', 'formBlock', 'mediaBlock'], blocks: []`
- Registered in `payload.config.ts` collections array

## Part 3 — `reusableContentBlock` block

**Config** (`src/blocks/ReusableContent/config.ts`):

- Slug: `reusableContentBlock`
- `interfaceName: 'ReusableContentBlock'`
- Single field: `reusableContent` — relationship to `reusable-content`, required
- No `customId`, no theme/background wrapper

**Component** (`src/blocks/ReusableContent/Component.tsx`):

- Props typed from generated `ReusableContentBlock` interface
- Checks if `reusableContent` is a populated object (not just an ID string)
- Passes its `.layout` array to `RenderBlocks`
- Returns `null` if relationship is not populated

**Registration:**

- Added to global `blocks` array in `payload.config.ts`
- Added to `blockReferences` in Pages `layout` field
- Added to `blockComponents` map in `src/blocks/RenderBlocks.tsx`

## Files Changed

| File                                       | Change                                                          |
| ------------------------------------------ | --------------------------------------------------------------- |
| `src/payload.config.ts`                    | Add global `blocks` array; add `ReusableContent` to collections |
| `src/collections/Pages/index.ts`           | Switch to `blockReferences`; add `reusableContentBlock`         |
| `src/collections/Posts/index.ts`           | Switch to `blockReferences`                                     |
| `src/collections/ReusableContent.ts`       | **New file**                                                    |
| `src/blocks/ReusableContent/config.ts`     | **New file**                                                    |
| `src/blocks/ReusableContent/Component.tsx` | **New file**                                                    |
| `src/blocks/RenderBlocks.tsx`              | Add `reusableContentBlock` mapping                              |

## Decisions

- **No `customId` field** — kept minimal
- **No `blockFields` wrapper** — template has no theme/background system
- **All 8 existing blocks** supported in the reusable-content collection layout
- **`blockReferences` everywhere** — consistent pattern, prerequisite for the feature
