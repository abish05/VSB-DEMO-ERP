import * as React from 'react'
import { cn } from '@/lib/utils'

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
}

export function Avatar({ src, alt, fallback, size = 'md', className, ...props }: AvatarProps) {
  const [error, setError] = React.useState(false)

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full overflow-hidden bg-primary/10',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src && !error ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" onError={() => setError(true)} />
      ) : (
        <span className="font-semibold text-primary select-none">{fallback}</span>
      )}
    </div>
  )
}
