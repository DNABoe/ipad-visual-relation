export async function waitForSpark(maxWaitMs: number = 5000): Promise<boolean> {
  const startTime = Date.now()
  
  while (Date.now() - startTime < maxWaitMs) {
    if (window.spark && window.spark.kv && typeof window.spark.kv.set === 'function') {
      try {
        await window.spark.kv.keys()
        return true
      } catch (error) {
        console.warn('[sparkReady] KV not ready yet:', error)
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return false
}

export function isSparkAvailable(): boolean {
  return !!(
    window.spark &&
    window.spark.kv &&
    typeof window.spark.kv.set === 'function' &&
    typeof window.spark.kv.get === 'function'
  )
}
