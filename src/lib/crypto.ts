/**
 * Tiny signing helpers for the DEMO ticket gate.
 * A real system must sign and verify tickets on a server, never in the browser.
 */
import { brand } from '../config/brand';

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

// ---- Pure-JS SHA-256 / HMAC fallback ----
// crypto.subtle only exists on https or localhost, so opening the app through a LAN IP would otherwise fail.
const K: number[] = [];
const H0: number[] = [];
for (let n = 2, found = 0; found < 64; n++) {
  let prime = true;
  for (let d = 2; d * d <= n; d++) {
    if (n % d === 0) {
      prime = false;
      break;
    }
  }
  if (!prime) continue;
  if (found < 8) H0[found] = ((Math.pow(n, 1 / 2) % 1) * 2 ** 32) | 0;
  K[found++] = ((Math.pow(n, 1 / 3) % 1) * 2 ** 32) | 0;
}

function sha256(message: Uint8Array): Uint8Array {
  const size = Math.ceil((message.length + 9) / 64) * 64;
  const buf = new Uint8Array(size);
  buf.set(message);
  buf[message.length] = 0x80;
  const view = new DataView(buf.buffer);
  view.setUint32(size - 8, Math.floor((message.length * 8) / 2 ** 32));
  view.setUint32(size - 4, (message.length * 8) >>> 0);

  const h = H0.slice();
  const w = new Int32Array(64);
  for (let offset = 0; offset < size; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getInt32(offset + i * 4);
    for (let i = 16; i < 64; i++) {
      const x = w[i - 15];
      const y = w[i - 2];
      w[i] =
        (w[i - 16] +
          (((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3)) +
          w[i - 7] +
          (((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10))) |
        0;
    }
    let [a, b, c, d, e, f, g, k] = h;
    for (let i = 0; i < 64; i++) {
      const t1 =
        (k +
          (((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))) +
          ((e & f) ^ (~e & g)) +
          K[i] +
          w[i]) |
        0;
      const t2 =
        ((((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))) +
          ((a & b) ^ (a & c) ^ (b & c))) |
        0;
      k = g;
      g = f;
      f = e;
      e = (d + t1) | 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) | 0;
    }
    [a, b, c, d, e, f, g, k].forEach((v, i) => {
      h[i] = (h[i] + v) | 0;
    });
  }
  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  h.forEach((v, i) => outView.setInt32(i * 4, v));
  return out;
}

function hmacSha256(key: Uint8Array, message: Uint8Array) {
  const k = new Uint8Array(64);
  k.set(key.length > 64 ? sha256(key) : key);
  const inner = new Uint8Array(64 + message.length);
  inner.set(k.map((x) => x ^ 0x36));
  inner.set(message, 64);
  const outer = new Uint8Array(96);
  outer.set(k.map((x) => x ^ 0x5c));
  outer.set(sha256(inner), 64);
  return sha256(outer);
}

/** HMAC-SHA256 signature of `body`, base64url encoded. */
export async function sign(body: string) {
  if (globalThis.crypto?.subtle) {
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(brand.demoSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    return toBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(body))));
  }
  return toBase64Url(hmacSha256(enc.encode(brand.demoSecret), enc.encode(body)));
}
