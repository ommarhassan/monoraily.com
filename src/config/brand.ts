/**
 * Single place for the project identity.
 * Rename the app by editing this file (plus the <title> in index.html).
 */
export const brand = {
  /** Wordmark pieces: rendered as  mono + go + "."  */
  wordmark: ['mono', 'go'] as const,
  name: 'MonoGo',
  tagline: 'رحلتك فوق الزحمة',
  /** Prefix for localStorage keys, so this app never clashes with another one on the same domain. */
  storagePrefix: 'monogo',
  /** Prefix printed on ticket IDs, e.g. MN-1A2B3C4D5E */
  ticketPrefix: 'MN',
} as const;
