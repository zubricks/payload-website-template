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
