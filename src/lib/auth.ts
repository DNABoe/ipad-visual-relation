export interface PasswordHash {
  hash: string
  salt: string
  iterations: number
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

export async function hashPassword(password: string): Promise<PasswordHash> {
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)
  
  const saltArray = crypto.getRandomValues(new Uint8Array(32))
  const iterations = 210000
  
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
      salt: saltArray.buffer,
      iterations: iterations,
      hash: 'SHA-256'
    },
    baseKey,
    256
  )
  
  return {
    hash: arrayBufferToBase64(derivedBits),
    salt: arrayBufferToBase64(saltArray.buffer),
    iterations: iterations
  }
}

export async function verifyPassword(password: string, storedHash: PasswordHash): Promise<boolean> {
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

export async function getDefaultPasswordHash(): Promise<PasswordHash> {
  return hashPassword('admin')
}
