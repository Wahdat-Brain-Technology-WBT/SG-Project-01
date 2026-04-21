import { useState, useEffect } from 'react';
import jalaali from 'jalaali-js';

const DARI_MONTHS = [
  'حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله',
  'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت'
];

const DARI_WEEKDAYS = [
  'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'
];

export function useJalaliDate() {
  const [dateInfo, setDateInfo] = useState({
    formattedDate: '',
    formattedTime: ''
  });

  useEffect(() => {
    const updateDate = () => {
      // Get exact current time in Kabul timezone
      const now = new Date();
      const kabulTimeStr = now.toLocaleString('en-US', { timeZone: 'Asia/Kabul' });
      const kabulDate = new Date(kabulTimeStr);
      
      const jDate = jalaali.toJalaali(kabulDate);
      
      const weekday = DARI_WEEKDAYS[kabulDate.getDay()];
      const day = jDate.jd; // English digits
      const month = DARI_MONTHS[jDate.jm - 1];
      const year = jDate.jy; // English digits
      
      // 12-hour format with English digits
      let hours = kabulDate.getHours();
      const minutes = kabulDate.getMinutes().toString().padStart(2, '0');
      const seconds = kabulDate.getSeconds().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'ب.ظ' : 'ق.ظ';
      
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const hoursStr = hours.toString().padStart(2, '0');
      
      const timeStr = `${hoursStr}:${minutes}:${seconds} ${ampm}`;
      const dateStr = `${weekday}، ${day} ${month} ${year}`;
      
      setDateInfo({
        formattedDate: dateStr,
        formattedTime: timeStr
      });
    };

    updateDate();
    const interval = setInterval(updateDate, 1000);
    return () => clearInterval(interval);
  }, []);

  return dateInfo;
}
