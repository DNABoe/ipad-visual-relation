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

let defaultPasswordHash: PasswordHash | null = null

async function initDefaultPasswordHash(): Promise<PasswordHash> {
  if (defaultPasswordHash) {
    return defaultPasswordHash
  }
  
  const fixedSaltString = 'releye2024defaultsalt1234567890abcdefghij'
  const hash = await hashPassword('admin', fixedSaltString)
  defaultPasswordHash = hash
  console.log('Computed default hash:', hash.hash)
  return hash
}

export function getDefaultPasswordHash(): PasswordHash {
  const fixedSaltString = 'releye2024defaultsalt1234567890abcdefghij'
  const iterations = 210000
  
  return {
    hash: 'V/wPGKfN7VgqxJ5h5fDYu4mXSUQj3+r3WZgW7KYPdWE=',
    salt: fixedSaltString,
    iterations: iterations
  }
}

export async function ensureDefaultPasswordHashInitialized(): Promise<void> {
  const computed = await initDefaultPasswordHash()
  console.log('Default password hash initialized. Use this hash:', computed.hash)
}
