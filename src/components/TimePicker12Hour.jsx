import React from 'react';

export default function TimePicker12Hour({ value, onChange, required, id }) {
  const timeVal = value || '10:00';
  const [hStr, mStr] = timeVal.split(':');
  
  let h24 = parseInt(hStr, 10);
  if (isNaN(h24)) h24 = 10;
  
  const m = mStr || '00';
  const isPM = h24 >= 12;
  
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;

  const handleHour = (e) => {
    let newH12 = parseInt(e.target.value, 10);
    let newH24 = newH12;
    if (isPM && newH12 !== 12) newH24 += 12;
    if (!isPM && newH12 === 12) newH24 = 0;
    onChange(`${newH24.toString().padStart(2, '0')}:${m}`);
  };

  const handleMin = (e) => {
    onChange(`${h24.toString().padStart(2, '0')}:${e.target.value}`);
  };

  const handleAmPm = (e) => {
    const newIsPM = e.target.value === 'PM';
    let newH24 = h24;
    
    if (newIsPM && !isPM) {
      if (h12 !== 12) newH24 = h12 + 12;
      else newH24 = 12;
    } else if (!newIsPM && isPM) {
      if (h12 !== 12) newH24 = h12;
      else newH24 = 0;
    }
    onChange(`${newH24.toString().padStart(2, '0')}:${m}`);
  };

  return (
    <div style={{ display: 'flex', gap: '8px' }} id={id}>
      <select className="form-input" value={h12} onChange={handleHour} required={required} style={{ flex: 1, padding: '0.6rem' }}>
        {[...Array(12)].map((_, i) => (
          <option key={i+1} value={i+1}>{i+1}</option>
        ))}
      </select>
      <select className="form-input" value={m} onChange={handleMin} required={required} style={{ flex: 1, padding: '0.6rem' }}>
        {['00', '15', '30', '45'].map(min => (
          <option key={min} value={min}>{min}</option>
        ))}
      </select>
      <select className="form-input" value={isPM ? 'PM' : 'AM'} onChange={handleAmPm} style={{ flex: 1, padding: '0.6rem' }}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}
