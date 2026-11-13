// Base64 sans dépendance au téléphone (les pièces jointes partent au NAS en JSON).

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const INVERSE = new Uint8Array(128);
for (let i = 0; i < ALPHABET.length; i++) INVERSE[ALPHABET.charCodeAt(i)] = i;

export function versBase64(o: Uint8Array): string {
  const morceaux: string[] = [];
  let s = '';
  for (let i = 0; i < o.length; i += 3) {
    const n = (o[i] << 16) | ((o[i + 1] ?? 0) << 8) | (o[i + 2] ?? 0);
    s += ALPHABET[(n >> 18) & 63] + ALPHABET[(n >> 12) & 63] + (i + 1 < o.length ? ALPHABET[(n >> 6) & 63] : '=') + (i + 2 < o.length ? ALPHABET[n & 63] : '=');
    if (s.length > 8192) {
      morceaux.push(s);
      s = '';
    }
  }
  morceaux.push(s);
  return morceaux.join('');
}

export function depuisBase64(b: string): Uint8Array {
  const propre = b.replace(/[^A-Za-z0-9+/]/g, '');
  const out = new Uint8Array(Math.floor((propre.length * 3) / 4));
  let j = 0;
  for (let i = 0; i < propre.length; i += 4) {
    const n = (INVERSE[propre.charCodeAt(i)] << 18) | (INVERSE[propre.charCodeAt(i + 1)] << 12) | (INVERSE[propre.charCodeAt(i + 2)] << 6) | INVERSE[propre.charCodeAt(i + 3)];
    out[j++] = (n >> 16) & 255;
    if (i + 2 < propre.length) out[j++] = (n >> 8) & 255;
    if (i + 3 < propre.length) out[j++] = n & 255;
  }
  return out.subarray(0, j);
}
