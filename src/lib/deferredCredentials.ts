import { PasswordHash } from './auth'

interface PendingCredentials {
  username: string
  passwordHash: PasswordHash
  timestamp: number
}

let pendingCredentials: PendingCredentials | null = null
let saveRetryTimer: ReturnType<typeof setTimeout> | null = null

export function setPendingCredentials(username: string, passwordHash: PasswordHash) {
  pendingCredentials = {
    username,
    passwordHash,
    timestamp: Date.now()
  }
  console.log('[DeferredCredentials] Credentials set as pending')
}

export function getPendingCredentials(): PendingCredentials | null {
  return pendingCredentials
}

export function clearPendingCredentials() {
  pendingCredentials = null
  if (saveRetryTimer) {
    clearTimeout(saveRetryTimer)
    saveRetryTimer = null
  }
  console.log('[DeferredCredentials] Credentials cleared')
}

export async function attemptSavePendingCredentials(): Promise<boolean> {
  if (!pendingCredentials) {
    console.log('[DeferredCredentials] No pending credentials to save')
    return true
  }

  try {
    if (!window.spark || !window.spark.kv) {
      console.warn('[DeferredCredentials] Spark KV not available yet')
      return false
    }

    console.log('[DeferredCredentials] Attempting to save credentials...')
    
    await Promise.race([
      window.spark.kv.set('user-credentials', {
        username: pendingCredentials.username,
        passwordHash: pendingCredentials.passwordHash
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Save timeout')), 5000)
      )
    ])

    const stored = await window.spark.kv.get<{username: string; passwordHash: PasswordHash}>('user-credentials')
    
    if (!stored || stored.username !== pendingCredentials.username) {
      console.error('[DeferredCredentials] Verification failed after save')
      return false
    }

    console.log('[DeferredCredentials] ✓ Credentials saved and verified!')
    clearPendingCredentials()
    return true
    
  } catch (error) {
    console.error('[DeferredCredentials] Save failed:', error)
    return false
  }
}

export function startAutoRetry(onSuccess?: () => void, maxRetries: number = 10) {
  let retryCount = 0
  
  const retry = async () => {
    if (retryCount >= maxRetries) {
      console.error('[DeferredCredentials] Max retries reached, giving up')
      return
    }

    retryCount++
    console.log(`[DeferredCredentials] Auto-retry attempt ${retryCount}/${maxRetries}`)
    
    const success = await attemptSavePendingCredentials()
    
    if (success) {
      console.log('[DeferredCredentials] ✓ Auto-retry successful!')
      if (onSuccess) {
        onSuccess()
      }
    } else {
      const backoffMs = Math.min(1000 * Math.pow(2, retryCount - 1), 30000)
      console.log(`[DeferredCredentials] Will retry in ${backoffMs}ms`)
      saveRetryTimer = setTimeout(retry, backoffMs)
    }
  }

  retry()
}
