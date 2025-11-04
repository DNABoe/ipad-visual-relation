export interface StorageAdapter {
  get<T>(key: string): Promise<T | undefined>
  set<T>(key: string, value: T): Promise<void>
  delete(key: string): Promise<void>
  keys(): Promise<string[]>
}

const isSparkAvailable = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof window.spark !== 'undefined' && 
         typeof window.spark.kv !== 'undefined'
}

const localStorageAdapter: StorageAdapter = {
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : undefined
    } catch (error) {
      console.error('localStorage get error:', error)
      return undefined
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('localStorage set error:', error)
      throw error
    }
  },

  async delete(key: string): Promise<void> {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('localStorage delete error:', error)
    }
  },

  async keys(): Promise<string[]> {
    try {
      return Object.keys(localStorage)
    } catch (error) {
      console.error('localStorage keys error:', error)
      return []
    }
  }
}

const sparkKVAdapter: StorageAdapter = {
  async get<T>(key: string): Promise<T | undefined> {
    return await window.spark.kv.get<T>(key)
  },

  async set<T>(key: string, value: T): Promise<void> {
    await window.spark.kv.set(key, value)
  },

  async delete(key: string): Promise<void> {
    await window.spark.kv.delete(key)
  },

  async keys(): Promise<string[]> {
    return await window.spark.kv.keys()
  }
}

export const storage: StorageAdapter = isSparkAvailable() ? sparkKVAdapter : localStorageAdapter
