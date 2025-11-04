/**
 * Storage abstraction layer
 * Uses Spark KV when available (development), falls back to localStorage (production)
 */

export interface StorageAdapter {
  get<T>(key: string): Promise<T | undefined>
  set<T>(key: string, value: T): Promise<void>
  delete(key: string): Promise<void>
  keys(): Promise<string[]>
}

class SparkKVAdapter implements StorageAdapter {
  async get<T>(key: string): Promise<T | undefined> {
    return await window.spark.kv.get<T>(key)
  }

  async set<T>(key: string, value: T): Promise<void> {
    await window.spark.kv.set(key, value)
  }

  async delete(key: string): Promise<void> {
    await window.spark.kv.delete(key)
  }

  async keys(): Promise<string[]> {
    return await window.spark.kv.keys()
  }
}

class LocalStorageAdapter implements StorageAdapter {
  private prefix = 'releye_'

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const item = localStorage.getItem(this.prefix + key)
      return item ? JSON.parse(item) : undefined
    } catch (error) {
      console.error('[LocalStorageAdapter] Get error:', error)
      return undefined
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value))
    } catch (error) {
      console.error('[LocalStorageAdapter] Set error:', error)
      throw error
    }
  }

  async delete(key: string): Promise<void> {
    try {
      localStorage.removeItem(this.prefix + key)
    } catch (error) {
      console.error('[LocalStorageAdapter] Delete error:', error)
      throw error
    }
  }

  async keys(): Promise<string[]> {
    try {
      const keys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.prefix)) {
          keys.push(key.substring(this.prefix.length))
        }
      }
      return keys
    } catch (error) {
      console.error('[LocalStorageAdapter] Keys error:', error)
      return []
    }
  }
}

function isSparkAvailable(): boolean {
  return !!(
    typeof window !== 'undefined' &&
    window.spark &&
    window.spark.kv &&
    typeof window.spark.kv.get === 'function' &&
    typeof window.spark.kv.set === 'function'
  )
}

let storageInstance: StorageAdapter | null = null

export function getStorage(): StorageAdapter {
  if (!storageInstance) {
    if (isSparkAvailable()) {
      console.log('[Storage] Using Spark KV adapter')
      storageInstance = new SparkKVAdapter()
    } else {
      console.log('[Storage] Using localStorage adapter')
      storageInstance = new LocalStorageAdapter()
    }
  }
  return storageInstance
}

export async function waitForStorage(maxWaitMs: number = 5000): Promise<boolean> {
  const startTime = Date.now()
  
  console.log('[Storage] Checking for available storage...')
  
  if (isSparkAvailable()) {
    console.log('[Storage] Spark KV detected, testing...')
    try {
      await window.spark.kv.get('_test')
      console.log('[Storage] ✓ Spark KV ready')
      return true
    } catch (error) {
      console.warn('[Storage] Spark KV test failed, will retry:', error)
      
      while (Date.now() - startTime < maxWaitMs) {
        await new Promise(resolve => setTimeout(resolve, 250))
        
        if (isSparkAvailable()) {
          try {
            await window.spark.kv.get('_test')
            console.log('[Storage] ✓ Spark KV ready (after retry)')
            return true
          } catch (e) {
            continue
          }
        }
      }
    }
  }
  
  if (typeof localStorage !== 'undefined') {
    console.log('[Storage] ✓ localStorage available')
    return true
  }
  
  console.error('[Storage] ✗ No storage available')
  return false
}

export function isStorageAvailable(): boolean {
  return isSparkAvailable() || typeof localStorage !== 'undefined'
}
