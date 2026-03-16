import React from 'react'
import { XIcon, EyeIcon } from 'lucide-react'
import { SERVICE_LABELS } from '../types/ledger'

export function TransactionDetailsModal({
  isOpen,
  onClose,
  entry,
}) {
  if (!isOpen || !entry) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative z-10 w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 animate-scale-in shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-mono text-lg font-semibold text-white flex items-center gap-2">
            <EyeIcon className="w-5 h-5 text-zinc-400" />
            Transaction Details
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-800"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Status Banner */}
          <div className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                Status
              </p>
              <span className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full font-medium border border-blue-500/20">
                {entry.status}
              </span>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                OR Number
              </p>
              <p className="font-mono text-lg font-bold text-white">
                #{entry.orNumber}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                Customer Name
              </p>
              <p className="font-mono text-sm text-zinc-200 font-medium">
                {entry.customerName}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                Date
              </p>
              <p className="font-mono text-sm text-zinc-200 font-medium">
                {new Date(entry.createdAt).toLocaleDateString('en-PH', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="h-px w-full bg-zinc-800" />

          {/* Service Details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                Service
              </p>
              <p className="font-mono text-sm text-zinc-200 font-medium">
                {SERVICE_LABELS[entry.category]}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                Weight
              </p>
              <p className="font-mono text-sm text-zinc-200 font-medium">
                {entry.weight.toFixed(1)} kg
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                Cycles
              </p>
              <p className="font-mono text-sm text-zinc-200 font-medium">
                {entry.cycles}
              </p>
            </div>
          </div>

          <div className="h-px w-full bg-zinc-800" />

          {/* Financials */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="font-mono text-zinc-400">Total Service Price</span>
              <span className="font-mono text-zinc-300">
                P {entry.accountAmount.toFixed(2)}
              </span>
            </div>
            {entry.advancePayment > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="font-mono text-zinc-400">Advance Pay</span>
                <span className="font-mono text-cyan-400">
                  − P {entry.advancePayment.toFixed(2)}
                </span>
              </div>
            )}
            {entry.collection > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="font-mono text-zinc-400">Collected (Upon Claim)</span>
                <span className="font-mono text-cyan-400">
                  − P {entry.collection.toFixed(2)}
                </span>
              </div>
            )}
            <div className="h-px w-full bg-zinc-800" />
            <div className="flex justify-between items-center text-sm">
              <span className="font-mono text-zinc-400 font-semibold">Remaining Balance</span>
              <span className={`font-mono font-semibold ${
                entry.currentBalance > 0 ? 'text-red-400' : 'text-cyan-400'
              }`}>
                P {entry.currentBalance.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-mono font-medium text-sm py-3 rounded-lg transition-colors border border-zinc-700 mt-4"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  )
}
