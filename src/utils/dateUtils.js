import { format, differenceInDays, parseISO, isValid } from 'date-fns';

/**
 * Formats a date string/Date as "dd MMM yyyy"
 * e.g. "15 Aug 2025"
 */
export function formatDate(dateInput) {
  try {
    const d = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (!isValid(d)) return 'Invalid date';
    return format(d, 'dd MMM yyyy');
  } catch {
    return String(dateInput);
  }
}

/**
 * Returns number of full days between a given date and today.
 */
export function getDaysSince(dateInput) {
  try {
    const d = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (!isValid(d)) return 0;
    return differenceInDays(new Date(), d);
  } catch {
    return 0;
  }
}

/**
 * Formats a date+time for event display.
 * e.g. "Fri, 15 Aug 2025 at 09:00 AM"
 */
export function formatEventDateTime(dateStr, timeStr) {
  try {
    const d = parseISO(`${dateStr}T${timeStr || '00:00'}:00`);
    if (!isValid(d)) return `${dateStr} ${timeStr}`;
    return format(d, "EEE, dd MMM yyyy 'at' hh:mm aa");
  } catch {
    return `${dateStr} ${timeStr}`;
  }
}
