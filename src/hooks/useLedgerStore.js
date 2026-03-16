import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  calculateBalance,
  calculateStatus,
  toDateString,
} from '../types/ledger'
import {
  subscribeToOrders,
  addTransaction,
  updateTransaction,
  checkOrNumberExists
} from '../services/db'

export function useLedgerStore() {
  const [entries, setEntries] = useState([])
  const [existingOrNumbers, setExistingOrNumbers] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Listen to all orders real-time and calculate current bounds
  useEffect(() => {
    const unsubscribe = subscribeToOrders((data) => {
      // Filter out CLAIMED orders that happened before today to keep the dashboard clean
      const todayStr = toDateString()
      const dashboardEntries = data.filter(e => {
        if (e.status !== 'CLAIMED') return true
        // Only show claims that happened today
        return e.claimedAt && e.claimedAt.startsWith(todayStr)
      })

      setEntries(dashboardEntries)
      setExistingOrNumbers(data.map((e) => e.orNumber))
      setIsLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // --- Live Stats Calculation (Bento Grid) ---
  const stats = useMemo(() => {
    // All entries available on the dashboard (Active + Today's Claimed)
    const validEntries = entries.filter((e) => e.status !== 'VOID')

    // Loads Done = total sum of machine cycles for today's visible tickets
    const serviceVolume = validEntries.reduce(
      (sum, e) => sum + e.cycles, 
      0,
    )

    const totalRevenue = validEntries.reduce(
      (sum, e) => sum + e.advancePayment + e.collection, 
      0
    )

    const totalReceivables = validEntries.reduce(
      (sum, e) => sum + (e.currentBalance > 0 ? e.currentBalance : 0),
      0,
    )

    return { serviceVolume, totalRevenue, totalReceivables }
  }, [entries])

  // --- Add Entry ---
  const addEntry = useCallback(
    async (data) => {
      // data already contains calculated account and payment from the modal
      const accountAmount = data.accountAmount
      const advancePayment = data.advancePayment
      const currentBalance = calculateBalance(accountAmount, advancePayment, 0)
      const status = calculateStatus(accountAmount, advancePayment, 0)

      const newEntry = {
        orNumber: data.orNumber,
        customerName: data.customerName,
        weight: data.weight,
        category: data.category,
        cycles: data.cycles,
        accountAmount,
        advancePayment,
        collection: 0,
        currentBalance,
        status,
        createdAt: new Date().toISOString(),
        claimedAt: null,
        dateString: toDateString(),
      }
      
      try {
        await addTransaction(newEntry)
      } catch (error) {
        console.error("Failed to add transaction", error)
        throw error
      }
    },
    [],
  )

  // --- Void Entry ---
  const voidEntry = useCallback(async (id) => {
    try {
      await updateTransaction(id, { status: 'VOID' })
    } catch (error) {
      console.error("Failed to void transaction", error)
      throw error
    }
  }, [])

  // --- Settle Payment ---
  const settlePayment = useCallback(async (id, additionalPayment) => {
    const entry = entries.find(e => e.id === id)
    if (!entry) return

    const newCollection = entry.collection + additionalPayment
    const newBalance = calculateBalance(entry.accountAmount, entry.advancePayment, newCollection)
    const newStatus = calculateStatus(entry.accountAmount, entry.advancePayment, newCollection)

    try {
      await updateTransaction(id, {
        collection: newCollection,
        currentBalance: newBalance,
        status: newStatus
      })
    } catch (error) {
      console.error("Failed to settle payment", error)
      throw error
    }
  }, [entries])

  // --- Mark as Claimed ---
  const markAsClaimed = useCallback(async (id) => {
    try {
      await updateTransaction(id, { 
        status: 'CLAIMED', 
        claimedAt: new Date().toISOString() 
      })
    } catch (error) {
      console.error("Failed to claim transaction", error)
      throw error
    }
  }, [])

  return {
    entries,
    stats,
    isLoading,
    addEntry,
    voidEntry,
    settlePayment,
    markAsClaimed,
    existingOrNumbers,
    checkOrNumberExists
  }
}
