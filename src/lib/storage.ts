export interface StorageHealthStatus {
  isReady: boolean
  canRead: boolean
  canWrite: boolean
  canDelete: boolean
  usingSparkKV: boolean
  error?: string
}

function checkLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false
    }
    const testKey = '__storage_test__'
    window.localStorage.setItem(testKey, 'test')
    window.localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

function checkSparkKVAvailable(): boolean {
  try {
    if (typeof window === 'undefined') {
      return false
    }
    const w = window as any
    return !!(w.spark && w.spark.kv && typeof w.spark.kv.get === 'function')
  } catch {
    return false
  }
}

export const storage = {
  async isReady(): Promise<boolean> {
    return checkSparkKVAvailable() || checkLocalStorageAvailable()
  },
  
  async get<T>(key: string): Promise<T | undefined> {
    if (checkSparkKVAvailable()) {
      try {
        const w = window as any
        const result = await w.spark.kv.get(key)
        return result as T | undefined
      } catch (error) {
        console.error(`Error reading from Spark KV (${key}):`, error)
        console.log('Falling back to localStorage...')
      }
    }
    
    if (!checkLocalStorageAvailable()) {
      throw new Error('No storage available')
    }
    
    try {
      const item = window.localStorage.getItem(key)
      if (item === null) {
        return undefined
      }
      return JSON.parse(item) as T
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error)
      return undefined
    }
  },
  
  async set<T>(key: string, value: T): Promise<void> {
    if (checkSparkKVAvailable()) {
      try {
        const w = window as any
        await w.spark.kv.set(key, value)
        return
      } catch (error) {
        console.error(`Error writing to Spark KV (${key}):`, error)
        console.log('Falling back to localStorage...')
      }
    }
    
    if (!checkLocalStorageAvailable()) {
      throw new Error('No storage available')
    }
    
    try {
      const serialized = JSON.stringify(value)
      window.localStorage.setItem(key, serialized)
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error)
      throw new Error('Failed to save data. Your browser storage may be full.')
    }
  },
  
  async delete(key: string): Promise<void> {
    if (checkSparkKVAvailable()) {
      try {
        const w = window as any
        await w.spark.kv.delete(key)
        return
      } catch (error) {
        console.error(`Error deleting from Spark KV (${key}):`, error)
        console.log('Falling back to localStorage...')
      }
    }
    
    if (!checkLocalStorageAvailable()) {
      throw new Error('No storage available')
    }
    
    try {
      window.localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error deleting from localStorage (${key}):`, error)
      throw error
    }
  },
  
  async keys(): Promise<string[]> {
    if (checkSparkKVAvailable()) {
      try {
        const w = window as any
        return await w.spark.kv.keys()
      } catch (error) {
        console.error('Error getting Spark KV keys:', error)
        console.log('Falling back to localStorage...')
      }
    }
    
    if (!checkLocalStorageAvailable()) {
      throw new Error('No storage available')
    }
    
    try {
      const keys: string[] = []
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i)
        if (key) {
          keys.push(key)
        }
      }
      return keys
    } catch (error) {
      console.error('Error getting localStorage keys:', error)
      return []
    }
  },
  
  async checkHealth(): Promise<StorageHealthStatus> {
    const status: StorageHealthStatus = {
      isReady: false,
      canRead: false,
      canWrite: false,
      canDelete: false,
      usingSparkKV: false
    }

    try {
      const hasSparkKV = checkSparkKVAvailable()
      const hasLocalStorage = checkLocalStorageAvailable()
      
      status.usingSparkKV = hasSparkKV
      status.isReady = hasSparkKV || hasLocalStorage
      
      if (!status.isReady) {
        status.error = 'No storage mechanism available - check browser settings'
        return status
      }

      const testKey = '_health_check_test_key'
      const testValue = { test: true, timestamp: Date.now() }

      if (hasSparkKV) {
        try {
          const w = window as any
          await w.spark.kv.set(testKey, testValue)
          status.canWrite = true
          
          const retrieved = await w.spark.kv.get(testKey)
          status.canRead = !!retrieved
          
          await w.spark.kv.delete(testKey)
          status.canDelete = true
          
          return status
        } catch (error) {
          status.error = `Spark KV test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          console.log('Spark KV health check failed, trying localStorage...')
        }
      }

      if (hasLocalStorage) {
        try {
          window.localStorage.setItem(testKey, JSON.stringify(testValue))
          status.canWrite = true
        } catch (error) {
          status.error = `Write failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          return status
        }

        try {
          const retrieved = window.localStorage.getItem(testKey)
          status.canRead = !!retrieved
        } catch (error) {
          status.error = `Read failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          return status
        }

        try {
          window.localStorage.removeItem(testKey)
          status.canDelete = true
        } catch (error) {
          status.error = `Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }

      return status
    } catch (error) {
      status.error = `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      return status
    }
  }
}
