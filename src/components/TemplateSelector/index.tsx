'use client'

import { useField, useForm } from '@payloadcms/ui'
import React, { useCallback, useEffect, useState } from 'react'

type Template = { id: string; title: string; layout: Record<string, unknown>[] }
type BlockRow = { blockType: string; [key: string]: unknown }

function stripIds(items: Record<string, unknown>[]): Record<string, unknown>[] {
  return items.map(({ id: _id, ...block }) => {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(block)) {
      result[key] = Array.isArray(value) ? stripIds(value as Record<string, unknown>[]) : value
    }
    return result
  })
}

function randomId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(12)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export const TemplateSelector: React.FC = () => {
  const { value: layoutCount } = useField<number>({ path: 'layout' })
  const { getFields, replaceState } = useForm()
  const [templates, setTemplates] = useState<Template[]>([])
  const [selected, setSelected] = useState('')

  useEffect(() => {
    fetch('/api/page-templates?limit=100&depth=0')
      .then((r) => r.json())
      .then((data) => setTemplates(data.docs ?? []))
      .catch(() => {})
  }, [])

  const handleApply = useCallback(async () => {
    if (!selected) return
    try {
      const res = await fetch(`/api/page-templates/${selected}?depth=0`)
      const template: Template = await res.json()
      if (!Array.isArray(template?.layout)) return

      const stripped = stripIds(template.layout) as BlockRow[]
      const currentFields = getFields()

      // Remove any existing layout entries from form state
      const base = Object.fromEntries(
        Object.entries(currentFields).filter(
          ([key]) => key !== 'layout' && !key.startsWith('layout.'),
        ),
      )

      const rows: Array<{ id: string; blockType: string; collapsed: boolean; isLoading: boolean }> =
        []
      const blockFields: Record<
        string,
        { value: unknown; initialValue: unknown; valid: boolean; passesCondition: boolean }
      > = {}

      stripped.forEach((block, i) => {
        const { blockType, ...data } = block
        const id = randomId()

        rows.push({ id, blockType, collapsed: false, isLoading: false })

        blockFields[`layout.${i}.id`] = {
          value: id,
          initialValue: id,
          valid: true,
          passesCondition: true,
        }
        blockFields[`layout.${i}.blockType`] = {
          value: blockType,
          initialValue: blockType,
          valid: true,
          passesCondition: true,
        }

        for (const [key, val] of Object.entries(data)) {
          blockFields[`layout.${i}.${key}`] = {
            value: val,
            initialValue: val,
            valid: true,
            passesCondition: true,
          }
        }
      })

      replaceState({
        ...base,
        layout: {
          disableFormData: true,
          rows,
          value: stripped.length,
          initialValue: stripped.length,
          valid: true,
          passesCondition: true,
        },
        ...blockFields,
      })

      setSelected('')
    } catch (e) {
      console.error('Failed to apply template', e)
    }
  }, [selected, getFields, replaceState])

  const hasBlocks = typeof layoutCount === 'number' && layoutCount > 0
  if (hasBlocks || !templates.length) return null

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
        Apply Template
      </p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="">— Select a template —</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleApply}
          disabled={!selected}
          style={{ padding: '0.5rem 1rem', borderRadius: '4px', opacity: selected ? 1 : 0.5 }}
        >
          Apply
        </button>
      </div>
    </div>
  )
}
