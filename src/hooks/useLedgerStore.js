import { useState, useEffect, useCallback } from 'react'
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
  const [stats, setStats] = useState({
    todayLoads: 0,
    todayBilled: 0,
    todayCash: 0,
    allTimeCash: 0,
    allTimeUnpaid: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Listen to all orders real-time and calculate current bounds
  useEffect(() => {
    const unsubscribe = subscribeToOrders((data) => {
      const todayStr = toDateString()
      
      // Calculate stats based on ALL valid data (data is already filtered by non-VOID in subscribeToOrders)
      const allTimeEntries = data

      const todayLoads = allTimeEntries
        .filter((e) => e.dateString === todayStr)
        .reduce((sum, e) => sum + e.cycles, 0)

      const todayBilled = allTimeEntries
        .filter((e) => e.dateString === todayStr)
        .reduce((sum, e) => sum + e.accountAmount, 0)

      const todayCash = allTimeEntries.reduce((sum, e) => {
        const advancePart = e.dateString === todayStr ? e.advancePayment : 0
        const paymentDateStr = e.paidAt ? toDateString(new Date(e.paidAt)) : 
                               (e.updatedAt ? toDateString(new Date(e.updatedAt)) : 
                               (e.claimedAt ? toDateString(new Date(e.claimedAt)) : null))
        const collectedPart = (e.collection > 0 && paymentDateStr === todayStr) ? e.collection : 0
        return sum + advancePart + collectedPart
      }, 0)

      const allTimeCash = allTimeEntries.reduce((sum, e) => sum + e.advancePayment + e.collection, 0)
      const allTimeUnpaid = allTimeEntries.reduce((sum, e) => sum + (e.currentBalance > 0 ? e.currentBalance : 0), 0)

      setStats({
        todayLoads,
        todayBilled,
        todayCash,
        allTimeCash,
        allTimeUnpaid
      })

      // Filter out CLAIMED orders that happened before today to keep the dashboard clean
      const dashboardEntries = data.filter(e => {
        if (e.status !== 'CLAIMED') return true
        // Only show claims that happened today (falling under the 7AM cutoff)
        if (!e.claimedAt) return false
        return toDateString(new Date(e.claimedAt)) === todayStr
      })

      setEntries(dashboardEntries)
      setIsLoading(false)
    })
    return () => unsubscribe()
  }, [])

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
        paidAt: null, // explicit timestamp for when settlement/balance is paid
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
      await updateTransaction(id, { 
        status: 'VOID',
        voidedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
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
        status: newStatus,
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error("Failed to settle payment", error)
      throw error
    }
  }, [entries])

  // --- Mark as Claimed ---
  const markAsClaimed = useCallback(async (id) => {
    try {
      const now = new Date().toISOString()
      await updateTransaction(id, { 
        status: 'CLAIMED', 
        claimedAt: now,
        updatedAt: now
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
    checkOrNumberExists
  }
}
