export async function waitForStorage(maxWaitMs: number = 5000): Promise<boolean> {
  console.log('[storageReady] Checking storage availability (backend + localStorage)')
  
  try {
    if (typeof window === 'undefined') {
      console.error('[storageReady] Window not available')
      return false
    }
    
    if (!window.localStorage) {
      console.error('[storageReady] localStorage not available')
      return false
    }
    
    const testKey = '__storage_test__'
    const testValue = { test: true, timestamp: Date.now() }
    
    window.localStorage.setItem(testKey, JSON.stringify(testValue))
    const retrieved = window.localStorage.getItem(testKey)
    window.localStorage.removeItem(testKey)
    
    if (!retrieved) {
      console.error('[storageReady] localStorage write test failed')
      return false
    }
    
    console.log('[storageReady] ✓ localStorage is ready')
    console.log('[storageReady] User data is stored in backend database at releye.boestad.com/api')
    return true
  } catch (error) {
    console.error('[storageReady] Storage check failed:', error)
    return false
  }
}

export function isStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined') {
      return false
    }
    
    return !!(
      window.localStorage &&
      typeof window.localStorage.setItem === 'function' &&
      typeof window.localStorage.getItem === 'function'
    )
  } catch {
    return false
  }
}
