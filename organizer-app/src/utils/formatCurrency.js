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
 */
export function calculatePaymentSplit(price) {
  const ticketPrice = Math.round(parseFloat(price) * 100) / 100
  const platformFee = Math.round(ticketPrice * 10) / 100
  const organizerReceived = Math.round((ticketPrice - platformFee) * 100) / 100
  return { ticketPrice, platformFee, organizerReceived }
}
