import { mongooseAdapter } from '@payloadcms/db-mongodb'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { ReusableContent } from './collections/ReusableContent'
import { Users } from './collections/Users'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeDashboard: ['@/components/BeforeDashboard'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || '',
  }),
  collections: [Pages, Posts, Media, Categories, ReusableContent, Users],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer],
  plugins,
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        const secret = process.env.CRON_SECRET
        if (!secret) return false

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${secret}`
      },
    },
    tasks: [
      {
        // Queued by the `notifySlack` afterChange hook on Posts.
        // A single save can queue multiple jobs — one per condition that fired.
        // Each job runs independently, so a failed Slack call for one event
        // doesn't prevent the others from getting through.
        slug: 'notifySlack',
        inputSchema: [
          { name: 'event', type: 'text', required: true },
          { name: 'postTitle', type: 'text', required: true },
          { name: 'postSlug', type: 'text', required: true },
          { name: 'changedFrom', type: 'text' },
          { name: 'changedTo', type: 'text' },
        ],
        outputSchema: [{ name: 'notified', type: 'checkbox' }],
        handler: async ({
          input,
          req,
        }: {
          input: {
            event: string
            postTitle: string
            postSlug: string
            changedFrom?: string
            changedTo?: string
          }
          req: PayloadRequest
        }) => {
          const webhookUrl = process.env.SLACK_WEBHOOK_URL

          if (!webhookUrl) {
            req.payload.logger.warn({ msg: 'SLACK_WEBHOOK_URL not set, skipping notification' })
            return { output: { notified: false } }
          }

          const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
          const postUrl = `${siteUrl}/posts/${input.postSlug}`

          const messages: Record<string, string> = {
            post_published: `:rocket: *${input.postTitle}* was just published.\n${postUrl}`,
            seo_title_changed: `:warning: SEO title changed on *${input.postTitle}*\n*From:* ${input.changedFrom}\n*To:* ${input.changedTo}\n${postUrl}`,
            seo_description_changed: `:warning: Meta description changed on *${input.postTitle}*\n*From:* ${input.changedFrom}\n*To:* ${input.changedTo}\n${postUrl}`,
          }

          const text = messages[input.event] ?? `:bell: ${input.event} on *${input.postTitle}*`

          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
          })

          return { output: { notified: true } }
        },
      },
    ],
  },
})
