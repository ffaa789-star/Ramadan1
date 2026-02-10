import { useState, useEffect, useRef } from 'react';
import { parseYMDToLocalNoon, addDaysYMD, formatHijriFromYMD, toArabicNumeral } from '../dateUtils';

const INDIVIDUAL_PRAYERS = [
  { key: 'fajr', name: 'الفجر' },
  { key: 'dhuhr', name: 'الظهر' },
  { key: 'asr', name: 'العصر' },
  { key: 'maghrib', name: 'المغرب' },
  { key: 'isha', name: 'العشاء' },
];

const HABITS = [
  { key: 'prayer', name: 'الصلاة', icon: '🕌' },
  { key: 'quran', name: 'القرآن', icon: '📖' },
  { key: 'qiyam', name: 'قيام الليل', icon: '🌃' },
  { key: 'charity', name: 'التبرع أو فعل الخير', icon: '🤲' },
  { key: 'dhikr', name: 'الأذكار والدعاء', icon: '📿' },
];

const PROGRESS_MESSAGES = [
  'ابدأ يومك بعبادة 💫',
  'خطوة أولى مباركة',
  'أحسنت، واصل!',
  'ما شاء الله، نصف الطريق!',
  'بارك الله فيك، تبقى القليل',
  'يوم مكتمل، تقبّل الله منك ✨',
];

function allPrayersDone(prayers) {
  return prayers && INDIVIDUAL_PRAYERS.every((p) => prayers[p.key]);
}

export default function DailyCheckIn({ entry, onUpdate, selectedDate, isToday, onNavigateDate, onClearDay }) {
  const [showReflection, setShowReflection] = useState(false);
  const [prayerExpanded, setPrayerExpanded] = useState(false);
  const [quranExpanded, setQuranExpanded] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const isFirstRender = useRef(true);

  const prayers = entry.prayers || {
    fajr: false,
    dhuhr: false,
    asr: false,
    maghrib: false,
    isha: false,
  };

  const score = HABITS.reduce((sum, h) => sum + (entry[h.key] ? 1 : 0), 0);
  const percentage = (score / 5) * 100;
  const completedPrayerCount = INDIVIDUAL_PRAYERS.filter((p) => prayers[p.key]).length;

  // Show save toast on entry changes (skip first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setShowSaveToast(true);
    const timer = setTimeout(() => setShowSaveToast(false), 800);
    return () => clearTimeout(timer);
  }, [entry]);

  // Toggle prayer main row: toggles all 5 prayers together
  function togglePrayerMain() {
    const allDone = allPrayersDone(prayers);
    const newVal = !allDone;
    const newPrayers = {};
    INDIVIDUAL_PRAYERS.forEach((p) => {
      newPrayers[p.key] = newVal;
    });
    onUpdate({
      ...entry,
      prayer: newVal,
      prayers: newPrayers,
    });
    if (!allDone) {
      setPrayerExpanded(false);
    }
  }

  // Toggle a single prayer
  function toggleIndividualPrayer(prayerKey) {
    const newPrayers = { ...prayers, [prayerKey]: !prayers[prayerKey] };
    const allDone = INDIVIDUAL_PRAYERS.every((p) => newPrayers[p.key]);
    onUpdate({
      ...entry,
      prayer: allDone,
      prayers: newPrayers,
    });
  }

  // Toggle non-prayer habits
  function toggleHabit(key) {
    const updated = { ...entry, [key]: !entry[key] };
    if (key === 'quran' && !updated.quran) {
      updated.quranPages = null;
      setQuranExpanded(false);
    }
    onUpdate(updated);
  }

  // Quran pages: typing handler
  function handleQuranPages(value) {
    const raw = value === '' ? null : parseInt(value) || 0;
    const pages = raw === null ? null : Math.min(1000, Math.max(0, raw));
    const updated = { ...entry, quranPages: pages };
    // Auto-enable quran if pages > 0
    if (pages !== null && pages > 0) {
      updated.quran = true;
    }
    onUpdate(updated);
  }

  // Quran pages: stepper +/- handler
  function stepQuranPages(delta) {
    const current = entry.quranPages ?? 0;
    const next = Math.min(1000, Math.max(0, current + delta));
    const updated = { ...entry, quranPages: next === 0 ? null : next };
    if (next > 0) {
      updated.quran = true;
    }
    onUpdate(updated);
  }

  function handleNote(value) {
    onUpdate({ ...entry, note: value });
  }

  // WhatsApp share
  function shareWhatsApp() {
    const text = `رفيق رمضان 🌙 — سجّل عباداتك اليومية بسهولة (يُحفظ تلقائياً على جهازك): ${window.location.origin}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  // Copy link
  function copyLink() {
    navigator.clipboard.writeText(window.location.origin).then(() => {
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 800);
    });
  }

  // Hijri date (display only — single source of truth, shown ONCE)
  const hijriDate = formatHijriFromYMD(selectedDate);

  // Gregorian date — use ar-EG to get actual Gregorian (ar-SA would show Hijri again)
  const dateNoon = parseYMDToLocalNoon(selectedDate);
  const gregorianDate = dateNoon.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div>
      {/* Date Selector — compact */}
      <div className="date-selector">
        {/* RTL: first in DOM → renders on RIGHT. Right = backward (prev day), matching month view */}
        <button
          className="date-arrow"
          onClick={() => onNavigateDate(addDaysYMD(selectedDate, -1))}
        >
          →
        </button>
        <div className="date-display">
          {hijriDate && <div className="date-hijri">{hijriDate}</div>}
          <div className="date-gregorian">{gregorianDate}</div>
          {isToday && <span className="date-today-badge">اليوم</span>}
        </div>
        {/* RTL: last in DOM → renders on LEFT. Left = forward (next day), matching month view */}
        <button
          className="date-arrow"
          onClick={() => onNavigateDate(addDaysYMD(selectedDate, +1))}
        >
          ←
        </button>
      </div>

      {/* Habits Card — compact */}
      <div className="card card-compact">
        <div className="habits-list">
          {HABITS.map((habit) => (
            <div key={habit.key}>
              {/* Main habit row */}
              <div
                className={`habit-row ${entry[habit.key] ? 'completed' : ''} ${habit.key === 'prayer' ? 'prayer-main' : ''}`}
                onClick={() => {
                  if (habit.key === 'prayer') {
                    setPrayerExpanded((prev) => !prev);
                  } else if (habit.key === 'quran') {
                    setQuranExpanded((prev) => !prev);
                  } else {
                    toggleHabit(habit.key);
                  }
                }}
              >
                <div className="habit-info">
                  <span className="habit-icon">{habit.icon}</span>
                  <span className="habit-name">
                    {habit.name}
                    {habit.key === 'prayer' && (
                      <span className="prayer-count">
                        {' '}({toArabicNumeral(completedPrayerCount)}/{toArabicNumeral(5)})
                      </span>
                    )}
                    {habit.key === 'quran' && entry.quranPages != null && entry.quranPages > 0 && (
                      <span className="prayer-count">
                        {' '}({toArabicNumeral(entry.quranPages)} صفحة)
                      </span>
                    )}
                  </span>
                </div>
                <div className="habit-row-actions">
                  {(habit.key === 'prayer' || habit.key === 'quran') && (
                    <span className={`prayer-chevron ${
                      (habit.key === 'prayer' && prayerExpanded) || (habit.key === 'quran' && quranExpanded)
                        ? 'expanded'
                        : ''
                    }`}>
                      ‹
                    </span>
                  )}
                  <div
                    className={`habit-toggle ${entry[habit.key] ? 'on' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (habit.key === 'prayer') {
                        togglePrayerMain();
                      } else {
                        toggleHabit(habit.key);
                      }
                    }}
                  >
                    <div className="habit-toggle-knob" />
                  </div>
                </div>
              </div>

              {/* Prayer expansion: 5 individual prayers */}
              {habit.key === 'prayer' && prayerExpanded && (
                <div className="prayer-expansion">
                  {INDIVIDUAL_PRAYERS.map((p) => (
                    <div
                      key={p.key}
                      className={`prayer-mini-row ${prayers[p.key] ? 'completed' : ''}`}
                      onClick={() => toggleIndividualPrayer(p.key)}
                    >
                      <span className="prayer-mini-name">{p.name}</span>
                      <div className={`prayer-mini-toggle ${prayers[p.key] ? 'on' : ''}`}>
                        <div className="prayer-mini-toggle-knob" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quran expansion: pages input with stepper */}
              {habit.key === 'quran' && quranExpanded && (
                <div className="prayer-expansion">
                  <div className="quran-pages-input">
                    <label>كم صفحة قرأت؟</label>
                    <div className="quran-stepper">
                      <button
                        className="quran-stepper-btn"
                        onClick={(e) => { e.stopPropagation(); stepQuranPages(-1); }}
                        disabled={(entry.quranPages ?? 0) <= 0}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="1000"
                        placeholder="٠"
                        value={entry.quranPages ?? ''}
                        onChange={(e) => handleQuranPages(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        className="quran-stepper-btn"
                        onClick={(e) => { e.stopPropagation(); stepQuranPages(+1); }}
                        disabled={(entry.quranPages ?? 0) >= 1000}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Progress — compact */}
        <div className="progress-section">
          <div className="progress-header">
            <span className="progress-label">الإنجاز اليومي</span>
            <span className="progress-score">
              {toArabicNumeral(score)} / {toArabicNumeral(5)}
            </span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${percentage}%` }} />
          </div>
          <div className="progress-message">{PROGRESS_MESSAGES[score]}</div>
        </div>
      </div>

      {/* Reflection */}
      <div className="reflection-section">
        {!showReflection && !entry.note ? (
          <button className="reflection-toggle-btn" onClick={() => setShowReflection(true)}>
            ✏️ إضافة تأمل
          </button>
        ) : (
          <textarea
            className="reflection-textarea"
            placeholder="ما أكثر شيء أثر في قلبك اليوم؟"
            value={entry.note || ''}
            onChange={(e) => handleNote(e.target.value)}
            autoFocus={showReflection && !entry.note}
          />
        )}
      </div>

      {/* Sharing Buttons */}
      <div className="sharing-section">
        <button className="btn btn-whatsapp" onClick={shareWhatsApp}>
          مشاركة التطبيق عبر واتساب
        </button>
        <button className="btn btn-secondary" onClick={copyLink}>
          نسخ رابط التطبيق
        </button>
      </div>

      {/* Actions */}
      <div className="actions-row">
        {!isToday && (
          <button className="btn btn-secondary" onClick={() => onNavigateDate(null)}>
            الانتقال لليوم
          </button>
        )}
        <button className="btn btn-danger" onClick={onClearDay}>
          مسح بيانات اليوم
        </button>
      </div>

      {/* Auto-save notice — at the very bottom */}
      <div className="auto-save-notice">يتم الحفظ تلقائياً على جهازك</div>

      {/* Save Toast */}
      {showSaveToast && (
        <div className="save-toast">✓ تم الحفظ</div>
      )}
    </div>
  );
}
