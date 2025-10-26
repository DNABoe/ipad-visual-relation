import { useEffect } from 'react'

export function useTheme() {
  useEffect(() => {
    document.documentElement.classList.add('dark')
    document.documentElement.style.colorScheme = 'dark'
    document.body.classList.add('dark')
  }, [])

  return { theme: 'dark' as const }
}
