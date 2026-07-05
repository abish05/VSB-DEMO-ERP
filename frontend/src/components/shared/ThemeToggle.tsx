import { useUIStore } from '@/store/uiStore'
import { Sun, Moon, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useUIStore()

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} title={`Theme: ${theme}`}>
      {theme === 'light' ? (
        <Sun className="w-4 h-4" />
      ) : theme === 'dark' ? (
        <Moon className="w-4 h-4" />
      ) : (
        <Monitor className="w-4 h-4" />
      )}
    </Button>
  )
}
