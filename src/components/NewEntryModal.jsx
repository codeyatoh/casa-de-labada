import React, { useMemo, useRef, useState } from 'react'
import { PlusCircleIcon, AlertTriangleIcon, ChevronDownIcon, CheckIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from './Modal'
import {
  SERVICE_LABELS,
  calculatePrice,
  calculateCycles,
  calculateBalance,
  calculateStatus,
  validateEntry,
} from '../types/ledger'
import { checkOrNumberExists } from '../services/db'

export function NewEntryModal({
  isOpen,
  onClose,
  onSubmit,
}) {
  const initialFieldRef = useRef(null)
  const [orNumber, setOrNumber] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [weight, setWeight] = useState('')
  const [category, setCategory] = useState('RC')
  const [payment, setPayment] = useState('')
  const [errors, setErrors] = useState({})
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const { calculatedAccount, calculatedCycles, warning } = useMemo(() => {
    const w = parseFloat(weight)
    if (isNaN(w) || w <= 0)
      return {
        calculatedAccount: 0,
        calculatedCycles: 1,
        warning: null,
      }
    const account = calculatePrice(w, category)
    const cycles = calculateCycles(w, category)
    let warn = null
    if (category === 'RC' && w > 8.5) {
      warn = `Weight exceeds 8.5kg. Automatically split into ${cycles} cycles.`
    } else if (category === 'C' && w > 3.0) {
      warn = `Comforter exceeds 3kg per cycle. Automatically split into ${cycles} cycles.`
    }
    return {
      calculatedAccount: account,
      calculatedCycles: cycles,
      warning: warn,
    }
  }, [weight, category])

  const calculatedBalance = useMemo(() => {
    const p = parseFloat(payment)
    if (isNaN(p)) return calculatedAccount
    return calculateBalance(calculatedAccount, p)
  }, [payment, calculatedAccount])

  const calculatedStatus = useMemo(() => {
    const p = parseFloat(payment)
    if (isNaN(p)) return 'UNPAID'
    return calculateStatus(calculatedAccount, p)
  }, [payment, calculatedAccount])

  const resetForm = () => {
    setOrNumber('')
    setCustomerName('')
    setWeight('')
    setCategory('RC')
    setPayment('')
    setErrors({})
  }

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}

    // Validate OR#
    if (!orNumber.trim()) {
      newErrors.orNumber = 'OR# is required (from receipt)'
    } else {
      // Real-time check against the full database (including claimed/voided records)
      setIsSubmitting(true)
      try {
        const exists = await checkOrNumberExists(orNumber.trim())
        if (exists) {
          newErrors.orNumber = 'This OR# already exists in the records'
          toast.warning(`OR# ${orNumber.trim()} already exists in records.`)
        }
      } catch {
        newErrors.orNumber = 'Could not verify OR#. Please try again.'
        toast.error('Network error. Could not verify OR#.')
      } finally {
        setIsSubmitting(false)
      }
    }

    const validationErrors = validateEntry(
      {
        customerName,
        weight: parseFloat(weight),
        payment: parseFloat(payment) || 0,
        orNumber: orNumber.trim(),
      },
      [],
    )
    delete validationErrors.orNumber

    // Payment cannot exceed total price
    const p = parseFloat(payment) || 0
    if (calculatedAccount > 0 && p > calculatedAccount) {
      validationErrors.payment = `Cannot exceed total price of P${calculatedAccount.toFixed(2)}`
    }

    const allErrors = {
      ...newErrors,
      ...validationErrors,
    }

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors)
      return
    }

    onSubmit({
      orNumber: orNumber.trim(),
      customerName: customerName.trim(),
      weight: parseFloat(weight),
      category,
      cycles: calculatedCycles,
      accountAmount: calculatedAccount,
      advancePayment: parseFloat(payment) || 0,
    })
    resetForm()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={(
        <span className="flex items-center gap-2">
          <PlusCircleIcon className="w-5 h-5 text-cyan-500" aria-hidden="true" />
          <span>Add Customer</span>
        </span>
      )}
      initialFocusRef={initialFieldRef}
      footer={(
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono font-medium text-sm py-2.5 rounded-lg transition-colors border border-zinc-700 min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="new-entry-form"
            disabled={isSubmitting}
            className="flex-1 bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-600/50 text-black font-mono font-bold text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm min-h-[44px]"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <PlusCircleIcon className="w-4 h-4" aria-hidden="true" />
            )}
            {isSubmitting ? 'Checking...' : 'Add Customer'}
          </button>
        </div>
      )}
    >
      <form id="new-entry-form" onSubmit={handleSubmit} className="space-y-4">
          {/* OR# */}
          <div className="space-y-1.5">
            <label
              htmlFor="entry-or"
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-medium block"
            >
              OR# (Receipt Number)
            </label>
            <input
              id="entry-or"
              type="text"
              value={orNumber}
              onChange={(e) => setOrNumber(e.target.value)}
              ref={initialFieldRef}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 px-3 font-mono text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              placeholder="e.g. 001"
              autoFocus
            />
            {errors.orNumber && (
              <p className="font-mono text-[10px] text-red-400">
                {errors.orNumber}
              </p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="entry-name"
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-medium block"
            >
              Customer Name
            </label>
            <input
              id="entry-name"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 px-3 font-mono text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              placeholder="e.g. Maria Santos"
            />
            {errors.customerName && (
              <p className="font-mono text-[10px] text-red-400">
                {errors.customerName}
              </p>
            )}
          </div>

          {/* Weight + Service */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                htmlFor="entry-weight"
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-medium block"
              >
                How heavy? (kg)
              </label>
              <input
                id="entry-weight"
                type="number"
                step="0.1"
                min="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 px-3 font-mono text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                placeholder="5.0"
              />
              {errors.weight && (
                <p className="font-mono text-[10px] text-red-400">
                  {errors.weight}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-medium block"
              >
                Service Type
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 px-3 font-mono text-sm text-white flex items-center justify-between focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                >
                  <span>
                    <span className="text-cyan-400 font-bold">{category}</span>
                    {' '}
                    <span className="text-zinc-400">— {SERVICE_LABELS[category]}</span>
                  </span>
                  <ChevronDownIcon className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute z-50 mt-1.5 w-full bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden">
                    {Object.entries(SERVICE_LABELS).map(([code, label]) => {
                      const colors = {
                        RC: 'text-sky-400',
                        HI: 'text-violet-400',
                        C: 'text-amber-400',
                      }
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => { setCategory(code); setIsDropdownOpen(false) }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 font-mono text-sm transition-colors hover:bg-zinc-800 ${
                            category === code ? 'bg-zinc-800' : ''
                          }`}
                        >
                          <span>
                            <span className={`font-bold ${colors[code]}`}>{code}</span>
                            {' '}
                            <span className="text-zinc-400">— {label}</span>
                          </span>
                          {category === code && <CheckIcon className="w-3.5 h-3.5 text-cyan-500" />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Warning Message */}
          {warning && (
            <div className="bg-amber-950/30 border border-amber-900/50 rounded-lg p-3 flex items-start gap-2 animate-slide-up">
              <AlertTriangleIcon className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="font-mono text-[10px] text-amber-400 leading-relaxed">
                {warning}
              </p>
            </div>
          )}

          {/* Auto-calculated Account & Cycles */}
          <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                Total Est. Price
              </span>
              <span className="font-mono text-lg font-bold text-cyan-400">
                P {calculatedAccount.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                No. of Cycles
              </span>
              <span className="font-mono text-sm font-semibold text-zinc-300">
                {calculatedCycles} {calculatedCycles === 1 ? 'Cycle' : 'Cycles'}
              </span>
            </div>
          </div>

          {/* Payment & Change */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                htmlFor="entry-payment"
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-medium block"
              >
                Payment
              </label>
              <input
                id="entry-payment"
                type="number"
                step="0.01"
                min="0"
                max={calculatedAccount > 0 ? calculatedAccount : undefined}
                value={payment}
                onChange={(e) => {
                  const val = e.target.value
                  setPayment(val)
                  // Clear overpayment error when user adjusts
                  if (errors.payment) setErrors((prev) => ({ ...prev, payment: undefined }))
                }}
                onBlur={() => {
                  const p = parseFloat(payment)
                  if (!isNaN(p) && calculatedAccount > 0 && p > calculatedAccount) {
                    setErrors((prev) => ({
                      ...prev,
                      payment: `Cannot exceed total price of P${calculatedAccount.toFixed(2)}`,
                    }))
                  }
                }}
                className={`w-full bg-zinc-800 border rounded-lg py-2.5 px-3 font-mono text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 transition-all ${
                  errors.payment
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-zinc-700 focus:border-cyan-500 focus:ring-cyan-500/20'
                }`}
                placeholder="0.00"
              />
              {errors.payment && (
                <p className="font-mono text-[10px] text-red-400">
                  {errors.payment}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-medium block flex justify-between">
                <span>Balance</span>
                <span
                  className={`text-[9px] px-1.5 rounded-sm ${
                    calculatedStatus === 'PAID'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : calculatedStatus === 'UNPAID'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {calculatedStatus}
                </span>
              </label>
              <div
                className={`w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg py-2.5 px-3 font-mono text-sm ${
                  calculatedBalance > 0 ? 'text-red-400' : 'text-cyan-400'
                } font-medium`}
              >
                P {calculatedBalance.toFixed(2)}
              </div>
            </div>
          </div>

      </form>
    </Modal>
  )
}
