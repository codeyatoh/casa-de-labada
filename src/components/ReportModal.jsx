import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import {
  XIcon,
  CalendarIcon,
  CalendarRangeIcon,
  FileTextIcon,
} from 'lucide-react'
import { format } from 'date-fns'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Calendar } from './ui/calendar'

export function ReportModal({ isOpen, onClose, onGenerate }) {
  // We use a Date object internally for the calendar, default to today's local date
  const [selectedDate, setSelectedDate] = useState(new Date())

  if (!isOpen) return null

  // Format to standard YYYY-MM-DD for consistency and passing to export
  const displayDateStr = format(selectedDate, 'yyyy-MM-dd')
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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

        <div className="mb-6">
          <label className="font-mono text-xs uppercase tracking-widest text-zinc-500 font-medium block mb-2">Select Report Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={`w-full flex items-center justify-between bg-zinc-800/80 border border-zinc-700/80 hover:border-cyan-500/50 hover:bg-zinc-800 rounded-xl px-4 py-3 font-mono text-sm transition-all focus:outline-none focus:ring-2 ring-cyan-500/20 ${
                  selectedDate ? "text-white" : "text-zinc-500"
                }`}
              >
                <span>{selectedDate ? format(selectedDate, "PPP") : "Pick a date"}</span>
                <CalendarIcon className="w-4 h-4 text-zinc-400" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border border-zinc-700/80 shadow-2xl bg-zinc-900 rounded-xl overflow-hidden" align="center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) setSelectedDate(date)
                }}
                disabled={(date) =>
                  date > new Date() || date < new Date("1900-01-01")
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
              onGenerate('daily', displayDateStr)
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
                Activity for the selected date.
              </p>
            </div>
          </button>

          <button
            onClick={() => {
              onGenerate('weekly', displayDateStr)
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
                7 days leading up to the selected date.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
