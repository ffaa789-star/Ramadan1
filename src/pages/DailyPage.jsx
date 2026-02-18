import { useState, useMemo, useEffect } from 'react';
import { getTodayYMD, addDaysYMD, toArabicNumeral } from '../dateUtils';
import DailyCheckIn from '../components/DailyCheckIn';
import GuidedTour, { isTourDone, resetTour } from '../components/GuidedTour';
import useEntries from '../hooks/useEntries';

export default function DailyPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayYMD);
  const { entries, getEntry, updateEntry, clearEntry, loading } = useEntries();

  const currentEntry = getEntry(selectedDate);
  const isToday = selectedDate === getTodayYMD();

  // Tour state
  const [tourActive, setTourActive] = useState(false);
  const [tourExpandPrayer, setTourExpandPrayer] = useState(false);

  // Auto-show tour on first visit (after loading completes)
  useEffect(() => {
    if (!loading && !isTourDone()) {
      // Small delay to let the page render first
      const t = setTimeout(() => setTourActive(true), 600);
      return () => clearTimeout(t);
    }
  }, [loading]);

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
    updateEntry(selectedDate, updated);
  }

  function handleRestartTour() {
    resetTour();
    setTourExpandPrayer(false);
    setTourActive(true);
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
      {/* ── App title + streak + help ── */}
      <div className="daily-header">
        <button className="tour-help-btn" onClick={handleRestartTour} aria-label="جولة تعريفية">؟</button>
        <h1 className="daily-header-title">رفيق رمضان</h1>
        {streak > 0 && (
          <span className="daily-header-streak">🔥 {toArabicNumeral(streak)} أيام متتالية</span>
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
        tourExpandPrayer={tourExpandPrayer}
      />

      {/* ── Guided tour overlay ── */}
      {tourActive && (
        <GuidedTour
          active={tourActive}
          onClose={() => { setTourActive(false); setTourExpandPrayer(false); }}
          onExpandPrayer={() => setTourExpandPrayer(true)}
        />
      )}
    </div>
  );
}
