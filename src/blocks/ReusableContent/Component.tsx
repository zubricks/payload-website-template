import type { Page, ReusableContentBlock as ReusableContentBlockType } from '@/payload-types'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import React from 'react'

export const ReusableContentBlock: React.FC<ReusableContentBlockType> = ({ reusableContent }) => {
  if (typeof reusableContent === 'object' && reusableContent !== null) {
    return <RenderBlocks blocks={reusableContent.layout as Page['layout']} />
  }

  return null
}
