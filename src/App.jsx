import { useState, useEffect, useCallback } from 'react';
import './App.css';
import { getTodayYMD } from './dateUtils';
import DailyQuote from './components/DailyQuote';
import DailyCheckIn from './components/DailyCheckIn';
import Calendar from './components/Calendar';

const STORAGE_KEY = 'ramadan-companion';

function emptyEntry() {
  return {
    prayer: false,
    prayers: {
      fajr: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false,
    },
    prayerDetails: {
      fajr: { jamaa: false, nafila: false },
      dhuhr: { jamaa: false, nafila: false },
      asr: { jamaa: false, nafila: false },
      maghrib: { jamaa: false, nafila: false },
      isha: { jamaa: false, nafila: false },
    },
    quran: false,
    quranPages: null,
    qiyam: false,
    charity: false,
    dhikr: false,
    adhkarDetails: { morning: false, evening: false, duaa: false },
    submitted: false,
    note: '',
  };
}

/** Migrate old entries that lack newer sub-objects */
function migrateEntry(raw) {
  if (!raw) return null;
  const migrated = { ...raw };
  if (!migrated.prayers) {
    migrated.prayers = {
      fajr: !!migrated.prayer,
      dhuhr: !!migrated.prayer,
      asr: !!migrated.prayer,
      maghrib: !!migrated.prayer,
      isha: !!migrated.prayer,
    };
  }
  if (!migrated.prayerDetails) {
    migrated.prayerDetails = {
      fajr: { jamaa: false, nafila: false },
      dhuhr: { jamaa: false, nafila: false },
      asr: { jamaa: false, nafila: false },
      maghrib: { jamaa: false, nafila: false },
      isha: { jamaa: false, nafila: false },
    };
  } else {
    // Rename sunnah → nafila if old format exists
    const pd = migrated.prayerDetails;
    const KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    for (const k of KEYS) {
      if (pd[k] && 'sunnah' in pd[k] && !('nafila' in pd[k])) {
        pd[k] = { jamaa: pd[k].jamaa || false, nafila: pd[k].sunnah || false };
      } else if (pd[k] && !('nafila' in pd[k])) {
        pd[k] = { jamaa: pd[k].jamaa || false, nafila: false };
      }
    }
    // Asr never has nafila
    if (pd.asr) pd.asr.nafila = false;
  }
  if (!migrated.adhkarDetails) {
    migrated.adhkarDetails = { morning: false, evening: false, duaa: false };
  }
  if (migrated.submitted === undefined) {
    migrated.submitted = false;
  }
  return migrated;
}

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const entries = parsed.entries || {};
      // migrate all entries
      const migrated = {};
      for (const key in entries) {
        migrated[key] = migrateEntry(entries[key]);
      }
      return migrated;
    }
  } catch {
    // ignore
  }
  return {};
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ entries }));
}

export default function App() {
  const [entries, setEntries] = useState(loadEntries);
  const [selectedDate, setSelectedDate] = useState(getTodayYMD);
  const [activeTab, setActiveTab] = useState('checkin');
  // Calendar anchor: a Gregorian YMD string used to determine which Hijri month to display
  const [calendarAnchor, setCalendarAnchor] = useState(getTodayYMD);

  useEffect(() => {
    saveEntries(entries);
  }, [entries]);

  const currentEntry = entries[selectedDate] || emptyEntry();
  const isToday = selectedDate === getTodayYMD();

  const updateEntry = useCallback(
    (updated) => {
      setEntries((prev) => ({
        ...prev,
        [selectedDate]: updated,
      }));
    },
    [selectedDate]
  );

  function clearDay() {
    setEntries((prev) => {
      const next = { ...prev };
      delete next[selectedDate];
      return next;
    });
  }

  function handleSelectDate(dateStr) {
    setSelectedDate(dateStr);
    setActiveTab('checkin');
  }

  function handleNavigateDate(dateStr) {
    if (dateStr === null) {
      setSelectedDate(getTodayYMD());
    } else {
      setSelectedDate(dateStr);
    }
  }

  return (
    <>
      {/* Header */}
      <header className="app-header">
        <h1 className="app-title">رفيق رمضان</h1>
        <p className="app-subtitle">رفيقك الروحي في شهر الخير</p>
      </header>

      {/* Navigation */}
      <nav className="nav-tabs">
        <button
          className={`nav-tab ${activeTab === 'checkin' ? 'active' : ''}`}
          onClick={() => setActiveTab('checkin')}
        >
          بطاقة المتابعة اليومية
        </button>
        <button
          className={`nav-tab ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          عرض التقويم الشهري
        </button>
      </nav>

      {/* Daily Quote */}
      <DailyQuote selectedDate={selectedDate} />

      {/* Content */}
      {activeTab === 'checkin' ? (
        <DailyCheckIn
          entry={currentEntry}
          entries={entries}
          onUpdate={updateEntry}
          selectedDate={selectedDate}
          isToday={isToday}
          onNavigateDate={handleNavigateDate}
          onClearDay={clearDay}
        />
      ) : (
        <Calendar
          entries={entries}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          calendarAnchor={calendarAnchor}
          onChangeAnchor={setCalendarAnchor}
        />
      )}
    </>
  );
}
