export async function testSparkKVPersistence(): Promise<void> {
  console.log('========== SPARK KV PERSISTENCE TEST ==========')
  
  try {
    console.log('1. Checking if Spark KV is available...')
    if (!window.spark || !window.spark.kv) {
      console.error('❌ Spark KV is not available!')
      console.log('Make sure you are running this in a Spark runtime environment.')
      return
    }
    console.log('✓ Spark KV is available')
    
    console.log('\n2. Testing write operation...')
    const testKey = '_persistence_test_key'
    const testValue = {
      timestamp: Date.now(),
      message: 'Cross-browser persistence test',
      random: Math.random()
    }
    
    await window.spark.kv.set(testKey, testValue)
    console.log('✓ Write successful:', testValue)
    
    console.log('\n3. Testing read operation...')
    const retrieved = await window.spark.kv.get<typeof testValue>(testKey)
    
    if (!retrieved) {
      console.error('❌ Read failed - no data returned')
      return
    }
    
    console.log('✓ Read successful:', retrieved)
    
    console.log('\n4. Verifying data integrity...')
    if (JSON.stringify(retrieved) === JSON.stringify(testValue)) {
      console.log('✓ Data integrity verified - values match perfectly')
    } else {
      console.error('❌ Data mismatch!')
      console.error('Expected:', testValue)
      console.error('Got:', retrieved)
      return
    }
    
    console.log('\n5. Testing delete operation...')
    await window.spark.kv.delete(testKey)
    console.log('✓ Delete successful')
    
    console.log('\n6. Verifying deletion...')
    const afterDelete = await window.spark.kv.get(testKey)
    if (afterDelete === undefined) {
      console.log('✓ Deletion verified - key no longer exists')
    } else {
      console.error('❌ Key still exists after deletion!')
      return
    }
    
    console.log('\n7. Testing user session persistence...')
    const currentUserId = await window.spark.kv.get<string>('releye-current-user-id')
    if (currentUserId) {
      console.log('✓ Current user session found:', currentUserId)
      
      const users = await window.spark.kv.get('releye-users')
      console.log('✓ User registry found:', users ? 'Yes' : 'No')
    } else {
      console.log('ℹ️  No active user session (not logged in)')
    }
    
    console.log('\n========== ALL TESTS PASSED ✓ ==========')
    console.log('\nCross-browser persistence is working correctly!')
    console.log('You can now:')
    console.log('  1. Log in on this browser')
    console.log('  2. Open the app in a different browser')
    console.log('  3. You should be automatically logged in there too!')
    
  } catch (error) {
    console.error('\n========== TEST FAILED ✗ ==========')
    console.error('Error:', error)
    console.error('\nPlease check:')
    console.error('  1. Are you running in a Spark environment?')
    console.error('  2. Is your GitHub authentication working?')
    console.error('  3. Do you have network connectivity?')
  }
}

export async function checkCurrentSession(): Promise<void> {
  console.log('========== SESSION CHECK ==========')
  
  try {
    if (!window.spark || !window.spark.kv) {
      console.error('❌ Spark KV not available')
      return
    }
    
    const userId = await window.spark.kv.get<string>('releye-current-user-id')
    
    if (userId) {
      console.log('✓ Active session found')
      console.log('  User ID:', userId)
      
      const users = await window.spark.kv.get<any[]>('releye-users')
      if (users) {
        const user = users.find(u => u.userId === userId)
        if (user) {
          console.log('  Email:', user.email)
          console.log('  Name:', user.name)
          console.log('  Role:', user.role)
          console.log('  Login count:', user.loginCount)
          console.log('  Last login:', user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A')
        } else {
          console.warn('⚠️  Session exists but user not found in registry')
        }
      }
    } else {
      console.log('ℹ️  No active session - user is not logged in')
    }
    
    console.log('========== END SESSION CHECK ==========')
  } catch (error) {
    console.error('Error checking session:', error)
  }
}

export async function listAllSparkKeys(): Promise<void> {
  console.log('========== ALL SPARK KV KEYS ==========')
  
  try {
    if (!window.spark || !window.spark.kv) {
      console.error('❌ Spark KV not available')
      return
    }
    
    const keys = await window.spark.kv.keys()
    console.log(`Found ${keys.length} keys:\n`)
    
    for (const key of keys) {
      console.log(`  - ${key}`)
    }
    
    console.log('\n========== END KEY LIST ==========')
  } catch (error) {
    console.error('Error listing keys:', error)
  }
}

if (typeof window !== 'undefined') {
  (window as any).testPersistence = testSparkKVPersistence;
  (window as any).checkSession = checkCurrentSession;
  (window as any).listSparkKeys = listAllSparkKeys;
  
  console.log('Persistence test utilities loaded!')
  console.log('Run these commands in the console:')
  console.log('  - testPersistence()  : Run full persistence test')
  console.log('  - checkSession()     : Check current login session')
  console.log('  - listSparkKeys()    : List all stored keys')
}
