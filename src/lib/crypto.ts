/**
 * Client-Side Zero-Knowledge Crypto Suite
 * Uses native Web Crypto API (SubtleCrypto)
 * - PBKDF2 (100,000 iterations, SHA-256)
 * - AES-GCM 256-bit with fresh 96-bit (12-byte) IV on every save
 */

import { EncryptedVaultPayload, VaultData } from '@/types/finance';

const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTE_LENGTH = 16;
const IV_BYTE_LENGTH = 12; // 96 bits recommended for AES-GCM

// ArrayBuffer <-> Base64 helpers
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToBuffer(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derives an AES-GCM 256-bit CryptoKey from a user password and salt using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts VaultData into an EncryptedVaultPayload
 */
export async function encryptVault(data: VaultData, masterPassword: string): Promise<EncryptedVaultPayload> {
  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_BYTE_LENGTH));
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_BYTE_LENGTH));

  const key = await deriveKey(masterPassword, salt);
  const jsonString = JSON.stringify(data);
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(jsonString);

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encodedData
  );

  return {
    version: 1,
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(ciphertext),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Decrypts an EncryptedVaultPayload back into VaultData
 */
export async function decryptVault(payload: EncryptedVaultPayload, masterPassword: string): Promise<VaultData> {
  const salt = base64ToBuffer(payload.salt);
  const iv = base64ToBuffer(payload.iv);
  const ciphertext = base64ToBuffer(payload.ciphertext);

  const key = await deriveKey(masterPassword, salt);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource,
      },
      key,
      ciphertext as BufferSource
    );

    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decryptedBuffer);
    return JSON.parse(jsonString) as VaultData;
  } catch (err) {
    throw new Error('Master password non valida o file corrotto.');
  }
}

/**
 * WebAuthn Passkey Helper (Face ID / Touch ID / Windows Hello)
 * Stores an encrypted master password key in IndexedDB/localStorage locked with local biometric credentials
 */
export async function isWebAuthnAvailable(): Promise<boolean> {
  return !!(
    window.PublicKeyCredential &&
    (await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.())
  );
}

const BIOMETRIC_KEY_STORAGE = 'finance_vault_biometric_token';

export async function registerBiometricUnlock(masterPassword: string): Promise<boolean> {
  if (!window.PublicKeyCredential) return false;

  try {
    const challenge = window.crypto.getRandomValues(new Uint8Array(32));
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Personal Finance Vault' },
        user: {
          id: new TextEncoder().encode('vault-owner'),
          name: 'owner@vault.local',
          displayName: 'Vault Owner',
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
      },
    });

    if (credential) {
      // Store encrypted quick-token with salt
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const key = await deriveKey(credential.id, salt);
      const enc = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        new TextEncoder().encode(masterPassword)
      );

      const payload = {
        credId: credential.id,
        salt: bufferToBase64(salt),
        iv: bufferToBase64(iv),
        ciphertext: bufferToBase64(enc),
      };

      localStorage.setItem(BIOMETRIC_KEY_STORAGE, JSON.stringify(payload));
      return true;
    }
  } catch (e) {
    console.error('Biometric registration error:', e);
  }
  return false;
}

export async function authenticateWithBiometrics(): Promise<string | null> {
  const stored = localStorage.getItem(BIOMETRIC_KEY_STORAGE);
  if (!stored) return null;

  try {
    const payload = JSON.parse(stored);
    const challenge = window.crypto.getRandomValues(new Uint8Array(32));
    
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [
          {
            id: new TextEncoder().encode(payload.credId),
            type: 'public-key',
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      },
    });

    if (assertion) {
      const salt = base64ToBuffer(payload.salt);
      const iv = base64ToBuffer(payload.iv);
      const ciphertext = base64ToBuffer(payload.ciphertext);

      const key = await deriveKey(payload.credId, salt);
      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as BufferSource },
        key,
        ciphertext as BufferSource
      );
      return new TextDecoder().decode(decrypted);
    }
  } catch (e) {
    console.error('Biometric authentication error:', e);
  }
  return null;
}

export function hasBiometricSetup(): boolean {
  return !!localStorage.getItem(BIOMETRIC_KEY_STORAGE);
}

export function clearBiometricSetup(): void {
  localStorage.removeItem(BIOMETRIC_KEY_STORAGE);
}
