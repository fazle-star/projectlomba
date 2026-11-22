import test from 'node:test';
import assert from 'node:assert/strict';
import { decryptWithPassphrase, encryptWithPassphrase } from './usePassphraseCrypto';

test('PBKDF2 + AES-GCM encrypts and decrypts plaintext cleanly without exposing key', async () => {
  const secretNote = 'Malam ini saya memilih melepaskan cemas soal deadline besok.';
  const passphrase = 'senja-tenang-2027';

  const encrypted = await encryptWithPassphrase(secretNote, passphrase);
  assert.notEqual(encrypted.ciphertext, secretNote);
  assert.ok(encrypted.salt.length > 10);
  assert.ok(encrypted.iv.length > 10);

  const decrypted = await decryptWithPassphrase(
    encrypted.ciphertext,
    encrypted.salt,
    encrypted.iv,
    passphrase
  );
  assert.equal(decrypted, secretNote);
});

test('PBKDF2 + AES-GCM rejects wrong passphrase during decryption', async () => {
  const encrypted = await encryptWithPassphrase('Catatan pribadi rahasia', 'kunci-benar');
  await assert.rejects(async () => {
    await decryptWithPassphrase(encrypted.ciphertext, encrypted.salt, encrypted.iv, 'kunci-salah');
  });
});
