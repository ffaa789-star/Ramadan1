import { useState, useMemo } from 'react';
import { getTodayYMD, addDaysYMD, toArabicNumeral } from '../dateUtils';
import DailyCheckIn from '../components/DailyCheckIn';
import useEntries from '../hooks/useEntries';

export default function DailyPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayYMD);
  const { entries, getEntry, updateEntry, clearEntry, loading } = useEntries();

  const currentEntry = getEntry(selectedDate);
  const isToday = selectedDate === getTodayYMD();

  // Streak — computed once, passed to header
  const streakCount = useMemo(() => {
    let s = 0, cur = selectedDate;
    for (let i = 0; i < 365; i++) {
      if (entries[cur]?.submitted) { s++; cur = addDaysYMD(cur, -1); }
      else break;
    }
    return s;
  }, [selectedDate, entries]);

  function handleNavigateDate(dateStr) {
    if (dateStr === null) {
      setSelectedDate(getTodayYMD());
    } else {
      setSelectedDate(dateStr);
    }
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

  return (
    <div className="daily-page">
      {/* ── App title + streak ── */}
      <div className="daily-header">
        <h1 className="daily-header-title">رفيق رمضان</h1>
        <p className="daily-header-subtitle">رفيقك في رمضان</p>
        {streakCount > 0 && (
          <div className="daily-header-streak">
            🔥 {toArabicNumeral(streakCount)} يوم متتالي
          </div>
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
