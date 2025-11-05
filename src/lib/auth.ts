export interface PasswordHash {
  hash: string
  salt: string
  iterations: number
}

export interface UserCredentials {
  username: string
  passwordHash: PasswordHash
  encryptedApiKey?: string
  apiKeySalt?: string
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

export async function hashPassword(password: string, providedSalt?: string): Promise<PasswordHash> {
  try {
    const encoder = new TextEncoder()
    const passwordBuffer = encoder.encode(password)
    
    const iterations = 210000
    let saltBuffer: ArrayBuffer
    let saltString: string
    
    if (providedSalt) {
      saltString = providedSalt
      saltBuffer = base64ToArrayBuffer(saltString)
    } else {
      const saltArray = crypto.getRandomValues(new Uint8Array(32))
      saltBuffer = saltArray.buffer
      saltString = arrayBufferToBase64(saltBuffer)
    }
    
    const baseKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits']
    )
    
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: iterations,
        hash: 'SHA-256'
      },
      baseKey,
      256
    )
    
    return {
      hash: arrayBufferToBase64(derivedBits),
      salt: saltString,
      iterations: iterations
    }
  } catch (error) {
    console.error('Password hashing error:', error)
    throw new Error('Failed to hash password')
  }
}

export async function verifyPassword(password: string, storedHash: PasswordHash): Promise<boolean> {
  try {
    if (!password || !storedHash || !isPasswordHash(storedHash)) {
      return false
    }

    const encoder = new TextEncoder()
    const passwordBuffer = encoder.encode(password)
    
    const saltBuffer = base64ToArrayBuffer(storedHash.salt)
    const baseKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits']
    )
    
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: storedHash.iterations,
        hash: 'SHA-256'
      },
      baseKey,
      256
    )
    
    const computedHash = arrayBufferToBase64(derivedBits)
    return computedHash === storedHash.hash
  } catch (error) {
    console.error('Password verification error:', error)
    return false
  }
}

export function isPasswordHash(value: unknown): value is PasswordHash {
  return (
    typeof value === 'object' &&
    value !== null &&
    'hash' in value &&
    'salt' in value &&
    'iterations' in value &&
    typeof (value as PasswordHash).hash === 'string' &&
    typeof (value as PasswordHash).salt === 'string' &&
    typeof (value as PasswordHash).iterations === 'number'
  )
}

async function deriveKeyFromPassword(password: string, salt: ArrayBuffer): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)
  
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  )
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptApiKey(apiKey: string, password: string): Promise<{ encrypted: string; salt: string }> {
  try {
    const encoder = new TextEncoder()
    const apiKeyBuffer = encoder.encode(apiKey)
    
    const salt = crypto.getRandomValues(new Uint8Array(32))
    const key = await deriveKeyFromPassword(password, salt.buffer)
    
    const iv = crypto.getRandomValues(new Uint8Array(12))
    
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      apiKeyBuffer
    )
    
    const combined = new Uint8Array(iv.length + new Uint8Array(encryptedBuffer).length)
    combined.set(iv)
    combined.set(new Uint8Array(encryptedBuffer), iv.length)
    
    return {
      encrypted: arrayBufferToBase64(combined.buffer),
      salt: arrayBufferToBase64(salt.buffer)
    }
  } catch (error) {
    console.error('API key encryption error:', error)
    throw new Error('Failed to encrypt API key')
  }
}

export async function decryptApiKey(encryptedData: string, salt: string, password: string): Promise<string> {
  try {
    const saltBuffer = base64ToArrayBuffer(salt)
    const key = await deriveKeyFromPassword(password, saltBuffer)
    
    const combined = base64ToArrayBuffer(encryptedData)
    const iv = combined.slice(0, 12)
    const encryptedContent = combined.slice(12)
    
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encryptedContent
    )
    
    const decoder = new TextDecoder()
    return decoder.decode(decryptedBuffer)
  } catch (error) {
    console.error('API key decryption error:', error)
    throw new Error('Failed to decrypt API key')
  }
}
