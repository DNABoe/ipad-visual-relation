export interface StorageAdapter {
  get<T>(key: string): Promise<T | undefined>
  set<T>(key: string, value: T): Promise<void>
  delete(key: string): Promise<void>
  keys(): Promise<string[]>
}

export const storage: StorageAdapter = {
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
