"use client"

import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 250)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      data-slot="skeleton"
      className={cn(
        'rounded-md transition-opacity duration-300',
        show ? 'bg-accent animate-pulse opacity-100' : 'opacity-0',
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
