import { useCallback, useRef, useState } from 'react';

const PBKDF2_ITERATIONS = 100_000;

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function deriveAesKeyFromPassphrase(
  passphrase: string,
  saltBytes: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return globalThis.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes.buffer.slice(saltBytes.byteOffset, saltBytes.byteOffset + saltBytes.byteLength) as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptWithPassphrase(
  plaintext: string,
  passphrase: string,
  existingSaltBase64?: string
): Promise<{ ciphertext: string; salt: string; iv: string }> {
  const saltBytes = existingSaltBase64
    ? fromBase64(existingSaltBase64)
    : globalThis.crypto.getRandomValues(new Uint8Array(16));
  const ivBytes = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKeyFromPassphrase(passphrase, saltBytes);
  const encoded = new TextEncoder().encode(plaintext);

  const encryptedBuffer = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: ivBytes.buffer.slice(ivBytes.byteOffset, ivBytes.byteOffset + ivBytes.byteLength) as ArrayBuffer },
    key,
    encoded
  );

  return {
    ciphertext: toBase64(new Uint8Array(encryptedBuffer)),
    salt: toBase64(saltBytes),
    iv: toBase64(ivBytes),
  };
}

export async function decryptWithPassphrase(
  ciphertextBase64: string,
  saltBase64: string,
  ivBase64: string,
  passphrase: string
): Promise<string> {
  const saltBytes = fromBase64(saltBase64);
  const ivBytes = fromBase64(ivBase64);
  const cipherBytes = fromBase64(ciphertextBase64);
  const key = await deriveAesKeyFromPassphrase(passphrase, saltBytes);

  const decryptedBuffer = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes.buffer.slice(ivBytes.byteOffset, ivBytes.byteOffset + ivBytes.byteLength) as ArrayBuffer },
    key,
    cipherBytes.buffer.slice(cipherBytes.byteOffset, cipherBytes.byteOffset + cipherBytes.byteLength) as ArrayBuffer
  );

  return new TextDecoder().decode(decryptedBuffer);
}

export function usePassphraseCrypto() {
  // Passphrase & CryptoKey exist ONLY in volatile memory, never persisted to storage.
  const keyRef = useRef<CryptoKey | null>(null);
  const saltRef = useRef<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const unlockWithPassphrase = useCallback(
    async (passphrase: string, existingSaltBase64?: string): Promise<string> => {
      if (passphrase.trim().length < 4) {
        throw new Error('Passphrase minimal 4 karakter.');
      }
      const saltBytes = existingSaltBase64
        ? fromBase64(existingSaltBase64)
        : globalThis.crypto.getRandomValues(new Uint8Array(16));
      const key = await deriveAesKeyFromPassphrase(passphrase, saltBytes);
      const saltB64 = toBase64(saltBytes);
      keyRef.current = key;
      saltRef.current = saltB64;
      setIsUnlocked(true);
      return saltB64;
    },
    []
  );

  const encryptText = useCallback(
    async (plaintext: string): Promise<{ ciphertext: string; salt: string; iv: string }> => {
      if (!keyRef.current || !saltRef.current) {
        throw new Error('Ruang pribadi belum dibuka.');
      }
      const ivBytes = globalThis.crypto.getRandomValues(new Uint8Array(12));
      const encoded = new TextEncoder().encode(plaintext);
      const encryptedBuffer = await globalThis.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: ivBytes.buffer.slice(ivBytes.byteOffset, ivBytes.byteOffset + ivBytes.byteLength) as ArrayBuffer },
        keyRef.current,
        encoded
      );
      return {
        ciphertext: toBase64(new Uint8Array(encryptedBuffer)),
        salt: saltRef.current,
        iv: toBase64(ivBytes),
      };
    },
    []
  );

  const decryptText = useCallback(
    async (ciphertextBase64: string, ivBase64: string): Promise<string> => {
      if (!keyRef.current) {
        throw new Error('Ruang pribadi belum dibuka.');
      }
      const ivBytes = fromBase64(ivBase64);
      const cipherBytes = fromBase64(ciphertextBase64);
      const decryptedBuffer = await globalThis.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivBytes.buffer.slice(ivBytes.byteOffset, ivBytes.byteOffset + ivBytes.byteLength) as ArrayBuffer },
        keyRef.current,
        cipherBytes.buffer.slice(cipherBytes.byteOffset, cipherBytes.byteOffset + cipherBytes.byteLength) as ArrayBuffer
      );
      return new TextDecoder().decode(decryptedBuffer);
    },
    []
  );

  const lockMemoryKey = useCallback(() => {
    keyRef.current = null;
    saltRef.current = null;
    setIsUnlocked(false);
  }, []);

  return {
    isUnlocked,
    unlockWithPassphrase,
    encryptText,
    decryptText,
    lockMemoryKey,
  };
}
