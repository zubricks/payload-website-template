import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { getPayload } from 'payload'
import { login } from '../helpers/login'
import { cleanupTestUser, seedTestUser, testUser } from '../helpers/seedUser'
import config from '../../src/payload.config.js'

const BASE = 'http://localhost:3000'

test.describe('Page Templates', () => {
  let page: Page
  let contentTemplateId: string
  let mediaTemplateId: string
  let existingPageId: string

  test.beforeAll(async ({ browser }) => {
    await seedTestUser()

    const p = await getPayload({ config })

    const t1 = await p.create({
      collection: 'page-templates',
      data: {
        title: 'E2E Content Template',
        layout: [{ blockType: 'content', columns: [] }],
      },
    })
    contentTemplateId = t1.id

    const t2 = await p.create({
      collection: 'page-templates',
      data: {
        title: 'E2E Media Template',
        layout: [{ blockType: 'mediaBlock' }],
      },
    })
    mediaTemplateId = t2.id

    const existingPage = await p.create({
      collection: 'pages',
      data: {
        title: 'Pre-existing page',
        layout: [{ blockType: 'content', columns: [] }],
      },
    })
    existingPageId = existingPage.id

    const context = await browser.newContext()
    page = await context.newPage()
    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    const p = await getPayload({ config })
    await p.delete({ collection: 'page-templates', id: contentTemplateId })
    await p.delete({ collection: 'page-templates', id: mediaTemplateId })
    await p.delete({ collection: 'pages', id: existingPageId })
    // Clean up any draft pages created during validation UX test
    const drafts = await p.find({
      collection: 'pages',
      where: { title: { equals: 'Validation test page' } },
    })
    for (const doc of drafts.docs) {
      await p.delete({ collection: 'pages', id: doc.id })
    }
    await cleanupTestUser()
  })

  // -------------------------------------------------------------------------
  // TemplateSelector visibility
  // -------------------------------------------------------------------------

  test('should show TemplateSelector in sidebar when creating a new page', async () => {
    await page.goto(`${BASE}/admin/collections/pages/create`)
    await page.waitForLoadState('networkidle')

    // The component renders a <p>Apply Template</p> label and a <select>
    const label = page.locator('p', { hasText: 'Apply Template' })
    await expect(label).toBeVisible({ timeout: 5000 })

    const select = page.locator('select').filter({ hasText: '— Select a template —' })
    await expect(select).toBeVisible()

    // The seeded template must appear as an option
    await expect(select.locator('option', { hasText: 'E2E Content Template' })).toBeAttached()
  })

  test('should not show TemplateSelector on an existing page that has blocks', async () => {
    await page.goto(`${BASE}/admin/collections/pages/${existingPageId}`)
    await page.waitForLoadState('networkidle')

    const label = page.locator('p', { hasText: 'Apply Template' })
    await expect(label).not.toBeVisible({ timeout: 3000 })
  })

  test('should keep the Apply button disabled until a template is selected', async () => {
    await page.goto(`${BASE}/admin/collections/pages/create`)
    await page.waitForLoadState('networkidle')

    const applyBtn = page.locator('button', { hasText: 'Apply' })
    await expect(applyBtn).toBeDisabled()
  })

  // -------------------------------------------------------------------------
  // TemplateSelector apply behavior
  // -------------------------------------------------------------------------

  test('should intercept the /api/page-templates fetch when loading the create screen', async () => {
    const [response] = await Promise.all([
      page.waitForResponse(`${BASE}/api/page-templates?limit=100&depth=0`),
      page.goto(`${BASE}/admin/collections/pages/create`),
    ])

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(Array.isArray(body.docs)).toBe(true)
    expect(body.docs.some((d: any) => d.id === contentTemplateId)).toBe(true)
  })

  test('should populate layout blocks after applying the content template', async () => {
    await page.goto(`${BASE}/admin/collections/pages/create`)
    await page.waitForLoadState('networkidle')

    // Select the content template and apply
    const select = page.locator('select').filter({ hasText: '— Select a template —' })
    await select.selectOption({ label: 'E2E Content Template' })

    const applyBtn = page.locator('button', { hasText: 'Apply' })
    await expect(applyBtn).not.toBeDisabled()
    await applyBtn.click()

    // Selector hides once layoutCount > 0
    const label = page.locator('p', { hasText: 'Apply Template' })
    await expect(label).not.toBeVisible({ timeout: 3000 })

    // Switch to the Content tab and confirm at least one block row is visible
    await page.locator('[role="tab"]', { hasText: 'Content' }).click()
    // Payload blocks field renders block rows — the Content block label should be present
    await expect(page.locator('text=Content Block').first()).toBeVisible({ timeout: 5000 })
  })

  // -------------------------------------------------------------------------
  // Validation UX after template apply
  // -------------------------------------------------------------------------

  test('should show a validation error for media when saving a page with mediaBlock and no media', async () => {
    await page.goto(`${BASE}/admin/collections/pages/create`)
    await page.waitForLoadState('networkidle')

    // Fill the required title field
    await page.fill('input[name="title"]', 'Validation test page')

    // Apply the media template
    const select = page.locator('select').filter({ hasText: '— Select a template —' })
    await select.selectOption({ label: 'E2E Media Template' })
    await page.locator('button', { hasText: 'Apply' }).click()

    // Wait for block to appear in the Content tab
    await page.locator('[role="tab"]', { hasText: 'Content' }).click()
    await expect(page.locator('text=Media Block').first()).toBeVisible({ timeout: 5000 })

    // Attempt save via the Save Draft button
    await page.locator('#action-save-draft').click()

    // The media field validation error should appear
    const error = page.locator('text=This field is required.').first()
    await expect(error).toBeVisible({ timeout: 5000 })
  })

  // -------------------------------------------------------------------------
  // Collection list views
  // -------------------------------------------------------------------------

  test('should show the page-templates list view', async () => {
    await page.goto(`${BASE}/admin/collections/page-templates`)
    await expect(page).toHaveURL(`${BASE}/admin/collections/page-templates`)
    await expect(page.locator('h1', { hasText: 'Page Templates' }).first()).toBeVisible()
  })

  test('should show the reusable-content list view', async () => {
    await page.goto(`${BASE}/admin/collections/reusable-content`)
    await expect(page).toHaveURL(`${BASE}/admin/collections/reusable-content`)
    await expect(page.locator('h1', { hasText: 'Reusable Contents' }).first()).toBeVisible()
  })
})
