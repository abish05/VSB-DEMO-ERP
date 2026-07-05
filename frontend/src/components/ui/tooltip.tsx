import * as React from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
  children: React.ReactNode
}

interface TooltipTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

interface TooltipContentProps {
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

const TooltipContext = React.createContext<{
  open: boolean
  setOpen: (v: boolean) => void
  triggerRef: React.RefObject<HTMLElement>
}>({ open: false, setOpen: () => {}, triggerRef: { current: null } })

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function Tooltip({ children }: TooltipProps) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLElement>(null)
  return (
    <TooltipContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-flex">{children}</div>
    </TooltipContext.Provider>
  )
}

export function TooltipTrigger({ children, asChild }: TooltipTriggerProps) {
  const { setOpen, triggerRef } = React.useContext(TooltipContext)
  const child = React.Children.only(children) as React.ReactElement
  if (asChild) {
    return React.cloneElement(child, {
      ref: triggerRef,
      onMouseEnter: () => setOpen(true),
      onMouseLeave: () => setOpen(false),
    })
  }
  return (
    <div onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {children}
    </div>
  )
}

export function TooltipContent({ children, side = 'top', className }: TooltipContentProps) {
  const { open } = React.useContext(TooltipContext)
  if (!open) return null
  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }
  return (
    <div className={cn(
      'absolute z-50 whitespace-nowrap bg-popover text-popover-foreground border border-border rounded-lg px-2.5 py-1.5 text-xs shadow-popover pointer-events-none',
      positions[side],
      className
    )}>
      {children}
    </div>
  )
}
