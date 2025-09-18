// Utility: WebCrypto envelope encryption for workspace data
// Note: In browsers, Argon2 isn't native. We use PBKDF2(SHA-256) here and recommend Argon2id via WASM for production hardening.

export type WrappedDEK = {
  alg: 'AES-GCM',
  kdf: 'PBKDF2',
  iterations: number,
  hash: 'SHA-256',
  salt_b64: string,
  wrapped_key_b64: string
}

const PBKDF2_ITERATIONS = 210000; // OWASP-aligned baseline; tune per device

const enc = new TextEncoder();

function toB64(arr: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(arr)));
}

function fromB64(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

// Ensure salt is an ArrayBuffer to satisfy environments where SubtleCrypto types require ArrayBuffer explicitly
export async function deriveKEK(passphrase: string, salt: ArrayBuffer): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-KW', length: 256 },
    false,
    ['wrapKey', 'unwrapKey']
  );
}

export async function generateWrappedDEK(passphrase: string): Promise<WrappedDEK> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = saltBytes.buffer.slice(saltBytes.byteOffset, saltBytes.byteOffset + saltBytes.byteLength);
  const kek = await deriveKEK(passphrase, salt);
  const dek = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const wrapped = await crypto.subtle.wrapKey('raw', dek, kek, 'AES-KW');
  return {
    alg: 'AES-GCM',
    kdf: 'PBKDF2',
    iterations: PBKDF2_ITERATIONS,
    hash: 'SHA-256',
    salt_b64: toB64(salt),
    wrapped_key_b64: toB64(wrapped)
  };
}

export async function unwrapDEK(passphrase: string, wrapped: WrappedDEK): Promise<CryptoKey> {
  const saltArr = new Uint8Array(fromB64(wrapped.salt_b64));
  const salt = saltArr.buffer.slice(saltArr.byteOffset, saltArr.byteOffset + saltArr.byteLength);
  const kek = await deriveKEK(passphrase, salt);
  return crypto.subtle.unwrapKey(
    'raw',
    fromB64(wrapped.wrapped_key_b64),
    kek,
    'AES-KW',
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptBytes(dek: CryptoKey, plaintext: Uint8Array): Promise<{ iv_b64: string, ciphertext_b64: string }>{
  const ivBytes = crypto.getRandomValues(new Uint8Array(12));
  const iv = new Uint8Array(ivBytes).buffer as ArrayBuffer; // ensure ArrayBuffer type
  const pt = new Uint8Array(plaintext).buffer as ArrayBuffer; // ensure ArrayBuffer type
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, dek, pt);
  return { iv_b64: toB64(iv), ciphertext_b64: toB64(ct) };
}

export async function decryptBytes(dek: CryptoKey, iv_b64: string, ciphertext_b64: string): Promise<Uint8Array> {
  const iv = fromB64(iv_b64); // ArrayBuffer
  const ct = fromB64(ciphertext_b64); // ArrayBuffer
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, dek, ct);
  return new Uint8Array(pt);
}