# ReusableContent Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Port the ReusableContent block/feature from `www/website` into `www/website-template`, refactoring all `type: 'blocks'` fields to use `blockReferences` in the process.

**Architecture:** A `reusable-content` collection lets editors compose blocks once and reuse them across pages. A `reusableContentBlock` block embeds a reference to one of these documents; at render time the component recursively passes its `layout` array to `RenderBlocks`. This requires blocks to be registered globally in `payload.config.ts` so Payload can resolve string slugs in `blockReferences`.

**Tech Stack:** Payload CMS 3.x, Next.js 15, TypeScript, MongoDB

> **Note on Posts richtext:** `BlocksFeature` (used in the Posts `content` richtext field) accepts `blocks: Block[]` only — it does not support `blockReferences`. Posts richtext imports stay as direct block object imports throughout this plan.

---

### Block slug reference

| Import name    | Slug           |
| -------------- | -------------- |
| `Archive`      | `'archive'`    |
| `Banner`       | `'banner'`     |
| `CallToAction` | `'cta'`        |
| `Code`         | `'code'`       |
| `Content`      | `'content'`    |
| `FormBlock`    | `'formBlock'`  |
| `MediaBlock`   | `'mediaBlock'` |

---

### Task 1: Register blocks globally in payload.config.ts

**Files:**

- Modify: `src/payload.config.ts`

Payload resolves string slugs in `blockReferences` against a top-level `blocks` array in `buildConfig`. Without this, string references in `blockReferences` fields will not resolve.

**Step 1: Add imports for all block configs**

In `src/payload.config.ts`, add these imports after the existing collection imports:

```ts
import { Archive } from './blocks/ArchiveBlock/config'
import { Banner } from './blocks/Banner/config'
import { CallToAction } from './blocks/CallToAction/config'
import { Code } from './blocks/Code/config'
import { Content } from './blocks/Content/config'
import { FormBlock } from './blocks/Form/config'
import { MediaBlock } from './blocks/MediaBlock/config'
```

**Step 2: Add global `blocks` array to buildConfig**

Inside `buildConfig({...})`, add `blocks` as a top-level key (alongside `collections`, `globals`, etc.):

```ts
blocks: [Archive, Banner, CallToAction, Code, Content, FormBlock, MediaBlock],
```

**Step 3: Start the dev server to verify no errors**

```bash
cd /Users/szubrickas/www/website-template
pnpm run dev
```

Expected: server starts, admin panel loads at `http://localhost:3000/admin`. No TypeScript errors.

**Step 4: Commit**

```bash
git add src/payload.config.ts
git commit -m "chore: register blocks globally in payload config"
```

---

### Task 2: Refactor Pages layout field to use blockReferences

**Files:**

- Modify: `src/collections/Pages/index.ts`

**Step 1: Remove now-redundant block imports**

In `src/collections/Pages/index.ts`, remove these import lines (the blocks are now globally registered):

```ts
import { Archive } from '../../blocks/ArchiveBlock/config'
import { CallToAction } from '../../blocks/CallToAction/config'
import { Content } from '../../blocks/Content/config'
import { FormBlock } from '../../blocks/Form/config'
import { MediaBlock } from '../../blocks/MediaBlock/config'
```

**Step 2: Switch the layout field from `blocks` to `blockReferences`**

Find the `layout` field (around line 73) and change:

```ts
// Before
{
  name: 'layout',
  type: 'blocks',
  blocks: [CallToAction, Content, MediaBlock, Archive, FormBlock],
  required: true,
  admin: {
    initCollapsed: true,
  },
},
```

To:

```ts
// After
{
  name: 'layout',
  type: 'blocks',
  blockReferences: ['cta', 'content', 'mediaBlock', 'archive', 'formBlock'],
  blocks: [],
  required: true,
  admin: {
    initCollapsed: true,
  },
},
```

**Step 3: Verify the dev server still works**

Navigate to `http://localhost:3000/admin/collections/pages` and open or create a page. Confirm the Content tab still shows CallToAction, Content, MediaBlock, Archive, and FormBlock as available block types in the layout field.

**Step 4: Commit**

```bash
git add src/collections/Pages/index.ts
git commit -m "refactor(pages): use blockReferences for layout field"
```

---

### Task 3: Create the ReusableContent collection

**Files:**

- Create: `src/collections/ReusableContent.ts`
- Modify: `src/payload.config.ts`

**Step 1: Create the collection file**

Create `src/collections/ReusableContent.ts`:

```ts
import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

export const ReusableContent: CollectionConfig = {
  slug: 'reusable-content',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'layout',
      type: 'blocks',
      blockReferences: ['archive', 'banner', 'cta', 'code', 'content', 'formBlock', 'mediaBlock'],
      blocks: [],
      required: true,
    },
  ],
  labels: {
    plural: 'Reusable Contents',
    singular: 'Reusable Content',
  },
}
```

**Step 2: Register the collection in payload.config.ts**

In `src/payload.config.ts`, add the import:

```ts
import { ReusableContent } from './collections/ReusableContent'
```

Then add `ReusableContent` to the `collections` array:

```ts
collections: [Pages, Posts, Media, Categories, Users, ReusableContent],
```

**Step 3: Verify in the admin panel**

Navigate to `http://localhost:3000/admin`. Confirm "Reusable Contents" appears in the left nav. Click in and create a test entry — all 7 block types (Archive, Banner, CTA, Code, Content, FormBlock, MediaBlock) should be available in its layout.

**Step 4: Commit**

```bash
git add src/collections/ReusableContent.ts src/payload.config.ts
git commit -m "feat: add reusable-content collection"
```

---

### Task 4: Create the ReusableContent block config

**Files:**

- Create: `src/blocks/ReusableContent/config.ts`
- Modify: `src/payload.config.ts`

**Step 1: Create the block config**

Create `src/blocks/ReusableContent/config.ts`:

```ts
import type { Block } from 'payload'

export const ReusableContentBlock: Block = {
  slug: 'reusableContentBlock',
  interfaceName: 'ReusableContentBlock',
  fields: [
    {
      name: 'reusableContent',
      type: 'relationship',
      relationTo: 'reusable-content',
      required: true,
    },
  ],
}
```

**Step 2: Register in the global blocks array in payload.config.ts**

Add import:

```ts
import { ReusableContentBlock } from './blocks/ReusableContent/config'
```

Add to the `blocks` array:

```ts
blocks: [Archive, Banner, CallToAction, Code, Content, FormBlock, MediaBlock, ReusableContentBlock],
```

**Step 3: Add reusableContentBlock to Pages layout blockReferences**

In `src/collections/Pages/index.ts`, update `blockReferences` to include `'reusableContentBlock'`:

```ts
blockReferences: ['cta', 'content', 'mediaBlock', 'archive', 'formBlock', 'reusableContentBlock'],
```

**Step 4: Verify in admin**

Open or create a page in the admin. In the Content tab, the layout field should now offer "Reusable Content Block" as an option alongside the existing blocks.

**Step 5: Commit**

```bash
git add src/blocks/ReusableContent/config.ts src/payload.config.ts src/collections/Pages/index.ts
git commit -m "feat: add reusableContentBlock block config"
```

---

### Task 5: Create the ReusableContent block component and wire up rendering

**Files:**

- Create: `src/blocks/ReusableContent/Component.tsx`
- Modify: `src/blocks/RenderBlocks.tsx`

**Step 1: Create the component**

Create `src/blocks/ReusableContent/Component.tsx`:

```tsx
import type { ReusableContentBlock } from '@/payload-types'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import React from 'react'

export const ReusableContentBlockComponent: React.FC<ReusableContentBlock> = ({
  reusableContent,
}) => {
  if (typeof reusableContent === 'object' && reusableContent !== null) {
    return <RenderBlocks blocks={reusableContent.layout} />
  }

  return null
}
```

> **Note:** `ReusableContentBlock` is the generated TypeScript interface from `payload-types.ts`. The `reusableContent` field is typed as `string | ReusableContent` — the `typeof reusableContent === 'object'` guard handles the populated vs. ID-only cases.

**Step 2: Register the component in RenderBlocks.tsx**

In `src/blocks/RenderBlocks.tsx`:

Add import at the top:

```ts
import { ReusableContentBlockComponent } from '@/blocks/ReusableContent/Component'
```

Add to the `blockComponents` map:

```ts
const blockComponents = {
  archive: ArchiveBlock,
  content: ContentBlock,
  cta: CallToActionBlock,
  formBlock: FormBlock,
  mediaBlock: MediaBlock,
  reusableContentBlock: ReusableContentBlockComponent,
}
```

**Step 3: Update the `blocks` prop type to accept reusable content layout blocks**

The `RenderBlocks` component currently types its `blocks` prop as `Page['layout'][0][]`. After regenerating types (next task), this will include `ReusableContentBlock`. No manual change needed here — the `@ts-expect-error` comment on line 38 already handles type mismatches at render time.

**Step 4: Commit**

```bash
git add src/blocks/ReusableContent/Component.tsx src/blocks/RenderBlocks.tsx
git commit -m "feat: add ReusableContent block component and wire into RenderBlocks"
```

---

### Task 6: Regenerate types and do an end-to-end smoke test

**Files:**

- Modified by codegen: `src/payload-types.ts`

**Step 1: Regenerate Payload types**

With the dev server running:

```bash
cd /Users/szubrickas/www/website-template
pnpm run generate:types
```

Expected: `src/payload-types.ts` is updated. It should now contain a `ReusableContentBlock` interface and a `ReusableContent` interface. Check for both:

```bash
grep -n "ReusableContentBlock\|ReusableContent " src/payload-types.ts | head -20
```

**Step 2: End-to-end smoke test**

1. Go to `http://localhost:3000/admin/collections/reusable-content` → Create a new entry titled "Test Reusable Content", add a Banner block to its layout, save.
2. Go to `http://localhost:3000/admin/collections/pages` → Open any page, go to the Content tab, add a "Reusable Content Block", select the entry created in step 1, save and publish.
3. Visit the page on the frontend (e.g. `http://localhost:3000/`) and confirm the Banner block from the reusable content renders correctly.

**Step 3: Commit**

```bash
git add src/payload-types.ts
git commit -m "chore: regenerate payload types for ReusableContent feature"
```
