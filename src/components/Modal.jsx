import React, { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'

/**
 * Responsive, fixed-position modal with body lock and mobile-safe viewport sizing.
 *
 * Layout:
 * - Mobile: bottom sheet / near-full-screen, 95% width
 * - Tablet: centered, ~70% width
 * - Desktop: centered, max-width 500px
 *
 * The internal body area scrolls while header/footer stay pinned.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  initialFocusRef,
}) {
  const dialogRef = useRef(null)

  // Body lock + escape key handling
  useEffect(() => {
    if (!isOpen) return

    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverflow = document.body.style.overflow

    document.documentElement.classList.add('modal-open')

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose?.()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    // Focus management
    const node = initialFocusRef?.current || dialogRef.current
    if (node && typeof node.focus === 'function') {
      node.focus()
    }

    return () => {
      document.documentElement.classList.remove('modal-open')
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, initialFocusRef])

  // Keep focused inputs visible when virtual keyboard appears
  useEffect(() => {
    if (!isOpen) return
    const container = dialogRef.current
    if (!container) return

    const handleFocusIn = (event) => {
      const target = event.target
      if (!(target instanceof HTMLElement)) return
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && target.tagName !== 'SELECT') return

      // Delay slightly so that visual viewport / keyboard has time to animate
      window.requestAnimationFrame(() => {
        try {
          target.scrollIntoView({
            block: 'center',
            behavior: 'smooth',
          })
        } catch {
          // no-op
        }
      })
    }

    container.addEventListener('focusin', handleFocusIn)
    return () => {
      container.removeEventListener('focusin', handleFocusIn)
    }
  }, [isOpen])

  if (!isOpen) return null

  return ReactDOM.createPortal(
    <div
      className="
        modal-viewport
        fixed inset-0 z-[60]
        flex items-end sm:items-center justify-center
        px-3 sm:px-4 py-3 sm:py-6
      "
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-label="Close modal backdrop"
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        className="
          modal-panel
          relative z-[61]
          flex flex-col
          w-full
          max-h-[90vh]
          bg-zinc-900 border border-zinc-800
          rounded-t-2xl sm:rounded-2xl
          shadow-2xl
          animate-slide-up sm:animate-scale-in
          focus:outline-none
        "
        tabIndex={-1}
      >
        {/* Header */}
        {(title || onClose) && (
          <div className="flex items-center justify-between gap-3 px-4 sm:px-6 pt-3.5 sm:pt-4 pb-3 border-b border-zinc-800/70 shrink-0">
            {title ? (
              <h2
                id="modal-title"
                className="font-mono text-sm sm:text-base font-semibold text-white truncate"
              >
                {title}
              </h2>
            ) : (
              <span />
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="
                  h-11 w-11 min-h-[44px] min-w-[44px]
                  inline-flex items-center justify-center
                  rounded-xl
                  text-zinc-400 hover:text-cyan-400
                  hover:bg-zinc-800
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60
                  transition-colors
                "
              >
                <span className="sr-only">Close</span>
                <span aria-hidden="true" className="text-lg font-bold">
                  ×
                </span>
              </button>
            )}
          </div>
        )}

        {/* Body (scrolls independently) */}
        <div className="modal-body flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4">
          {children}
        </div>

        {/* Footer (pinned) */}
        {footer && (
          <div className="border-t border-zinc-800/70 px-4 sm:px-6 py-3 sm:py-4 bg-zinc-900/95 backdrop-blur-sm shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

export default Modal

