export async function waitForSpark(maxWaitMs: number = 5000): Promise<boolean> {
  const startTime = Date.now()
  let lastError: any = null
  let attemptCount = 0
  
  console.log('[sparkReady] Starting Spark initialization check...')
  console.log('[sparkReady] Current URL:', window.location.href)
  console.log('[sparkReady] window.spark exists:', !!window.spark)
  
  while (Date.now() - startTime < maxWaitMs) {
    attemptCount++
    try {
      if (window.spark) {
        console.log(`[sparkReady] Attempt ${attemptCount}: window.spark found`)
        
        if (window.spark.kv) {
          console.log(`[sparkReady] Attempt ${attemptCount}: window.spark.kv exists`)
          
          if (typeof window.spark.kv.set === 'function' && 
              typeof window.spark.kv.get === 'function' &&
              typeof window.spark.kv.keys === 'function' &&
              typeof window.spark.kv.delete === 'function') {
            
            try {
              console.log(`[sparkReady] Attempt ${attemptCount}: Testing KV operations...`)
              await Promise.race([
                window.spark.kv.get('_spark_init_test'),
                new Promise((_, reject) => setTimeout(() => reject(new Error('KV operation timeout')), 3000))
              ])
              
              console.log('[sparkReady] ✓ KV operations successful!')
              return true
            } catch (error) {
              lastError = error
              console.warn(`[sparkReady] Attempt ${attemptCount}: KV operation failed:`, error)
            }
          } else {
            console.warn(`[sparkReady] Attempt ${attemptCount}: KV methods not all functions`)
          }
        } else {
          console.warn(`[sparkReady] Attempt ${attemptCount}: window.spark.kv not available yet`)
        }
      } else {
        console.warn(`[sparkReady] Attempt ${attemptCount}: window.spark not available yet`)
      }
    } catch (error) {
      lastError = error
      console.warn(`[sparkReady] Attempt ${attemptCount}: Error during check:`, error)
    }
    
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  
  console.error('[sparkReady] ✗ Timeout reached after', maxWaitMs, 'ms and', attemptCount, 'attempts')
  console.error('[sparkReady] Last error:', lastError)
  console.error('[sparkReady] Final state:', {
    sparkExists: !!window.spark,
    kvExists: !!(window.spark && window.spark.kv),
    sparkType: typeof window.spark,
    kvType: window.spark ? typeof window.spark.kv : 'N/A'
  })
  
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
