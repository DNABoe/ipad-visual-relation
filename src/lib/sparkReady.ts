export async function waitForSpark(maxWaitMs: number = 5000): Promise<boolean> {
  const startTime = Date.now()
  let lastError: any = null
  
  console.log('[sparkReady] Starting Spark initialization check...')
  console.log('[sparkReady] Current URL:', window.location.href)
  console.log('[sparkReady] window.spark exists:', !!window.spark)
  
  while (Date.now() - startTime < maxWaitMs) {
    try {
      if (window.spark) {
        console.log('[sparkReady] window.spark found')
        console.log('[sparkReady] window.spark.kv exists:', !!window.spark.kv)
        
        if (window.spark.kv) {
          console.log('[sparkReady] window.spark.kv.set type:', typeof window.spark.kv.set)
          console.log('[sparkReady] window.spark.kv.get type:', typeof window.spark.kv.get)
          console.log('[sparkReady] window.spark.kv.keys type:', typeof window.spark.kv.keys)
          console.log('[sparkReady] window.spark.kv.delete type:', typeof window.spark.kv.delete)
          
          if (typeof window.spark.kv.set === 'function' && 
              typeof window.spark.kv.get === 'function' &&
              typeof window.spark.kv.keys === 'function' &&
              typeof window.spark.kv.delete === 'function') {
            try {
              console.log('[sparkReady] Testing KV.keys() access...')
              const keys = await window.spark.kv.keys()
              console.log('[sparkReady] KV.keys() successful! Found', keys.length, 'keys')
              
              console.log('[sparkReady] Testing KV.get() access...')
              await window.spark.kv.get('_spark_init_test')
              console.log('[sparkReady] KV.get() successful!')
              
              console.log('[sparkReady] All KV operations successful!')
              return true
            } catch (error) {
              lastError = error
              console.warn('[sparkReady] KV operation failed:', error)
            }
          } else {
            console.warn('[sparkReady] KV methods not all functions')
          }
        } else {
          console.warn('[sparkReady] window.spark.kv not available')
        }
      } else {
        console.warn('[sparkReady] window.spark not available')
      }
    } catch (error) {
      lastError = error
      console.warn('[sparkReady] Error during check:', error)
    }
    
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  console.error('[sparkReady] Timeout reached after', maxWaitMs, 'ms')
  console.error('[sparkReady] Last error:', lastError)
  console.error('[sparkReady] Final state:', {
    sparkExists: !!window.spark,
    kvExists: !!(window.spark && window.spark.kv),
    sparkKeys: window.spark ? Object.keys(window.spark) : []
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
