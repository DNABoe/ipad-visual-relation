import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import "@github/spark/spark"

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'

import "./main.css"

console.log('[main.tsx] Spark initialization...')
console.log('[main.tsx] window.spark:', window.spark)

const initializeApp = async () => {
  console.log('[main.tsx] Checking for Spark runtime...')
  
  let retries = 0
  const maxRetries = 50
  
  while (retries < maxRetries) {
    if (window.spark && window.spark.kv) {
      console.log('[main.tsx] Spark runtime detected!')
      break
    }
    
    await new Promise(resolve => setTimeout(resolve, 100))
    retries++
  }
  
  if (!window.spark || !window.spark.kv) {
    console.warn('[main.tsx] Spark runtime not available after', maxRetries * 100, 'ms')
  }
  
  console.log('[main.tsx] Rendering app...')
  createRoot(document.getElementById('root')!).render(
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <App />
    </ErrorBoundary>
  )
}

initializeApp()
