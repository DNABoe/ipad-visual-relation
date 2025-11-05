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

class SparkKVAdapter implements StorageAdapter {
  private readyPromise: Promise<boolean> | null = null

  async isReady(): Promise<boolean> {
    if (this.readyPromise) {
      return this.readyPromise
    }

    this.readyPromise = this.checkReady()
    return this.readyPromise
  }

  private async checkReady(): Promise<boolean> {
    console.log('[SparkKVAdapter] Checking Spark KV availability...')
    
    try {
      if (typeof window === 'undefined' || !window.spark || !window.spark.kv) {
        console.error('[SparkKVAdapter] ✗ Spark KV not available')
        return false
      }
      
      console.log('[SparkKVAdapter] ✓ Spark KV available')
      return true
    } catch (error) {
      console.error('[SparkKVAdapter] ✗ Error checking availability:', error)
      return false
    }
  }

  private async ensureReady(): Promise<void> {
    const ready = await this.isReady()
    if (!ready) {
      throw new Error('Spark KV storage not available')
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    await this.ensureReady()
    
    try {
      const value = await window.spark.kv.get<T>(key)
      console.log(`[SparkKVAdapter] Got value for ${key}:`, value !== undefined ? 'exists' : 'undefined')
      return value
    } catch (error) {
      console.error(`[SparkKVAdapter] Error getting ${key}:`, error)
      throw error
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.ensureReady()
    
    try {
      await window.spark.kv.set(key, value)
      console.log(`[SparkKVAdapter] ✓ Successfully set ${key}`)
    } catch (error) {
      console.error(`[SparkKVAdapter] Error setting ${key}:`, error)
      throw error
    }
  }

  async delete(key: string): Promise<void> {
    await this.ensureReady()
    
    try {
      await window.spark.kv.delete(key)
      console.log(`[SparkKVAdapter] ✓ Successfully deleted ${key}`)
    } catch (error) {
      console.error(`[SparkKVAdapter] Error deleting ${key}:`, error)
      throw error
    }
  }

  async keys(): Promise<string[]> {
    await this.ensureReady()
    
    try {
      const keys = await window.spark.kv.keys()
      console.log(`[SparkKVAdapter] Got ${keys.length} keys`)
      return keys
    } catch (error) {
      console.error('[SparkKVAdapter] Error getting keys:', error)
      throw error
    }
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
        status.error = 'Spark KV storage not available'
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

export const storage: StorageAdapter = new SparkKVAdapter()
