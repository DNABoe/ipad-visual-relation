export interface StorageHealthStatus {
  isReady: boolean
  canRead: boolean
  canWrite: boolean
  canDelete: boolean
  error?: string
}

async function checkSparkKVReady(): Promise<boolean> {
  try {
    if (typeof window === 'undefined' || !window.spark || !window.spark.kv) {
      return false
    }
    return true
  } catch {
    return false
  }
}

export const storage = {
  async isReady(): Promise<boolean> {
    return await checkSparkKVReady()
  },
  
  async get<T>(key: string): Promise<T | undefined> {
    if (!await checkSparkKVReady()) {
      throw new Error('Spark KV storage not available')
    }
    return await window.spark.kv.get<T>(key)
  },
  
  async set<T>(key: string, value: T): Promise<void> {
    if (!await checkSparkKVReady()) {
      throw new Error('Spark KV storage not available')
    }
    await window.spark.kv.set(key, value)
  },
  
  async delete(key: string): Promise<void> {
    if (!await checkSparkKVReady()) {
      throw new Error('Spark KV storage not available')
    }
    await window.spark.kv.delete(key)
  },
  
  async keys(): Promise<string[]> {
    if (!await checkSparkKVReady()) {
      throw new Error('Spark KV storage not available')
    }
    return await window.spark.kv.keys()
  },
  
  async checkHealth(): Promise<StorageHealthStatus> {
    const status: StorageHealthStatus = {
      isReady: false,
      canRead: false,
      canWrite: false,
      canDelete: false
    }

    try {
      status.isReady = await checkSparkKVReady()
      
      if (!status.isReady) {
        status.error = 'Spark KV storage not available - ensure you are logged into GitHub'
        return status
      }

      const testKey = '_health_check_test_key'
      const testValue = { test: true, timestamp: Date.now() }

      try {
        await window.spark.kv.set(testKey, testValue)
        status.canWrite = true
      } catch (error) {
        status.error = `Write failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        return status
      }

      try {
        const retrieved = await window.spark.kv.get(testKey)
        status.canRead = !!retrieved
      } catch (error) {
        status.error = `Read failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        return status
      }

      try {
        await window.spark.kv.delete(testKey)
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
