/**
 * Base64url / JSON helpers only.
 * Ticket signing and verification happen on the server (Supabase Edge Functions), never in the browser.
 */
const enc = new TextEncoder();

export const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

export const fromBase64Url = (text: string) =>
  Uint8Array.from(
    atob(
      text
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(Math.ceil(text.length / 4) * 4, '='),
    ),
    (c) => c.charCodeAt(0),
  );

export const encodeJson = (value: unknown) => toBase64Url(enc.encode(JSON.stringify(value)));
export const decodeJson = <T>(text: string) => JSON.parse(new TextDecoder().decode(fromBase64Url(text))) as T;
