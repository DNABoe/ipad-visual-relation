export interface StorageAdapter {
  get<T>(key: string): Promise<T | undefined>
  set<T>(key: string, value: T): Promise<void>
  delete(key: string): Promise<void>
  keys(): Promise<string[]>
  isReady(): Promise<boolean>
  checkHealth(): Promise<StorageHealthStatus>
}

export interface StorageHealthStatus {
  isReady: boolean
  canRead: boolean
  canWrite: boolean
  canDelete: boolean
  error?: string
}

class IndexedDBAdapter implements StorageAdapter {
  private dbName = 'RelEyeStorage'
  private storeName = 'keyValue'
  private version = 1
  private db: IDBDatabase | null = null
  private readyPromise: Promise<boolean> | null = null

  async isReady(): Promise<boolean> {
    if (this.readyPromise) {
      return this.readyPromise
    }

    this.readyPromise = this.initDB()
    return this.readyPromise
  }

  private async initDB(): Promise<boolean> {
    console.log('[IndexedDBAdapter] Initializing IndexedDB...')
    
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(this.dbName, this.version)

        request.onerror = () => {
          console.error('[IndexedDBAdapter] ✗ Failed to open IndexedDB:', request.error)
          resolve(false)
        }

        request.onsuccess = () => {
          this.db = request.result
          console.log('[IndexedDBAdapter] ✓ IndexedDB initialized successfully')
          resolve(true)
        }

        request.onupgradeneeded = (event) => {
          console.log('[IndexedDBAdapter] Creating object store...')
          const db = (event.target as IDBOpenDBRequest).result
          
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName)
            console.log('[IndexedDBAdapter] ✓ Object store created')
          }
        }
      } catch (error) {
        console.error('[IndexedDBAdapter] ✗ IndexedDB initialization error:', error)
        resolve(false)
      }
    })
  }

  private async ensureDB(): Promise<IDBDatabase> {
    await this.isReady()
    
    if (!this.db) {
      throw new Error('IndexedDB not initialized')
    }
    
    return this.db
  }

  async get<T>(key: string): Promise<T | undefined> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([this.storeName], 'readonly')
        const store = transaction.objectStore(this.storeName)
        const request = store.get(key)

        request.onsuccess = () => {
          console.log(`[IndexedDBAdapter] Got value for ${key}:`, request.result ? 'exists' : 'undefined')
          resolve(request.result)
        }

        request.onerror = () => {
          console.error(`[IndexedDBAdapter] Error getting ${key}:`, request.error)
          reject(request.error)
        }
      } catch (error) {
        console.error(`[IndexedDBAdapter] Transaction error getting ${key}:`, error)
        reject(error)
      }
    })
  }

  async set<T>(key: string, value: T): Promise<void> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([this.storeName], 'readwrite')
        const store = transaction.objectStore(this.storeName)
        const request = store.put(value, key)

        request.onsuccess = () => {
          console.log(`[IndexedDBAdapter] ✓ Successfully set ${key}`)
          resolve()
        }

        request.onerror = () => {
          console.error(`[IndexedDBAdapter] Error setting ${key}:`, request.error)
          reject(request.error)
        }
      } catch (error) {
        console.error(`[IndexedDBAdapter] Transaction error setting ${key}:`, error)
        reject(error)
      }
    })
  }

  async delete(key: string): Promise<void> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([this.storeName], 'readwrite')
        const store = transaction.objectStore(this.storeName)
        const request = store.delete(key)

        request.onsuccess = () => {
          console.log(`[IndexedDBAdapter] ✓ Successfully deleted ${key}`)
          resolve()
        }

        request.onerror = () => {
          console.error(`[IndexedDBAdapter] Error deleting ${key}:`, request.error)
          reject(request.error)
        }
      } catch (error) {
        console.error(`[IndexedDBAdapter] Transaction error deleting ${key}:`, error)
        reject(error)
      }
    })
  }

  async keys(): Promise<string[]> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([this.storeName], 'readonly')
        const store = transaction.objectStore(this.storeName)
        const request = store.getAllKeys()

        request.onsuccess = () => {
          const keys = request.result.map(k => String(k))
          console.log(`[IndexedDBAdapter] Got ${keys.length} keys`)
          resolve(keys)
        }

        request.onerror = () => {
          console.error('[IndexedDBAdapter] Error getting keys:', request.error)
          reject(request.error)
        }
      } catch (error) {
        console.error('[IndexedDBAdapter] Transaction error getting keys:', error)
        reject(error)
      }
    })
  }

  async checkHealth(): Promise<StorageHealthStatus> {
    const status: StorageHealthStatus = {
      isReady: false,
      canRead: false,
      canWrite: false,
      canDelete: false
    }

    try {
      status.isReady = await this.isReady()
      
      if (!status.isReady) {
        status.error = 'Storage not ready'
        return status
      }

      const testKey = '_health_check_test_key'
      const testValue = { test: true, timestamp: Date.now() }

      try {
        await this.set(testKey, testValue)
        status.canWrite = true
      } catch (error) {
        status.error = `Write failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        return status
      }

      try {
        const retrieved = await this.get(testKey)
        status.canRead = !!retrieved
      } catch (error) {
        status.error = `Read failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        return status
      }

      try {
        await this.delete(testKey)
        status.canDelete = true
      } catch (error) {
        status.error = `Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }

      return status
    } catch (error) {
      status.error = `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      return status
    }
  }
}

export const storage: StorageAdapter = new IndexedDBAdapter()
