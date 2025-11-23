import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'

import "./main.css"

let sparkImportAttempted = false

const attemptSparkImport = async () => {
  if (sparkImportAttempted) return
  sparkImportAttempted = true
  
  try {
    await import("@github/spark/spark")
    console.log('[main.tsx] Spark package imported successfully')
  } catch (error) {
    console.log('[main.tsx] Spark package not available - running in standalone mode')
  }
}

const initializeApp = async () => {
  console.log('[main.tsx] Initializing application...')
  
  await attemptSparkImport()
  
  let retries = 0
  const maxRetries = 10
  
  while (retries < maxRetries) {
    if (window.spark && window.spark.kv) {
      console.log('[main.tsx] ✓ Spark runtime detected - enhanced features enabled!')
      break
    }
    
    await new Promise(resolve => setTimeout(resolve, 100))
    retries++
  }
  
  if (!window.spark || !window.spark.kv) {
    console.log('[main.tsx] Running in standalone mode - using localStorage for persistence')
  }
  
  console.log('[main.tsx] Rendering app...')
  createRoot(document.getElementById('root')!).render(
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <App />
    </ErrorBoundary>
  )
}

initializeApp()
