import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

export const PageTemplates: CollectionConfig = {
  slug: 'page-templates',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'updatedAt'],
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
      blockReferences: ['cta', 'content', 'mediaBlock', 'archive', 'formBlock'],
      blocks: [],
      admin: {
        initCollapsed: true,
        description:
          'Add blocks to define the structure. Leave content fields blank — editors fill them in after applying this template to a page.',
      },
    },
  ],
  labels: {
    plural: 'Page Templates',
    singular: 'Page Template',
  },
}
