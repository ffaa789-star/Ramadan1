import { useState } from 'react';
import { getTodayYMD } from '../dateUtils';
import DailyCheckIn from '../components/DailyCheckIn';
import DailyQuote from '../components/DailyQuote';
import useEntries from '../hooks/useEntries';

export default function DailyPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayYMD);
  const { entries, getEntry, updateEntry, clearEntry, loading } = useEntries();

  const currentEntry = getEntry(selectedDate);
  const isToday = selectedDate === getTodayYMD();

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
      {/* ── Page title ── */}
      <div className="daily-header">
        <h1 className="daily-header-title">بطاقة المتابعة اليومية</h1>
      </div>

      {/* ── Daily quote (big green card) ── */}
      <DailyQuote selectedDate={selectedDate} />

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
