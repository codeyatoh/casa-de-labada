import React, { useState } from 'react'
import { XIcon, AlertOctagonIcon, PackageCheckIcon } from 'lucide-react'

export function ClaimConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  entry,
}) {
  const [confirmText, setConfirmText] = useState('')

  if (!isOpen || !entry) return null

  const isComplete = confirmText === 'CONFIRM'

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isComplete) {
      onConfirm(entry.id)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative z-10 w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 animate-scale-in shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-mono text-lg font-semibold text-white flex items-center gap-2">
            <PackageCheckIcon className="w-5 h-5 text-blue-400" />
            Confirm Claim
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-800"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6 space-y-4">
          <div className="bg-blue-950/20 rounded-lg p-4 border border-blue-900/30">
            <p className="font-mono text-sm text-zinc-300 mb-2 leading-relaxed">
              You are about to mark order <strong className="text-white">#{entry.orNumber}</strong> for <strong className="text-white">{entry.customerName}</strong> as claimed.
            </p>
            <div className="flex items-start gap-2 mt-4 text-amber-500/90">
              <AlertOctagonIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="font-mono text-[10px] leading-relaxed">
                This item will be removed from the active dashboard and moved to the permanent history records.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="confirm-text"
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-medium block"
              >
                Type <span className="text-white font-bold select-all">CONFIRM</span> to proceed
              </label>
              <input
                id="confirm-text"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                className="w-full bg-zinc-800 border-2 border-zinc-700/50 rounded-lg py-2.5 px-4 font-mono text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all text-center tracking-widest"
                placeholder="CONFIRM"
                autoComplete="off"
                autoFocus
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:flex-[0.8] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono font-medium text-sm py-2.5 rounded-lg transition-colors border border-zinc-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isComplete}
                className={`w-full sm:flex-[1.2] font-mono font-bold text-sm py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm ${
                  isComplete
                    ? 'bg-blue-500 hover:bg-blue-400 text-white cursor-pointer translate-y-0 shadow-blue-500/25 border border-blue-400'
                    : 'bg-zinc-800/50 text-zinc-500 cursor-not-allowed border border-zinc-800'
                }`}
              >
                <PackageCheckIcon className="w-4 h-4" />
                Claim Order
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
