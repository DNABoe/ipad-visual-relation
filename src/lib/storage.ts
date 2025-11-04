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

    this.readyPromise = this.checkSparkKV()
    return this.readyPromise
  }

  private async checkSparkKV(): Promise<boolean> {
    const maxWaitMs = 5000
    const startTime = Date.now()
    
    console.log('[SparkKVAdapter] Checking for Spark KV availability...')

    while (Date.now() - startTime < maxWaitMs) {
      try {
        if (window.spark?.kv && 
            typeof window.spark.kv.get === 'function' &&
            typeof window.spark.kv.set === 'function' &&
            typeof window.spark.kv.keys === 'function' &&
            typeof window.spark.kv.delete === 'function') {
          
          await window.spark.kv.get('_spark_health_check')
          console.log('[SparkKVAdapter] ✓ Spark KV is ready')
          return true
        }
      } catch (error) {
        console.warn('[SparkKVAdapter] Waiting for Spark KV...', error)
      }
      
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.error('[SparkKVAdapter] ✗ Spark KV not available after timeout')
    return false
  }

  async get<T>(key: string): Promise<T | undefined> {
    await this.isReady()
    
    if (!window.spark?.kv) {
      throw new Error('Spark KV not available')
    }

    try {
      console.log(`[SparkKVAdapter] Getting key: ${key}`)
      const value = await window.spark.kv.get<T>(key)
      console.log(`[SparkKVAdapter] Got value for ${key}:`, value ? 'exists' : 'undefined', value)
      return value
    } catch (error) {
      console.error(`[SparkKVAdapter] Error getting ${key}:`, error)
      throw error
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.isReady()
    
    if (!window.spark?.kv) {
      throw new Error('Spark KV not available')
    }

    try {
      console.log(`[SparkKVAdapter] Setting key: ${key}`, value)
      
      await window.spark.kv.set(key, value)
      console.log(`[SparkKVAdapter] Successfully set ${key}`)
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const verification = await window.spark.kv.get<T>(key)
      console.log(`[SparkKVAdapter] Verification result for ${key}:`, verification)
      
      if (verification === null || verification === undefined) {
        console.error(`[SparkKVAdapter] Verification failed - value is null or undefined`)
        throw new Error(`Failed to verify ${key} was saved - storage returned ${verification}`)
      }
      
      console.log(`[SparkKVAdapter] ✓ Verified ${key} was saved successfully`)
    } catch (error) {
      console.error(`[SparkKVAdapter] Error setting ${key}:`, error)
      console.error(`[SparkKVAdapter] Value that failed to save:`, value)
      throw new Error(`Storage error for ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async delete(key: string): Promise<void> {
    await this.isReady()
    
    if (!window.spark?.kv) {
      throw new Error('Spark KV not available')
    }

    try {
      await window.spark.kv.delete(key)
    } catch (error) {
      console.error(`[SparkKVAdapter] Error deleting ${key}:`, error)
      throw error
    }
  }

  async keys(): Promise<string[]> {
    await this.isReady()
    
    if (!window.spark?.kv) {
      throw new Error('Spark KV not available')
    }

    try {
      return await window.spark.kv.keys()
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
        status.error = 'Storage not ready'
        return status
      }

      const testKey = '_health_check_test_key'
      const testValue = { test: true, timestamp: Date.now() }

      try {
        await window.spark!.kv.set(testKey, testValue)
        status.canWrite = true
      } catch (error) {
        status.error = `Write failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        return status
      }

      try {
        const retrieved = await window.spark!.kv.get(testKey)
        status.canRead = !!retrieved
      } catch (error) {
        status.error = `Read failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        return status
      }

      try {
        await window.spark!.kv.delete(testKey)
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
