/**
 * Shared TextStateFeature configuration.
 *
 * This file has no package imports so it is safe to use in both server and client contexts.
 * It must be kept in sync with the `state` passed to `TextStateFeature` in your field config.
 *
 * CSS values are the same as `defaultColors` from `@payloadcms/richtext-lexical`.
 */
export const textStateConfig = {
  color: {
    // Text colors
    'text-red': {
      label: 'Red',
      css: { color: 'light-dark(oklch(0.577 0.245 27.325), oklch(0.704 0.191 22.216))' },
    },
    'text-orange': {
      label: 'Orange',
      css: { color: 'light-dark(oklch(0.646 0.222 41.116), oklch(0.75 0.183 55.934))' },
    },
    'text-yellow': {
      label: 'Yellow',
      css: { color: 'light-dark(oklch(0.554 0.135 66.442), oklch(0.905 0.182 98.111))' },
    },
    'text-green': {
      label: 'Green',
      css: { color: 'light-dark(oklch(0.527 0.154 150.069), oklch(0.792 0.209 151.711))' },
    },
    'text-blue': {
      label: 'Blue',
      css: { color: 'light-dark(oklch(0.546 0.245 262.881), oklch(0.707 0.165 254.624))' },
    },
    'text-purple': {
      label: 'Purple',
      css: { color: 'light-dark(oklch(0.558 0.288 302.321), oklch(0.714 0.203 305.504))' },
    },
    'text-pink': {
      label: 'Pink',
      css: { color: 'light-dark(oklch(0.592 0.249 0.584), oklch(0.718 0.202 349.761))' },
    },
    // Background colors
    'bg-red': {
      label: 'Red bg',
      css: {
        'background-color': 'light-dark(oklch(0.704 0.191 22.216), oklch(0.577 0.245 27.325))',
      },
    },
    'bg-orange': {
      label: 'Orange bg',
      css: {
        'background-color': 'light-dark(oklch(0.75 0.183 55.934), oklch(0.646 0.222 41.116))',
      },
    },
    'bg-yellow': {
      label: 'Yellow bg',
      css: {
        'background-color': 'light-dark(oklch(0.905 0.182 98.111), oklch(0.554 0.135 66.442))',
      },
    },
    'bg-green': {
      label: 'Green bg',
      css: {
        'background-color': 'light-dark(oklch(0.792 0.209 151.711), oklch(0.527 0.154 150.069))',
      },
    },
    'bg-blue': {
      label: 'Blue bg',
      css: {
        'background-color': 'light-dark(oklch(0.707 0.165 254.624), oklch(0.546 0.245 262.881))',
      },
    },
    'bg-purple': {
      label: 'Purple bg',
      css: {
        'background-color': 'light-dark(oklch(0.714 0.203 305.504), oklch(0.558 0.288 302.321))',
      },
    },
    'bg-pink': {
      label: 'Pink bg',
      css: {
        'background-color': 'light-dark(oklch(0.718 0.202 349.761), oklch(0.592 0.249 0.584))',
      },
    },
  },
} as const
