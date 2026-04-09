import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { Archive } from '../blocks/ArchiveBlock/config'
import { Banner } from '../blocks/Banner/config'
import { CallToAction } from '../blocks/CallToAction/config'
import { Code } from '../blocks/Code/config'
import { Content } from '../blocks/Content/config'
import { FormBlock } from '../blocks/Form/config'
import { MediaBlock } from '../blocks/MediaBlock/config'

export const ReusableContent: CollectionConfig = {
  slug: 'reusable-content',
  access: {
    create: authenticated,
    delete: authenticated,
    read: () => true,
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
      blocks: [CallToAction, Content, MediaBlock, Archive, FormBlock, Banner, Code],
      required: true,
    },
  ],
  labels: {
    plural: 'Reusable Contents',
    singular: 'Reusable Content',
  },
}
