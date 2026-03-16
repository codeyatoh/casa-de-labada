export const SERVICE_LABELS = {
  RC: 'Regular Clothes',
  HI: 'Household Items',
  C: 'Comforter',
}

/**
 * Calculate the price (account) based on weight and category.
 *
 * RC: Tiered cycle-based pricing
 *   - 1.0–6.0 kg = ₱150 (1 cycle)
 *   - 6.1–7.0 kg = ₱175 (1 cycle)
 *   - >7.0 kg = Math.ceil(weight/7) × ₱175
 *
 * HI: ₱60/kg, minimum 2.0kg
 * C:  ₱75/kg, minimum 2.0kg
 */
export function calculatePrice(weight, category) {
  if (weight <= 0) return 0

  if (category === 'RC') {
    if (weight <= 6.0) return 150
    if (weight <= 7.0) return 175
    if (weight <= 8.5) return 190
    const cycles = Math.ceil(weight / 7.0)
    return cycles * 175
  }

  if (category === 'HI') {
    const effectiveWeight = Math.max(weight, 2.0)
    return effectiveWeight * 60
  }

  if (category === 'C') {
    const effectiveWeight = Math.max(weight, 2.0)
    return effectiveWeight * 75
  }

  return 0
}

/**
 * Calculate number of wash cycles.
 *
 * RC: 1 cycle per 7kg (ceil)
 * HI: 1 cycle per 5kg (ceil)
 * C:  1 cycle per 3kg (ceil)
 */
export function calculateCycles(weight, category) {
  if (weight <= 0) return 0

  if (category === 'RC') {
    if (weight <= 8.5) return 1
    return Math.ceil(weight / 7.0)
  }

  if (category === 'HI') {
    return Math.ceil(weight / 5.0)
  }

  if (category === 'C') {
    return Math.ceil(weight / 3.0)
  }

  return 1
}

/**
 * Calculate balance: how much the customer still owes.
 * balance = account - payment - collection
 * If negative (overpaid), clamp to 0.
 */
export function calculateBalance(account, payment, collection = 0) {
  const bal = account - payment - collection
  return bal > 0 ? bal : 0
}

/**
 * Determine transaction status based on payment vs account.
 *
 * totalPaid == 0           → UNPAID
 * totalPaid > 0 && < acct  → BALANCE
 * totalPaid >= acct && collection == 0 → READY  (Fully paid in advance)
 * totalPaid >= acct && collection > 0  → PAID   (Fully paid upon claiming)
 */
export function calculateStatus(account, payment, collection = 0) {
  const totalPaid = payment + collection
  if (totalPaid <= 0) return 'UNPAID'
  if (totalPaid < account) return 'BALANCE'
  if (collection === 0) return 'READY'
  return 'PAID'
}

/**
 * Generate a dateString for Firestore-compatible date queries.
 * Format: "YYYY-MM-DD"
 */
export function toDateString(date = new Date()) {
  return date.toISOString().split('T')[0]
}

/**
 * Validate entry data before saving.
 * Returns an object of field → error message. Empty = valid.
 */
export function validateEntry(data, existingOrNumbers) {
  const errors = {}

  if (!data.customerName.trim()) {
    errors.customerName = 'Customer name is required'
  } else if (data.customerName.trim().length > 50) {
    errors.customerName = 'Name must be 50 characters or less'
  }

  if (!data.weight || data.weight <= 0) {
    errors.weight = 'Weight must be greater than 0'
  } else if (data.weight > 100) {
    errors.weight = 'Weight exceeds maximum limit (100kg)'
  }

  if (data.payment < 0) {
    errors.payment = 'Payment cannot be negative'
  }

  if (existingOrNumbers.includes(data.orNumber)) {
    errors.orNumber = 'OR number must be unique'
  }

  return errors
}
