import type { CollectionAfterChangeHook } from 'payload'

import type { Post } from '../../../payload-types'

// afterChange runs after every save, so we compare doc against previousDoc to
// detect specific transitions rather than reacting to every change blindly.
//
// Each condition queues its own independent job. If three things change at once
// (publish + two SEO edits), three jobs are queued and each can succeed or retry
// on its own — one failure doesn't block the others. Doing this inline in the hook
// would mean a single slow or failed Slack call blocks the entire save response.
export const notifySlack: CollectionAfterChangeHook<Post> = async ({ doc, previousDoc, req }) => {
  const queue = req.payload.jobs.queue
  const jobs = []

  // A post transitioning to published for the first time
  if (doc._status === 'published' && previousDoc._status !== 'published') {
    jobs.push(
      queue({
        task: 'notifySlack',
        input: {
          event: 'post_published',
          postTitle: doc.title,
          postSlug: doc.slug ?? '',
        },
      }),
    )
  }

  // SEO title was changed on an already-published post
  if (doc._status === 'published' && doc.meta?.title !== previousDoc.meta?.title) {
    jobs.push(
      queue({
        task: 'notifySlack',
        input: {
          event: 'seo_title_changed',
          postTitle: doc.title,
          postSlug: doc.slug ?? '',
          changedFrom: previousDoc.meta?.title ?? '(empty)',
          changedTo: doc.meta?.title ?? '(empty)',
        },
      }),
    )
  }

  // Meta description was changed on an already-published post
  if (doc._status === 'published' && doc.meta?.description !== previousDoc.meta?.description) {
    jobs.push(
      queue({
        task: 'notifySlack',
        input: {
          event: 'seo_description_changed',
          postTitle: doc.title,
          postSlug: doc.slug ?? '',
          changedFrom: previousDoc.meta?.description ?? '(empty)',
          changedTo: doc.meta?.description ?? '(empty)',
        },
      }),
    )
  }

  await Promise.all(jobs)

  return doc
}
