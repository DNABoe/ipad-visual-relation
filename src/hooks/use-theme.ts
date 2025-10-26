import { useEffect } from 'react'

export function useTheme() {
  useEffect(() => {
    document.documentElement.setAttribute('data-appearance', 'dark')
  }, [])

  return { theme: 'dark' as const }
}
