import React, { useEffect } from 'react'
import {
  CheckCircleIcon,
  InfoIcon,
  XIcon,
  XCircleIcon,
  AlertTriangleIcon,
} from 'lucide-react'

export function Toast({
  message,
  type = 'success',
  isVisible,
  onClose,
}) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-cyan-950/90 border-cyan-900/50 text-cyan-400'
      case 'error':
        return 'bg-rose-950/90 border-rose-900/50 text-rose-400'
      case 'warning':
        return 'bg-amber-950/90 border-amber-900/50 text-amber-400'
      case 'info':
      default:
        return 'bg-zinc-900/90 border-zinc-800 text-zinc-300'
    }
  }

  const getToastIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
      case 'error':
        return <XCircleIcon className="w-5 h-5 flex-shrink-0" />
      case 'warning':
        return <AlertTriangleIcon className="w-5 h-5 flex-shrink-0" />
      case 'info':
      default:
        return <InfoIcon className="w-5 h-5 flex-shrink-0" />
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[60] animate-slide-up">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border ${getToastStyles()} backdrop-blur-md`}
      >
        {getToastIcon()}
        <p className="font-mono text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="ml-2 p-1 rounded-md hover:bg-black/20 transition-colors"
          aria-label="Close notification"
        >
          <XIcon className="w-4 h-4 opacity-70 hover:opacity-100" />
        </button>
      </div>
    </div>
  )
}
