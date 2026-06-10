export function formatDateReadable(dateString) {
  if (!dateString) return 'Date TBA';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
}

export function formatTimeTo12Hour(timeString) {
  if (!timeString) return 'Time TBA';
  if (timeString.includes('AM') || timeString.includes('PM')) {
    return timeString.toUpperCase();
  }
  try {
    const parts = timeString.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1] || '00';
    const period = hours < 12 ? 'AM' : 'PM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes} ${period}`;
  } catch (error) {
    return timeString;
  }
}

export function formatDate(dateString) {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('en-IN');
  } catch (error) {
    return dateString;
  }
}

export function getDaysSince(dateString) {
  try {
    const date = new Date(dateString);
    return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  } catch (error) {
    return 0;
  }
}

export function formatCurrencyINR(number) {
  return number.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
