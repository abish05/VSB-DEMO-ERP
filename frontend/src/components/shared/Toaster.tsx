import { useToast } from '@/hooks/use-toast'
import { X, CheckCircle, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'flex items-start gap-3 p-4 rounded-xl border shadow-popover',
              'bg-card text-card-foreground',
              toast.variant === 'destructive' && 'border-error/30 bg-error/5'
            )}
          >
            {toast.variant === 'destructive' ? (
              <AlertCircle className="w-5 h-5 text-error mt-0.5 shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 text-success mt-0.5 shrink-0" />
            )}
            <div className="flex-1">
              {toast.title && <p className="text-sm font-semibold">{toast.title}</p>}
              {toast.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{toast.description}</p>
              )}
            </div>
            <button onClick={() => dismiss(toast.id)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
