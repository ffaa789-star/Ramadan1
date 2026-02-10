import { useState } from 'react';
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

// toArabicNumeral + formatHijriFromYMD → imported from dateUtils

function allPrayersDone(prayers) {
  return prayers && INDIVIDUAL_PRAYERS.every((p) => prayers[p.key]);
}

export default function DailyCheckIn({ entry, onUpdate, selectedDate, isToday, onNavigateDate, onClearDay }) {
  const [showReflection, setShowReflection] = useState(false);
  const [prayerExpanded, setPrayerExpanded] = useState(false);

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
    }
    onUpdate(updated);
  }

  function handleQuranPages(value) {
    const pages = value === '' ? null : Math.max(0, parseInt(value) || 0);
    onUpdate({ ...entry, quranPages: pages });
  }

  function handleNote(value) {
    onUpdate({ ...entry, note: value });
  }

  // Timezone-safe Gregorian display
  const dateNoon = parseYMDToLocalNoon(selectedDate);
  const gregorianDate = dateNoon.toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Hijri date (display only — never used for storage/navigation)
  const hijriDate = formatHijriFromYMD(selectedDate);

  return (
    <div>
      {/* Date Selector */}
      <div className="date-selector">
        <button
          className="date-arrow"
          onClick={() => onNavigateDate(addDaysYMD(selectedDate, +1))}
        >
          ←
        </button>
        <div className="date-display">
          {hijriDate && <div className="date-hijri">{hijriDate}</div>}
          <div className="date-gregorian">{gregorianDate}</div>
          {isToday && <span className="date-today-badge">اليوم</span>}
        </div>
        <button
          className="date-arrow"
          onClick={() => onNavigateDate(addDaysYMD(selectedDate, -1))}
        >
          →
        </button>
      </div>

      {/* Habits Card */}
      <div className="card">
        <div className="card-title">المتابعة اليومية</div>

        <div className="habits-list">
          {HABITS.map((habit) => (
            <div key={habit.key}>
              {/* Main habit row */}
              <div
                className={`habit-row ${entry[habit.key] ? 'completed' : ''} ${habit.key === 'prayer' ? 'prayer-main' : ''}`}
                onClick={() => {
                  if (habit.key === 'prayer') {
                    setPrayerExpanded((prev) => !prev);
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
                  </span>
                </div>
                <div className="habit-row-actions">
                  {habit.key === 'prayer' && (
                    <span className={`prayer-chevron ${prayerExpanded ? 'expanded' : ''}`}>
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

              {/* Quran pages input */}
              {habit.key === 'quran' && entry.quran && (
                <div className="quran-pages-input">
                  <label>كم صفحة قرأت؟</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="عدد الصفحات"
                    value={entry.quranPages ?? ''}
                    onChange={(e) => handleQuranPages(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Progress */}
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
    </div>
  );
}
