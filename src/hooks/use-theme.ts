import { useEffect } from 'react'
import { useKV } from '@github/spark/hooks'

export function useTheme() {
  const [theme, setTheme] = useKV<'light' | 'dark'>('app-theme', 'dark')

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return { theme, setTheme }
}
