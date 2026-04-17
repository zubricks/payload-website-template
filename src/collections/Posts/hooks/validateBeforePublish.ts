import type { CollectionBeforeChangeHook } from 'payload'
import { ValidationError } from 'payload'

// beforeChange runs before validation and save — throwing a ValidationError here
// surfaces field-level errors directly in the admin UI, just like built-in required fields.
//
// This hook enforces a "publish checklist": a post can be saved as a draft at any time,
// but transitioning to published requires both a hero image and a meta description.
export const validateBeforePublish: CollectionBeforeChangeHook = ({ data, req }) => {
  if (data._status !== 'published') return data

  const errors: { message: string; path: string }[] = []

  if (!data.heroImage) {
    errors.push({ path: 'heroImage', message: 'A hero image is required before publishing.' })
  }

  if (!data.meta?.description) {
    errors.push({
      path: 'meta.description',
      message: 'A meta description is required before publishing.',
    })
  }

  if (errors.length > 0) {
    throw new ValidationError({ errors, collection: 'posts', req })
  }

  return data
}
