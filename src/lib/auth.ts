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
  try {
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

const DEFAULT_PASSWORD_HASH: PasswordHash = {
  hash: 'sDhBPr/3VBEYl2xZEfGGPYmEzGcqDqJCqN8W3c0tLCk=',
  salt: 'cmVsZXllZGVmYXVsdHNhbHQxMjM0NTY3ODkwYWJjZGVm',
  iterations: 210000
}

export function getDefaultPasswordHash(): PasswordHash {
  return { ...DEFAULT_PASSWORD_HASH }
}
