import type { Block } from 'payload'

export const MediaBlock: Block = {
  slug: 'mediaBlock',
  interfaceName: 'MediaBlock',
  fields: [
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      validate: (value, { req }) => {
        const slug = req?.collection?.config?.slug ?? (req?.collection as any)?.slug
        // Server-side: use collection context
        if (slug) {
          if (slug === 'page-templates') return true
          if (!value) return 'This field is required.'
          return true
        }
        // Client-side: use URL to detect page-templates
        if (typeof window !== 'undefined' && window.location.pathname.includes('/page-templates/')) {
          return true
        }
        if (!value) return 'This field is required.'
        return true
      },
    },
  ],
}
