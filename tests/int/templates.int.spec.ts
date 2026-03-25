import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

let payload: Payload

beforeAll(async () => {
  const payloadConfig = await config
  payload = await getPayload({ config: payloadConfig })
})

// ---------------------------------------------------------------------------
// Suite 1 — page-templates: validation bypass
// ---------------------------------------------------------------------------

describe('page-templates: validation bypass', () => {
  const createdIds: string[] = []

  afterEach(async () => {
    for (const id of createdIds) {
      await payload.delete({ collection: 'page-templates', id })
    }
    createdIds.length = 0
  })

  it('should create a template with mediaBlock and no media', async () => {
    const result = await payload.create({
      collection: 'page-templates',
      data: {
        title: 'Media skeleton',
        layout: [{ blockType: 'mediaBlock' }],
      },
    })

    createdIds.push(result.id)
    expect(result.id).toBeDefined()
    expect(result.layout).toHaveLength(1)
    expect(result.layout[0].blockType).toBe('mediaBlock')
  })

  it('should create a template with formBlock and no form', async () => {
    const result = await payload.create({
      collection: 'page-templates',
      data: {
        title: 'Form skeleton',
        layout: [{ blockType: 'formBlock' }],
      },
    })

    createdIds.push(result.id)
    expect(result.id).toBeDefined()
    expect(result.layout[0].blockType).toBe('formBlock')
  })

  it('should create a template with all 5 block types including empty media and form', async () => {
    const result = await payload.create({
      collection: 'page-templates',
      data: {
        title: 'Full skeleton',
        layout: [
          { blockType: 'mediaBlock' },
          { blockType: 'formBlock' },
          { blockType: 'content', columns: [] },
          { blockType: 'cta', links: [] },
          { blockType: 'archive' },
        ],
      },
    })

    createdIds.push(result.id)
    expect(result.layout).toHaveLength(5)
  })

  it('should update a template to add a mediaBlock without media', async () => {
    const template = await payload.create({
      collection: 'page-templates',
      data: {
        title: 'Bare template',
        layout: [{ blockType: 'content', columns: [] }],
      },
    })
    createdIds.push(template.id)

    const updated = await payload.update({
      collection: 'page-templates',
      id: template.id,
      data: {
        layout: [...template.layout, { blockType: 'mediaBlock' }],
      },
    })

    expect(updated.layout).toHaveLength(2)
    expect(updated.layout[1].blockType).toBe('mediaBlock')
  })
})

// ---------------------------------------------------------------------------
// Suite 2 — pages: validation enforcement
// ---------------------------------------------------------------------------

describe('pages: validation enforcement', () => {
  const createdIds: string[] = []

  afterEach(async () => {
    for (const id of createdIds) {
      await payload.delete({ collection: 'pages', id })
    }
    createdIds.length = 0
  })

  it('should reject a page with mediaBlock missing media', async () => {
    await expect(
      payload.create({
        collection: 'pages',
        data: {
          title: 'Bad media page',
          layout: [{ blockType: 'mediaBlock' }],
        },
      }),
    ).rejects.toThrow()
  })

  it('should reject a page with formBlock missing form', async () => {
    await expect(
      payload.create({
        collection: 'pages',
        data: {
          title: 'Bad form page',
          layout: [{ blockType: 'formBlock' }],
        },
      }),
    ).rejects.toThrow()
  })

  it('should accept a page with a content block (positive control)', async () => {
    const result = await payload.create({
      collection: 'pages',
      data: {
        title: 'Good page',
        layout: [{ blockType: 'content', columns: [] }],
      },
    })

    createdIds.push(result.id)
    expect(result.id).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Suite 3 — reusable-content: layout required
// ---------------------------------------------------------------------------

describe('reusable-content: layout required', () => {
  const createdIds: string[] = []

  afterEach(async () => {
    for (const id of createdIds) {
      await payload.delete({ collection: 'reusable-content', id })
    }
    createdIds.length = 0
  })

  it('should reject reusable-content with no layout field', async () => {
    await expect(
      payload.create({
        collection: 'reusable-content',
        data: { title: 'No layout' },
      }),
    ).rejects.toThrow()
  })

  it('should reject reusable-content with an empty layout array', async () => {
    await expect(
      payload.create({
        collection: 'reusable-content',
        data: { title: 'Empty layout', layout: [] },
      }),
    ).rejects.toThrow()
  })

  it('should create reusable-content with at least one block', async () => {
    const result = await payload.create({
      collection: 'reusable-content',
      data: {
        title: 'Valid RC',
        layout: [{ blockType: 'content', columns: [] }],
      },
    })

    createdIds.push(result.id)
    expect(result.id).toBeDefined()
    expect(result.layout).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Suite 4 — reusableContentBlock: depth population
// ---------------------------------------------------------------------------

describe('reusableContentBlock: depth population', () => {
  const pageIds: string[] = []
  const rcIds: string[] = []

  afterAll(async () => {
    for (const id of pageIds) await payload.delete({ collection: 'pages', id })
    for (const id of rcIds) await payload.delete({ collection: 'reusable-content', id })
  })

  it('should return reusableContent as a populated object at depth 1', async () => {
    const rc = await payload.create({
      collection: 'reusable-content',
      data: {
        title: 'Footer promo',
        layout: [{ blockType: 'content', columns: [] }],
      },
    })
    rcIds.push(rc.id)

    const page = await payload.create({
      collection: 'pages',
      data: {
        title: 'Page with RC',
        layout: [{ blockType: 'reusableContentBlock', reusableContent: rc.id }],
      },
    })
    pageIds.push(page.id)

    const fetched = await payload.findByID({
      collection: 'pages',
      id: page.id,
      depth: 1,
    })

    const rcBlock = fetched.layout.find((b: any) => b.blockType === 'reusableContentBlock')
    expect(rcBlock).toBeDefined()
    expect(typeof rcBlock.reusableContent).toBe('object')
    expect((rcBlock.reusableContent as any).id).toBe(rc.id)
    expect(Array.isArray((rcBlock.reusableContent as any).layout)).toBe(true)
    expect((rcBlock.reusableContent as any).layout).toHaveLength(1)
  })

  it('should return reusableContent as a string ID at depth 0', async () => {
    const rc = await payload.create({
      collection: 'reusable-content',
      data: {
        title: 'Sidebar widget',
        layout: [{ blockType: 'content', columns: [] }],
      },
    })
    rcIds.push(rc.id)

    const page = await payload.create({
      collection: 'pages',
      data: {
        title: 'Page with RC shallow',
        layout: [{ blockType: 'reusableContentBlock', reusableContent: rc.id }],
      },
    })
    pageIds.push(page.id)

    const fetched = await payload.findByID({
      collection: 'pages',
      id: page.id,
      depth: 0,
    })

    const rcBlock = fetched.layout.find((b: any) => b.blockType === 'reusableContentBlock')
    expect(rcBlock).toBeDefined()
    expect(typeof rcBlock.reusableContent).toBe('string')
    expect(rcBlock.reusableContent).toBe(rc.id)
  })
})

// ---------------------------------------------------------------------------
// Suite 5 — page-templates: access control
// ---------------------------------------------------------------------------

describe('page-templates: access control', () => {
  it('should deny unauthenticated reads of page-templates', async () => {
    await expect(
      payload.find({
        collection: 'page-templates',
        overrideAccess: false,
        user: null,
      }),
    ).rejects.toThrow()
  })

  it('should allow public reads of reusable-content', async () => {
    const result = await payload.find({
      collection: 'reusable-content',
      overrideAccess: false,
      user: null,
    })

    expect(result.docs).toBeDefined()
  })
})
