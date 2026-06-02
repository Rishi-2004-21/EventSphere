/**
 * Formats a number as Indian Rupees with always-two decimal places.
 * e.g. 29.9 → ₹29.90 | 1299 → ₹1,299.00 | 0 → Free
 */
export function formatCurrency(amount) {
  const num = parseFloat(amount)
  if (isNaN(num)) return '₹0.00'
  if (num === 0) return 'Free'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

/**
 * Same as formatCurrency but always shows ₹ symbol even for zero.
 * Used in tables and summary rows where "Free" is not appropriate.
 */
export function formatCurrencyAlways(amount) {
  const num = parseFloat(amount)
  if (isNaN(num)) return '₹0.00'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

/**
 * Compact format for large numbers.
 * e.g. 125000 → ₹1.25L | 12500 → ₹12.5K
 */
export function formatCurrencyCompact(amount) {
  const num = parseFloat(amount) || 0
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)}L`
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`
  return formatCurrencyAlways(num)
}

/**
 * Calculates the platform/organizer payment split for a given ticket price.
 * Uses integer arithmetic to avoid floating-point rounding errors.
 *
 * @param {number} price — raw ticket price
 * @returns {{ ticketPrice: number, platformFee: number, organizerReceived: number }}
 *
 * Example: price = 299
 *   platformFee     = Math.round(299 * 10) / 100 = 29.90
 *   organizerReceived = 299 - 29.90             = 269.10
 */
export function calculatePaymentSplit(price) {
  const ticketPrice = Math.round(parseFloat(price) * 100) / 100
  const platformFee = Math.round(ticketPrice * 10) / 100        // exactly 10%
  const organizerReceived = Math.round((ticketPrice - platformFee) * 100) / 100
  return { ticketPrice, platformFee, organizerReceived }
}
