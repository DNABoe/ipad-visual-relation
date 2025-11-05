import { storage } from './storage'

export async function runStorageTests(): Promise<{
  success: boolean
  message: string
  details: string[]
}> {
  const details: string[] = []
  
  try {
    details.push('🔍 Testing Spark KV Storage...')
    
    const health = await storage.checkHealth()
    details.push(`✓ Storage ready: ${health.isReady}`)
    details.push(`✓ Can read: ${health.canRead}`)
    details.push(`✓ Can write: ${health.canWrite}`)
    details.push(`✓ Can delete: ${health.canDelete}`)
    
    if (health.error) {
      details.push(`⚠️ Health check warning: ${health.error}`)
    }
    
    if (!health.isReady || !health.canRead || !health.canWrite || !health.canDelete) {
      return {
        success: false,
        message: 'Storage health check failed',
        details
      }
    }
    
    const testKey = `test-${Date.now()}`
    const testValue = { 
      test: true, 
      timestamp: Date.now(),
      message: 'Storage test successful' 
    }
    
    details.push(`\n📝 Writing test data (key: ${testKey})...`)
    await storage.set(testKey, testValue)
    details.push('✓ Write successful')
    
    details.push('\n📖 Reading test data...')
    const retrieved = await storage.get(testKey)
    details.push(`✓ Read successful: ${JSON.stringify(retrieved)}`)
    
    if (!retrieved || JSON.stringify(retrieved) !== JSON.stringify(testValue)) {
      details.push('❌ Data mismatch!')
      return {
        success: false,
        message: 'Data read/write mismatch',
        details
      }
    }
    
    details.push('\n🗑️ Deleting test data...')
    await storage.delete(testKey)
    details.push('✓ Delete successful')
    
    details.push('\n🔍 Verifying deletion...')
    const afterDelete = await storage.get(testKey)
    if (afterDelete !== undefined) {
      details.push('❌ Data still exists after deletion!')
      return {
        success: false,
        message: 'Delete operation failed',
        details
      }
    }
    details.push('✓ Deletion verified')
    
    details.push('\n✅ All storage tests passed!')
    return {
      success: true,
      message: 'Storage is working correctly',
      details
    }
  } catch (error) {
    details.push(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return {
      success: false,
      message: 'Storage test failed with error',
      details
    }
  }
}

export async function checkStorageAvailability(): Promise<boolean> {
  try {
    return await storage.isReady()
  } catch {
    return false
  }
}
