import { useState, useMemo } from 'react';
import {
  getTodayYMD,
  addDaysYMD,
  formatHijriFromYMD,
  toArabicNumeral,
  parseYMDToLocalNoon,
} from '../dateUtils';
import DailyCheckIn from '../components/DailyCheckIn';
import useEntries from '../hooks/useEntries';

const WEEKDAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export default function DailyPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayYMD);
  const { entries, getEntry, updateEntry, clearEntry, loading } = useEntries();

  const currentEntry = getEntry(selectedDate);
  const isToday = selectedDate === getTodayYMD();

  /* ── Hijri display ── */
  const hijriFull = formatHijriFromYMD(selectedDate);
  // Extract weekday and the rest
  const dt = parseYMDToLocalNoon(selectedDate);
  const weekday = WEEKDAYS_AR[dt.getDay()];

  /* ── Streak ── */
  const streak = useMemo(() => {
    let count = 0;
    let cur = getTodayYMD();
    for (let i = 0; i < 365; i++) {
      if (entries[cur]?.submitted) { count++; cur = addDaysYMD(cur, -1); }
      else break;
    }
    return count;
  }, [entries]);

  function handleNavigateDate(dateStr) {
    setSelectedDate(dateStr === null ? getTodayYMD() : dateStr);
  }

  function handleUpdate(updated) {
    updateEntry(selectedDate, updated);
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <span>جاري التحميل...</span>
      </div>
    );
  }

  // Remove weekday from hijri to avoid duplication since we show it separately
  // hijriFull might be like "الثلاثاء، ١٢ رمضان ١٤٤٦ هـ"
  const hijriDateOnly = hijriFull.replace(/^[^،]+،\s*/, '');

  return (
    <div className="daily-page">
      {/* ── Minimal header ── */}
      <div className="daily-header">
        <div className="daily-header-top">
          <button
            className="daily-nav-arrow"
            onClick={() => handleNavigateDate(addDaysYMD(selectedDate, -1))}
          >
            ‹
          </button>

          <div className="daily-header-center">
            <span className="daily-weekday">{weekday}</span>
            <span className="daily-hijri">{hijriDateOnly}</span>
            {!isToday && (
              <button className="daily-today-pill" onClick={() => handleNavigateDate(null)}>
                العودة لليوم
              </button>
            )}
          </div>

          <button
            className="daily-nav-arrow"
            onClick={() => handleNavigateDate(addDaysYMD(selectedDate, +1))}
          >
            ›
          </button>
        </div>

        {streak > 0 && (
          <div className="daily-streak">
            <span className="daily-streak-fire">🔥</span>
            <span className="daily-streak-num">{toArabicNumeral(streak)}</span>
            <span className="daily-streak-label">يوم متتابع</span>
          </div>
        )}
      </div>

      {/* ── Section title ── */}
      <h2 className="daily-section-title">أعمال اليوم</h2>

      {/* ── Habit cards ── */}
      <DailyCheckIn
        entry={currentEntry}
        onUpdate={handleUpdate}
        onClearDay={() => clearEntry(selectedDate)}
      />
    </div>
  );
}
