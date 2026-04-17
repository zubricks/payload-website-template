import type { CollectionAfterReadHook } from 'payload'

// Recursively walks the Lexical node tree and collects all text content.

function extractText(node: Record<string, unknown>): string {
  if (typeof node.text === 'string') return node.text

  if (Array.isArray(node.children)) {
    return (node.children as Record<string, unknown>[]).map(extractText).join(' ')
  }

  return ''
}

// afterRead fires after Payload fetches a document. Mutations to `doc` here
// affect what the API returns but are never written to the database — making
// this the right place for computed, read-only fields like reading time.
//
// The `readingTime` field in the Posts schema has `access: { create: () => false, update: () => false }`
// which prevents anyone from writing to it. This hook is the only source of its value.
export const addReadingTime: CollectionAfterReadHook = ({ doc }) => {
  const content = doc?.content

  if (content && typeof content === 'object') {
    // Lexical serializes as { root: { children: [...] } } — walk from root
    const root = (content as Record<string, unknown>).root as Record<string, unknown> | undefined
    const text = root ? extractText(root) : ''
    const wordCount = text.split(/\s+/).filter(Boolean).length
    // Average reading speed: 200 words per minute
    doc.readingTime = Math.max(1, Math.ceil(wordCount / 200))
  }

  return doc
}
