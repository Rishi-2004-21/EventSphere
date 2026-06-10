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
  
  if (timeString.includes('T')) {
    try {
      const d = new Date(timeString);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
      }
    } catch(e) {}
  }
  
  const timeUpper = timeString.toUpperCase();
  if (timeUpper.includes('AM') || timeUpper.includes('PM')) {
    return timeUpper;
  }
  
  try {
    const parts = timeString.split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1] || '00';
    
    // Some timestamps could include timezone offset like "14:18+05:30", so slice it.
    const cleanMinutes = minutes.substring(0, 2);
    
    const period = hours < 12 ? 'AM' : 'PM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${cleanMinutes} ${period}`;
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
