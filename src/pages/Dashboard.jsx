import React, { useMemo, useState, useEffect } from 'react'
import {
  RefreshCwIcon,
  PlusCircleIcon,
  FileTextIcon,
  CalendarIcon,
  ActivityIcon,
  WalletIcon,
  ClockIcon,
  LogOutIcon,
  PackageCheckIcon,
  HeartIcon,
  SearchIcon,
  ChevronDownIcon,
  BookOpenIcon,
} from 'lucide-react'
import { Logo } from '../components/Logo'
import { BentoCard } from '../components/BentoCard'
import { LedgerTable } from '../components/LedgerTable'
import { NewEntryModal } from '../components/NewEntryModal'
import { SettlePaymentModal } from '../components/SettlePaymentModal'
import { TransactionDetailsModal } from '../components/TransactionDetailsModal'
import { ReportModal } from '../components/ReportModal'
import { ClaimConfirmationModal } from '../components/ClaimConfirmationModal'
import { useLedgerStore } from '../hooks/useLedgerStore'
import { exportToPDF } from '../components/ExportUtils'
import { fetchAllForReport } from '../services/db'
import { toast } from 'sonner'

export function Dashboard({ onLogout }) {
  const {
    entries,
    stats,
    addEntry,
    voidEntry,
    settlePayment,
    markAsClaimed,
  } = useLedgerStore()

  // Modals State
  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [settlePaymentEntry, setSettlePaymentEntry] = useState(null)
  const [viewDetailsEntry, setViewDetailsEntry] = useState(null)
  const [claimEntry, setClaimEntry] = useState(null)

  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formattedDateTime = currentTime.toLocaleString('en-PH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit'
  })

  // Split entries into active and claimed
  const [searchQuery, setSearchQuery] = useState('')
  const [showGuide, setShowGuide] = useState(false)

  const activeOrders = useMemo(
    () => entries.filter((e) => e.status !== 'CLAIMED'),
    [entries],
  )
  const claimedOrders = useMemo(
    () => entries.filter((e) => e.status === 'CLAIMED'),
    [entries],
  )

  // Filter active orders by search query (OR#, Name)
  const filteredActiveOrders = useMemo(() => {
    if (!searchQuery.trim()) return activeOrders
    const q = searchQuery.toLowerCase()
    return activeOrders.filter(
      (e) =>
        e.customerName.toLowerCase().includes(q) ||
        e.orNumber.toLowerCase().includes(q),
    )
  }, [activeOrders, searchQuery])

  const handleGenerateReport = async (type) => {
    // Fetch ALL records directly from Firestore — including VOID/cancelled
    let allRecords
    try {
      allRecords = await fetchAllForReport()
    } catch {
      toast.error('Failed to fetch records for report.')
      return
    }

    let reportEntries = allRecords
    if (type === 'daily') {
      const todayStr = new Date().toISOString().split('T')[0]
      reportEntries = reportEntries.filter((e) => e.dateString === todayStr)
    } else if (type === 'weekly') {
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      reportEntries = reportEntries.filter(
        (e) => new Date(e.createdAt) >= oneWeekAgo,
      )
    }
    reportEntries.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    if (reportEntries.length === 0) {
      toast.warning('No records found.')
      return
    }
    toast.promise(exportToPDF(reportEntries, type), {
      loading: 'Generating PDF...',
      success: 'PDF downloaded! 📥',
      error: 'PDF export failed.',
    })
  }

  const handleSettlePaymentSubmit = (id, amount) => {
    const entry = entries.find((e) => e.id === id)
    if (!entry) return

    toast.promise(settlePayment(id, amount), {
      loading: 'Processing payment...',
      success: `OR #${entry.orNumber} payment updated.`,
      error: 'Failed to update payment.',
    })
  }

  const handleMarkAsClaimed = (id) => {
    const entry = entries.find((e) => e.id === id)
    setClaimEntry(entry)
  }

  const confirmClaim = (id) => {
    const entry = entries.find((e) => e.id === id)
    if (!entry) return

    toast.promise(markAsClaimed(id), {
      loading: 'Claiming order...',
      success: `OR #${entry.orNumber} claimed.`,
      error: 'Failed to claim order.',
    })
    setClaimEntry(null)
  }

  const handleVoid = (id) => {
    const entry = entries.find((e) => e.id === id)
    if (!entry) return

    toast.promise(voidEntry(id), {
      loading: 'Voiding order...',
      success: `OR #${entry.orNumber} voided.`,
      error: 'Failed to void order.',
    })
  }

  return (
    <div className="min-h-screen w-full bg-black animate-scale-in pb-16">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(16,185,129,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.4) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* Header */}
        <header className="bg-zinc-900/90 backdrop-blur border-b border-zinc-800 sticky top-0 z-40 shadow-sm">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
            <Logo size="sm" />

            <div className="hidden sm:flex items-center gap-2 text-zinc-500">
              <CalendarIcon className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="font-mono text-xs">{formattedDateTime}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-lg px-3 py-2 transition-colors font-mono text-xs"
                aria-label="Generate Report"
              >
                <FileTextIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Generate Report</span>
              </button>
              <div className="w-px h-5 bg-zinc-700 mx-1 hidden sm:block" aria-hidden="true" />
              <button
                onClick={onLogout}
                className="flex items-center gap-2 p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-900/20 transition-colors font-mono text-xs w-full sm:w-auto"
                aria-label="Log out"
              >
                <LogOutIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 space-y-8">
          {/* Bento Stats Grid */}
          <section aria-label="Daily statistics">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <BentoCard
                title="Loads Done"
                value={stats.serviceVolume}
                icon={<RefreshCwIcon className="w-4 h-4" />}
                accent="default"
                subtitle="Wash & dry loads today"
                animationDelay="0ms"
              />
              <BentoCard
                title="Cash Collected"
                value={`P${stats.totalRevenue.toFixed(2)}`}
                icon={<WalletIcon className="w-4 h-4" />}
                accent="ocean"
                subtitle="Total cash received today"
                animationDelay="100ms"
              />
              <BentoCard
                title="Unpaid Balance"
                value={`P${stats.totalReceivables.toFixed(2)}`}
                icon={<ClockIcon className="w-4 h-4" />}
                accent="seafoam"
                subtitle="Still owed by customers"
                animationDelay="200ms"
              />
            </div>
          </section>

          {/* How It Works Guide */}
          <section>
            <button
              onClick={() => setShowGuide((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <BookOpenIcon className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                <span className="font-mono text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">
                  How does the system work? &nbsp;<span className="text-zinc-600">— click to {showGuide ? 'hide' : 'show'} guide</span>
                </span>
              </div>
              <ChevronDownIcon
                className={`w-4 h-4 text-zinc-600 transition-transform duration-200 ${showGuide ? 'rotate-180' : ''}`}
              />
            </button>

            {showGuide && (
              <div className="mt-2 rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-6 animate-scale-in">

                {/* Workflow */}
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-3 font-semibold">Workflow</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { step: '1', label: 'Add Customer', color: 'text-zinc-300 bg-zinc-800 border-zinc-700', desc: 'Enter name & weight. Price is auto-computed.' },
                      { step: '2', label: 'Unpaid', color: 'text-red-400 bg-red-900/20 border-red-900/50', desc: 'Customer has not paid yet.' },
                      { step: '3', label: 'Balance', color: 'text-amber-400 bg-amber-900/20 border-amber-900/50', desc: 'Customer paid partial amount.' },
                      { step: '4', label: 'Paid', color: 'text-cyan-400 bg-cyan-900/20 border-cyan-900/50', desc: 'Fully paid. Ready for pickup.' },
                      { step: '5', label: 'Claimed', color: 'text-blue-400 bg-blue-900/20 border-blue-900/50', desc: 'Order picked up and completed.' },
                    ].map((item, i) => (
                        <div key={i} className="flex flex-col border rounded-lg p-3 bg-zinc-800/20" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                          <span className={`inline-block font-mono text-xs font-bold px-2 py-1 rounded border mb-2 w-fit ${item.color}`}>
                            {item.step}. {item.label}
                          </span>
                          <p className="font-mono text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="border-t border-zinc-800" />

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {/* Actions Guide */}
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-3 font-semibold">Actions</p>
                    <div className="space-y-2">
                      {[
                        { btn: 'Settle', color: 'text-cyan-400', desc: 'Record payment & update balance.' },
                        { btn: 'Claim', color: 'text-blue-400', desc: 'Mark order as picked up.' },
                        { btn: 'Void', color: 'text-red-400', desc: 'Cancel a wrong entry.' },
                        { btn: 'View details', color: 'text-zinc-300', desc: 'See full payment breakdown.' },
                      ].map((item) => (
                        <div key={item.btn} className="flex items-start gap-3 bg-zinc-800/40 rounded-lg px-3 py-2.5">
                          <span className={`font-mono text-xs font-bold whitespace-nowrap ${item.color}`}>[{item.btn}]</span>
                          <p className="font-mono text-xs text-zinc-400 mt-0.5">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key Rules */}
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-3 font-semibold">Cheat Sheet</p>
                    <ul className="space-y-3 mt-4">
                      {[
                        '📌 Unclaimed orders stay here daily.',
                        '⚖️ 1 cycle = 1–7 kg. Auto-calculated.',
                        '📄 Reports export all daily transactions.',
                        '🔍 Search by customer name or OR#.',
                      ].map((rule, i) => (
                        <li key={i} className="flex gap-2 font-mono text-xs text-zinc-400">
                          <span className="text-sm">{rule.split(' ')[0]}</span>
                          <span className="mt-0.5">{rule.substring(rule.indexOf(' ') + 1)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

              </div>
            )}
          </section>

          {/* Active Orders Section */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              {/* Left: Title + count badge */}
              <div className="flex items-center gap-2">
                <ActivityIcon className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                <h2 className="font-mono text-sm font-semibold text-white">
                  Today's Orders
                </h2>
                <span className="font-mono text-[10px] text-cyan-400 bg-cyan-500/20 px-2 py-0.5 rounded-full font-medium">
                  {activeOrders.filter((e) => e.status !== 'VOID').length}{' '}active
                </span>
              </div>

              {/* Center: Search bar */}
              <div className="w-full sm:flex-1 sm:min-w-[180px] sm:max-w-xs relative order-last sm:order-none">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search name or OR#..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-9 pr-3 py-2.5 sm:py-2 font-mono text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/60 transition-colors"
                />
              </div>

              {/* Right: Add Customer */}
              <button
                onClick={() => setIsNewEntryModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs py-2.5 sm:py-2 px-4 rounded-lg transition-colors shadow-sm w-full sm:w-auto ml-auto"
              >
                <PlusCircleIcon className="w-4 h-4" aria-hidden="true" />
                <span>Add Customer</span>
              </button>
            </div>

            <LedgerTable
              entries={filteredActiveOrders}
              onVoid={handleVoid}
              onSettlePayment={setSettlePaymentEntry}
              onMarkAsClaimed={handleMarkAsClaimed}
              onViewDetails={setViewDetailsEntry}
              itemsPerPage={6}
            />
          </section>

          {/* Claimed Orders Section */}
          {claimedOrders.length > 0 && (
            <section className="space-y-4 pt-6 border-t border-zinc-800/50">
              <div className="flex items-center gap-2">
                <PackageCheckIcon
                  className="w-4 h-4 text-blue-400"
                  aria-hidden="true"
                />
                <h2 className="font-mono text-sm font-semibold text-white">
                  Claims / Picked Up
                </h2>
                <span className="font-mono text-[10px] text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full font-medium">
                  {claimedOrders.length} completed
                </span>
              </div>

              <LedgerTable
                entries={claimedOrders}
                onVoid={handleVoid}
                onSettlePayment={setSettlePaymentEntry}
                onMarkAsClaimed={handleMarkAsClaimed}
                onViewDetails={setViewDetailsEntry}
                isClaimsSection={true}
                itemsPerPage={3}
              />
            </section>
          )}
        </main>
      </div>

      {/* Fixed Footer */}
      <footer className="fixed bottom-0 left-0 w-full bg-black/80 backdrop-blur-md border-t border-zinc-800 p-3 text-center z-50">
        <p className="font-mono text-xs text-zinc-500">
          CASA DE LABADA v1.0.0 // Made with{' '}
          <HeartIcon className="inline w-3 h-3 text-rose-500 fill-rose-500 animate-pulse mx-1" />{' '}
          in Zamboanga City
        </p>
      </footer>

      {/* Modals */}
      <NewEntryModal
        isOpen={isNewEntryModalOpen}
        onClose={() => setIsNewEntryModalOpen(false)}
        onSubmit={(data) => {
          toast.promise(addEntry(data), {
            loading: 'Creating entry...',
            success: `${data.customerName} added.`,
            error: 'Failed to add customer.',
          })
        }}
      />

      <SettlePaymentModal
        key={settlePaymentEntry ? `settle-${settlePaymentEntry.id}` : 'settle-empty'}
        isOpen={!!settlePaymentEntry}
        onClose={() => setSettlePaymentEntry(null)}
        onSubmit={handleSettlePaymentSubmit}
        entry={settlePaymentEntry}
      />

      <TransactionDetailsModal
        isOpen={!!viewDetailsEntry}
        onClose={() => setViewDetailsEntry(null)}
        entry={viewDetailsEntry}
      />

      <ClaimConfirmationModal
        key={claimEntry ? `claim-${claimEntry.id}` : 'claim-empty'}
        isOpen={!!claimEntry}
        onClose={() => setClaimEntry(null)}
        entry={claimEntry}
        onConfirm={() => confirmClaim(claimEntry.id)}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onGenerate={handleGenerateReport}
      />
    </div>
  )
}
