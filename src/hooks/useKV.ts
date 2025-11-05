import { useState, useEffect, useCallback } from 'react'
import { storage } from '@/lib/storage'

type SetValueAction<T> = T | ((current: T) => T)

export function useKV<T>(
  key: string,
  defaultValue: T
): [T, (action: SetValueAction<T>) => Promise<void>, () => Promise<void>] {
  const [value, setValue] = useState<T>(defaultValue)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const loadValue = async () => {
      try {
        const stored = await storage.get<T>(key)
        if (stored !== undefined) {
          setValue(stored)
        }
      } catch (error) {
        console.error(`[useKV] Error loading ${key}:`, error)
      } finally {
        setIsInitialized(true)
      }
    }

    loadValue()
  }, [key])

  const setStoredValue = useCallback(
    async (action: SetValueAction<T>) => {
      try {
        const newValue = typeof action === 'function' 
          ? (action as (current: T) => T)(value)
          : action

        setValue(newValue)
        await storage.set(key, newValue)
      } catch (error) {
        console.error(`[useKV] Error setting ${key}:`, error)
        throw error
      }
    },
    [key, value]
  )

  const deleteValue = useCallback(async () => {
    try {
      setValue(defaultValue)
      await storage.delete(key)
    } catch (error) {
      console.error(`[useKV] Error deleting ${key}:`, error)
      throw error
    }
  }, [key, defaultValue])

  return [value, setStoredValue, deleteValue]
}
