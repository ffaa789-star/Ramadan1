import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTodayYMD } from '../dateUtils';
import DailyCheckIn from '../components/DailyCheckIn';
import DailyQuote from '../components/DailyQuote';
import useEntries from '../hooks/useEntries';

export default function DailyPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayYMD);
  const { entries, getEntry, updateEntry, clearEntry, loading } = useEntries();
  const navigate = useNavigate();

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
      {/* ── Page header ── */}
      <div className="daily-header">
        <h1 className="daily-header-title">رفيق رمضان</h1>
        <p className="daily-header-subtitle">رفيقك في رمضان</p>
      </div>

      {/* ── Segmented tab control ── */}
      <div className="seg-tabs">
        <button className="seg-tab active">بطاقة المتابعة اليومية</button>
        <button className="seg-tab" onClick={() => navigate('/report')}>عرض التقويم الشهري</button>
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
