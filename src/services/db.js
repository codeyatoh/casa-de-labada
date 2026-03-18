import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
  onSnapshot
} from 'firebase/firestore'
import { db } from '../config/firebase'

const COLLECTION_NAME = 'transactions'

/**
 * Listen to all Orders.
 * Returns an unsubscribe function to detach the listener.
 */
export function subscribeToOrders(callback) {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('status', '!=', 'VOID')
  )

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }))
    // Sort client-side by createdAt descending (newest first)
    data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    callback(data)
  })
}

/**
 * Fetch existing OR Numbers to validate uniqueness before generating a new entry.
 * Note: fetching all orders for this might be heavy long-term; ideally query existence of a specific OR.
 */
export async function checkOrNumberExists(orNumber) {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('orNumber', '==', orNumber)
  )
  const snapshot = await getDocs(q)
  return !snapshot.empty
}

export async function fetchAllForReport() {
  const snapshot = await getDocs(collection(db, COLLECTION_NAME))
  const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  return data
}

/**
 * Add a new Transaction entry to Firestore.
 */
export async function addTransaction(data) {
  return await addDoc(collection(db, COLLECTION_NAME), data)
}

/**
 * Update an existing Transaction.
 */
export async function updateTransaction(id, updates) {
  const docRef = doc(db, COLLECTION_NAME, id)
  return await updateDoc(docRef, updates)
}
