import React, { useMemo, useState } from 'react'
import {
  BanIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CreditCardIcon,
  PackageCheckIcon,
  EyeIcon,
} from 'lucide-react'
import { SERVICE_LABELS } from '../types/ledger'

const DEFAULT_ITEMS_PER_PAGE = 15

export function LedgerTable({
  entries,
  onVoid,
  onSettlePayment,
  onMarkAsClaimed,
  onViewDetails,
  isClaimsSection = false,
  itemsPerPage = DEFAULT_ITEMS_PER_PAGE,
}) {
  const [currentPage, setCurrentPage] = useState(1)

  // Sort entries descending (latest OR# on top)
  const sortedEntries = useMemo(() => [...entries].reverse(), [entries])

  const [prevEntriesLength, setPrevEntriesLength] = useState(entries.length)
  if (entries.length !== prevEntriesLength) {
    setPrevEntriesLength(entries.length)
    setCurrentPage(1)
  }

  // Pagination calculations
  const totalPages = Math.max(
    1,
    Math.ceil(sortedEntries.length / itemsPerPage),
  )
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentRecords = sortedEntries.slice(indexOfFirstItem, indexOfLastItem)

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  return (
    <div
      className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden animate-slide-up shadow-sm"
      style={{
        animationDelay: '300ms',
        animationFillMode: 'both',
      }}
    >
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full font-mono text-sm">
          <thead>
            <tr className="border-b border-zinc-700 bg-zinc-800">
              <th className="text-left py-3 px-4 text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-medium sticky top-0 bg-zinc-800 backdrop-blur-sm">OR#</th>
              <th className="text-left py-3 px-4 text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-medium sticky top-0 bg-zinc-800 backdrop-blur-sm">Name</th>
              <th className="text-left py-3 px-4 text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-medium sticky top-0 bg-zinc-800 backdrop-blur-sm">{isClaimsSection ? 'Placed / Claimed' : 'Date & Time'}</th>
              <th className="text-right py-3 px-4 text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-medium sticky top-0 bg-zinc-800 backdrop-blur-sm">Weight</th>
              <th className="text-center py-3 px-4 text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-medium sticky top-0 bg-zinc-800 backdrop-blur-sm">Item</th>
              <th className="text-center py-3 px-4 text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-medium sticky top-0 bg-zinc-800 backdrop-blur-sm">Cycles</th>
              <th className="text-right py-3 px-4 text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-medium sticky top-0 bg-zinc-800 backdrop-blur-sm">Balance</th>
              <th className="text-right py-3 px-4 text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-medium sticky top-0 bg-zinc-800 backdrop-blur-sm">Advance Pay</th>
              <th className="text-right py-3 px-4 text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-medium sticky top-0 bg-zinc-800 backdrop-blur-sm">Collected</th>

              <th className="text-center py-3 px-4 text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-medium sticky top-0 bg-zinc-800 backdrop-blur-sm">Status</th>
              <th className="text-center py-3 px-4 text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-medium sticky top-0 bg-zinc-800 backdrop-blur-sm min-w-[180px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentRecords.map((entry, index) => {
              const isVoid = entry.status === 'VOID'
              const isClaimed = entry.status === 'CLAIMED'
              const isPaid = entry.status === 'PAID'
              const isReady = entry.status === 'READY'
              const isBalance = entry.status === 'BALANCE'
              const isUnpaid = entry.status === 'UNPAID'
              const bgClass = index % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-950/50'

              return (
                <tr
                  key={entry.id}
                  className={`border-b border-zinc-800/50 transition-colors ${
                    isVoid ? 'opacity-40 bg-zinc-950 line-through text-zinc-600' :
                    isClaimed ? 'bg-zinc-900/80' :
                    isBalance ? 'bg-amber-950/20 border-l-2 border-l-amber-500/50' :
                    isUnpaid ? 'bg-red-950/20 border-l-2 border-l-red-500/50' :
                    `hover:bg-zinc-800/50 ${bgClass}`
                  }`}
                >
                  <td className={`py-3 px-4 font-semibold ${isVoid ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    {entry.orNumber}
                  </td>
                  <td className={`py-3 px-4 font-semibold ${isVoid ? 'text-zinc-600' : 'text-white'}`}>
                    {entry.customerName}
                  </td>
                  <td className={`py-3 px-3 ${isVoid ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    {isClaimsSection ? (
                      <div className="space-y-0.5">
                        <div className="text-[10px] text-zinc-500">
                          <span className="text-zinc-600 uppercase tracking-wider">Placed: </span>
                          {new Date(entry.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        {entry.claimedAt && (
                          <div className="text-[10px] text-blue-400 font-medium">
                            <span className="text-blue-500/60 uppercase tracking-wider">Claimed: </span>
                            {new Date(entry.claimedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}{' '}
                            {new Date(entry.claimedAt).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <div className="text-[10px] text-zinc-400 font-medium">
                          {new Date(entry.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          {new Date(entry.createdAt).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className={`py-3 px-4 text-right ${isVoid ? 'text-zinc-600' : 'text-zinc-300'}`}>
                    {entry.weight.toFixed(1)}kg
                  </td>
                  <td className={`py-3 px-4 text-center ${isVoid ? 'text-zinc-600' : 'text-zinc-300'}`}>
                    {SERVICE_LABELS[entry.category] || entry.category}
                  </td>
                  <td className={`py-3 px-4 text-center ${isVoid ? 'text-zinc-600' : 'text-zinc-300'}`}>
                    {entry.cycles}
                  </td>
                  <td className={`py-3 px-4 text-right font-medium ${isVoid ? 'text-zinc-600' : entry.currentBalance > 0 ? 'text-red-400' : 'text-cyan-400'}`}>
                    P{entry.currentBalance.toFixed(2)}
                  </td>
                  <td className={`py-3 px-4 text-right font-medium ${isVoid ? 'text-zinc-600' : entry.advancePayment > 0 ? 'text-cyan-400' : 'text-zinc-500'}`}>
                    P{entry.advancePayment.toFixed(2)}
                  </td>
                  <td className={`py-3 px-4 text-right font-medium ${isVoid ? 'text-zinc-600' : entry.collection > 0 ? 'text-cyan-400' : 'text-zinc-500'}`}>
                    P{entry.collection.toFixed(2)}
                  </td>

                  <td className="py-3 px-4 text-center">
                    {isVoid ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-500 font-medium no-underline" style={{textDecoration: 'none'}}>
                        Order Cancelled
                      </span>
                    ) : isClaimed ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full font-medium border border-blue-500/20">
                        Claimed
                      </span>
                    ) : isUnpaid ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-white bg-rose-500 px-2 py-0.5 rounded-full font-medium">
                        Unpaid
                      </span>
                    ) : isBalance ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-black bg-amber-500 px-2 py-0.5 rounded-full font-medium">
                        Balance
                      </span>
                    ) : isReady ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-black bg-cyan-400 px-2 py-0.5 rounded-full font-medium">
                        Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-black bg-cyan-500 px-2 py-0.5 rounded-full font-medium">
                        Paid
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {isVoid ? (
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
                        Order Cancelled
                      </span>
                    ) : isClaimed ? (
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => onViewDetails(entry)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-zinc-400 hover:text-white border border-zinc-700 hover:bg-zinc-800 transition-colors text-[10px] uppercase tracking-wider"
                        >
                          <EyeIcon className="w-3.5 h-3.5" /> View Details
                        </button>
                      </div>
                    ) : (isPaid || isReady) ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onMarkAsClaimed(entry.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:bg-blue-500/10 transition-colors text-[10px] uppercase tracking-wider"
                        >
                          <PackageCheckIcon className="w-3.5 h-3.5" /> Claim
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onSettlePayment(entry)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-cyan-500 hover:text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/10 transition-colors text-[10px] uppercase tracking-wider"
                        >
                          <CreditCardIcon className="w-3.5 h-3.5" /> Settle
                        </button>
                        <button
                          onClick={() => onVoid(entry.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-rose-500 hover:text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 transition-colors text-[10px] uppercase tracking-wider"
                        >
                          <BanIcon className="w-3.5 h-3.5" /> Void
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-zinc-800">
        {currentRecords.map((entry) => {
          const isVoid = entry.status === 'VOID'
          const isClaimed = entry.status === 'CLAIMED'
          const isPaid = entry.status === 'PAID'
          const isReady = entry.status === 'READY'
          const isBalance = entry.status === 'BALANCE'
          const isUnpaid = entry.status === 'UNPAID'

          return (
            <div
              key={entry.id}
              className={`p-4 space-y-3 ${isVoid ? 'opacity-40 bg-zinc-950' : isClaimed ? 'bg-zinc-900/80' : isBalance ? 'bg-amber-950/20 border-l-2 border-l-amber-500/50' : isUnpaid ? 'bg-red-950/20 border-l-2 border-l-red-500/50' : 'bg-zinc-900'}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className={`text-xs text-zinc-400 font-semibold ${isVoid ? 'line-through' : ''}`}>
                    OR# {entry.orNumber}
                  </span>
                  <p className={`text-white font-semibold text-sm ${isVoid ? 'line-through text-zinc-600' : ''}`}>
                    {entry.customerName}
                  </p>
                  {isClaimsSection ? (
                    <div className="mt-1 space-y-0.5">
                      <p className="text-[10px] text-zinc-500">
                        Placed: {new Date(entry.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      {entry.claimedAt && (
                        <p className="text-[10px] text-blue-400">
                          Claimed: {new Date(entry.claimedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}{' '}
                          {new Date(entry.claimedAt).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-1 text-[10px] text-zinc-500">
                      {new Date(entry.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}{' '}
                      {new Date(entry.createdAt).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {isVoid ? (
                    <span className="text-[10px] uppercase tracking-wider text-zinc-400 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-full">
                      Void
                    </span>
                  ) : isClaimed ? (
                    <span className="text-[10px] uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                      Claimed
                    </span>
                  ) : isUnpaid ? (
                    <span className="text-[10px] uppercase tracking-wider text-white bg-rose-500 px-2 py-0.5 rounded-full">
                      Unpaid
                    </span>
                  ) : isBalance ? (
                    <span className="text-[10px] uppercase tracking-wider text-black bg-amber-500 px-2 py-0.5 rounded-full">
                      Balance
                    </span>
                  ) : isReady ? (
                    <span className="text-[10px] uppercase tracking-wider text-black bg-cyan-400 px-2 py-0.5 rounded-full">
                      Paid
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wider text-black bg-cyan-500 px-2 py-0.5 rounded-full">
                      Paid
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase">Weight</span>
                  <p className={`text-zinc-300 ${isVoid ? 'line-through' : ''}`}>
                    {entry.weight.toFixed(1)}kg
                  </p>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase">Item</span>
                  <p className={`text-zinc-300 text-xs ${isVoid ? 'line-through' : ''}`}>
                    {SERVICE_LABELS[entry.category] || entry.category}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase">Advance Pay</span>
                  <p className={`font-medium text-cyan-400 ${isVoid ? 'line-through text-zinc-600' : ''}`}>
                    P{entry.advancePayment.toFixed(0)}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase">Collected</span>
                  <p className={`font-medium ${entry.collection > 0 ? 'text-cyan-400' : 'text-zinc-500'} ${isVoid ? 'line-through text-zinc-600' : ''}`}>
                    P{entry.collection.toFixed(0)}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase">Balance</span>
                  <p className={`font-medium ${entry.currentBalance > 0 ? 'text-red-400' : 'text-cyan-400'} ${isVoid ? 'line-through text-zinc-600' : ''}`}>
                    P{entry.currentBalance.toFixed(0)}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                {isVoid ? (
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium w-full text-center py-1">
                    Order Cancelled
                  </span>
                ) : isClaimed ? (
                  <button
                    onClick={() => onViewDetails(entry)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-zinc-400 hover:text-white border border-zinc-700 hover:bg-zinc-800 transition-colors text-[10px] uppercase tracking-wider"
                  >
                    <EyeIcon className="w-3.5 h-3.5" /> View Details
                  </button>
                ) : (isPaid || isReady) ? (
                  <button
                    onClick={() => onMarkAsClaimed(entry.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:bg-blue-500/10 transition-colors text-[10px] uppercase tracking-wider"
                  >
                    <PackageCheckIcon className="w-3.5 h-3.5" /> Claim
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => onSettlePayment(entry)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-cyan-500 hover:text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/10 transition-colors text-[10px] uppercase tracking-wider"
                    >
                      <CreditCardIcon className="w-3.5 h-3.5" /> Settle
                    </button>
                    <button
                      onClick={() => onVoid(entry.id)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-rose-500 hover:text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 transition-colors text-[10px] uppercase tracking-wider"
                    >
                      <BanIcon className="w-3.5 h-3.5" /> Void
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {sortedEntries.length === 0 && (
        <div className="py-16 text-center flex flex-col items-center justify-center">
          <SparklesIcon className="w-8 h-8 text-zinc-700 mb-3" />
          <p className="font-mono text-sm text-zinc-400 font-medium">
            {isClaimsSection ? 'No claimed orders yet.' : 'No active transactions.'}
          </p>
          {!isClaimsSection && (
            <p className="font-mono text-[10px] text-zinc-600 mt-1">
              Add your first customer to get started
            </p>
          )}
        </div>
      )}

      {/* Pagination Bar */}
      {sortedEntries.length > itemsPerPage && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800 bg-zinc-900">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={`flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded-md border transition-colors ${
              currentPage === 1 ? 'border-zinc-800 text-zinc-600 cursor-not-allowed' : 'border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <ChevronLeftIcon className="w-3.5 h-3.5" />
            Previous
          </button>

          <span className="font-mono text-xs text-zinc-400">
            Page <span className="text-white font-semibold">{currentPage}</span>{' '}
            of <span className="text-white font-semibold">{totalPages}</span>
          </span>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded-md border transition-colors ${
              currentPage === totalPages ? 'border-zinc-800 text-zinc-600 cursor-not-allowed' : 'border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            Next
            <ChevronRightIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
