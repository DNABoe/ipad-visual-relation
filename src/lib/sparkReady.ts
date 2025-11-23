export async function waitForStorage(maxWaitMs: number = 5000): Promise<boolean> {
  console.log('[storageReady] Checking Spark KV availability')
  
  try {
    if (typeof window === 'undefined') {
      console.error('[storageReady] Window not available')
      return false
    }
    
    if (!window.spark || !window.spark.kv) {
      console.error('[storageReady] Spark KV not available - this may be expected during development')
      console.log('[storageReady] Falling back to localStorage check...')
      
      if (!window.localStorage) {
        console.error('[storageReady] localStorage also not available')
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
      
      console.log('[storageReady] ✓ localStorage is ready (fallback mode)')
      return true
    }
    
    const testKey = '__spark_kv_test__'
    const testValue = { test: true, timestamp: Date.now() }
    
    await window.spark.kv.set(testKey, testValue)
    const retrieved = await window.spark.kv.get(testKey)
    await window.spark.kv.delete(testKey)
    
    if (!retrieved) {
      console.error('[storageReady] Spark KV write test failed')
      return false
    }
    
    console.log('[storageReady] ✓ Spark KV is ready and working')
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
    
    if (window.spark && window.spark.kv) {
      return true
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
