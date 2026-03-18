import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import { XIcon, CreditCardIcon } from 'lucide-react'

export function SettlePaymentModal({
  isOpen,
  onClose,
  onSubmit,
  entry,
}) {
  const [amount, setAmount] = useState(entry ? entry.currentBalance.toString() : '')
  const [error, setError] = useState('')

  if (!isOpen || !entry) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    const paymentAmount = parseFloat(amount)

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      setError('Please enter a valid amount greater than 0.')
      return
    }

    if (paymentAmount > entry.currentBalance) {
      setError(
        `Amount cannot exceed the remaining balance of P${entry.currentBalance.toFixed(2)}.`,
      )
      return
    }

    onSubmit(entry.id, paymentAmount)
    onClose()
  }

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
            <CreditCardIcon className="w-5 h-5 text-cyan-500" />
            Settle Payment
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-cyan-400 transition-colors p-1 rounded-lg hover:bg-zinc-800"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6 space-y-3">
          <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
            <p className="font-mono text-xs text-zinc-400 mb-1">Customer</p>
            <p className="font-mono text-sm text-white font-semibold">
              {entry.customerName}{' '}
              <span className="text-zinc-500 font-normal ml-1">
                (OR# {entry.orNumber})
              </span>
            </p>
          </div>
          <div className="bg-amber-950/20 rounded-lg p-3 border border-amber-900/30 flex justify-between items-center">
            <p className="font-mono text-xs text-amber-500/70 uppercase tracking-wider">
              Remaining Balance
            </p>
            <p className="font-mono text-lg text-amber-400 font-bold">
              P {entry.currentBalance.toFixed(2)}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="payment-amount"
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-medium block"
            >
              Payment Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-sm">
                P
              </span>
              <input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={entry.currentBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 pl-8 pr-3 font-mono text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                placeholder="0.00"
                autoFocus
              />
            </div>
            {error && (
              <p className="font-mono text-[10px] text-red-400 mt-1">{error}</p>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono font-medium text-sm py-2.5 rounded-lg transition-colors border border-zinc-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
