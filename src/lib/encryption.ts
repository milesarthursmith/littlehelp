// AES-256-GCM encryption using Web Crypto API

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256

// Derive a key from a password using PBKDF2
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

// Generate a random salt
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16))
}

// Generate a random IV (Initialization Vector)
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12))
}

// Convert ArrayBuffer to base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// Convert base64 string to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export interface EncryptedData {
  ciphertext: string // base64 encoded
  iv: string // base64 encoded
  salt: string // base64 encoded
}

// Encrypt a password
export async function encryptPassword(
  plaintext: string,
  masterPassword: string
): Promise<EncryptedData> {
  const encoder = new TextEncoder()
  const salt = generateSalt()
  const iv = generateIV()
  const key = await deriveKey(masterPassword, salt)

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
    key,
    encoder.encode(plaintext)
  )

  return {
    ciphertext: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
    salt: arrayBufferToBase64(salt.buffer as ArrayBuffer),
  }
}

// Decrypt a password
export async function decryptPassword(
  encryptedData: EncryptedData,
  masterPassword: string
): Promise<string> {
  const decoder = new TextDecoder()
  const salt = base64ToUint8Array(encryptedData.salt)
  const iv = base64ToUint8Array(encryptedData.iv)
  const ciphertext = base64ToUint8Array(encryptedData.ciphertext)
  const key = await deriveKey(masterPassword, salt)

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
    key,
    ciphertext.buffer as ArrayBuffer
  )

  return decoder.decode(decrypted)
}
