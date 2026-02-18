import { useState, useMemo } from 'react';
import { getTodayYMD, addDaysYMD, toArabicNumeral } from '../dateUtils';
import DailyCheckIn from '../components/DailyCheckIn';
import useEntries from '../hooks/useEntries';

export default function DailyPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayYMD);
  const [streakGlow, setStreakGlow] = useState(false);
  const { entries, getEntry, updateEntry, clearEntry, loading } = useEntries();

  const currentEntry = getEntry(selectedDate);
  const isToday = selectedDate === getTodayYMD();

  // Compute consecutive submitted-day streak ending at today (or yesterday)
  const streak = useMemo(() => {
    let count = 0;
    let cur = getTodayYMD();
    // If today not submitted, start checking from yesterday
    if (!entries[cur]?.submitted) cur = addDaysYMD(cur, -1);
    while (entries[cur]?.submitted) {
      count++;
      cur = addDaysYMD(cur, -1);
    }
    return count;
  }, [entries]);

  function handleNavigateDate(dateStr) {
    if (dateStr === null) {
      setSelectedDate(getTodayYMD());
    } else {
      setSelectedDate(dateStr);
    }
  }

  function handleUpdate(updated) {
    // Detect fresh submission → trigger streak glow
    if (updated.submitted && !currentEntry.submitted) {
      setStreakGlow(true);
      setTimeout(() => setStreakGlow(false), 900);
    }
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

  return (
    <div className="daily-page">
      {/* ── App title + streak ── */}
      <div className="daily-header">
        <h1 className="daily-header-title">رفيق رمضان</h1>
        {streak > 0 && (
          <span className={`daily-header-streak${streakGlow ? ' glow' : ''}`}>🔥 {toArabicNumeral(streak)} أيام متتالية</span>
        )}
      </div>

      {/* ── Daily check-in ── */}
      <DailyCheckIn
        entry={currentEntry}
        entries={entries}
        onUpdate={handleUpdate}
        selectedDate={selectedDate}
        isToday={isToday}
        onNavigateDate={handleNavigateDate}
        onClearDay={() => clearEntry(selectedDate)}
      />
    </div>
  );
}
