import React from 'react'
import {
  XIcon,
  CalendarIcon,
  CalendarRangeIcon,
  FileTextIcon,
} from 'lucide-react'

export function ReportModal({ isOpen, onClose, onGenerate }) {
  if (!isOpen) return null
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
            <FileTextIcon className="w-5 h-5 text-cyan-500" />
            Generate Report
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-800"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <p className="font-mono text-sm text-zinc-400 mb-6">
          Generates a <strong className="text-zinc-300">complete activity report</strong> for the period — all statuses included: Unpaid, Balance, Paid, Claimed, and Void. Pending items remain visible on the dashboard.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => {
              onGenerate('daily')
              onClose()
            }}
            className="w-full flex items-start gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-800/30 hover:bg-zinc-800 hover:border-cyan-500/50 transition-all group text-left"
          >
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500 group-hover:bg-cyan-500 group-hover:text-black transition-colors">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-mono text-sm font-semibold text-white mb-1">
                Daily Report
              </h3>
              <p className="font-mono text-xs text-zinc-400">
                All today's activity — every status.
              </p>
            </div>
          </button>

          <button
            onClick={() => {
              onGenerate('weekly')
              onClose()
            }}
            className="w-full flex items-start gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-800/30 hover:bg-zinc-800 hover:border-blue-500/50 transition-all group text-left"
          >
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-black transition-colors">
              <CalendarRangeIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-mono text-sm font-semibold text-white mb-1">
                Weekly Summary
              </h3>
              <p className="font-mono text-xs text-zinc-400">
                All activity from the last 7 days.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
