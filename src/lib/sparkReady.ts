export async function waitForStorage(maxWaitMs: number = 5000): Promise<boolean> {
  console.log('[storageReady] Checking localStorage availability')
  
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      console.error('[storageReady] localStorage not available')
      return false
    }
    
    const testKey = '__storage_test__'
    const testValue = { test: true, timestamp: Date.now() }
    
    window.localStorage.setItem(testKey, JSON.stringify(testValue))
    const retrieved = window.localStorage.getItem(testKey)
    window.localStorage.removeItem(testKey)
    
    if (!retrieved) {
      console.error('[storageReady] Storage write test failed')
      return false
    }
    
    console.log('[storageReady] ✓ localStorage is ready')
    return true
  } catch (error) {
    console.error('[storageReady] localStorage check failed:', error)
    return false
  }
}

export function isStorageAvailable(): boolean {
  try {
    return !!(
      typeof window !== 'undefined' &&
      window.localStorage &&
      typeof window.localStorage.setItem === 'function' &&
      typeof window.localStorage.getItem === 'function'
    )
  } catch {
    return false
  }
}
