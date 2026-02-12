import { useState, useEffect, useRef, useMemo } from 'react';
import {
  parseYMDToLocalNoon,
  addDaysYMD,
  getTodayYMD,
  formatHijriFromYMD,
  formatHijriDayOnly,
  toArabicNumeral,
} from '../dateUtils';

const INDIVIDUAL_PRAYERS = [
  { key: 'fajr', name: 'الفجر' },
  { key: 'dhuhr', name: 'الظهر' },
  { key: 'asr', name: 'العصر' },
  { key: 'maghrib', name: 'المغرب' },
  { key: 'isha', name: 'العشاء' },
];

const ADHKAR_SUBS = [
  { key: 'morning', name: 'أذكار الصباح' },
  { key: 'evening', name: 'أذكار المساء' },
  { key: 'duaa', name: 'الدعاء' },
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

const EHSAN_LINK = 'https://ehsan.sa/campaign/7116894CC2';

/* Arabic weekday initials for streak boxes */
const WEEKDAY_INITIALS = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];

function allPrayersDone(prayers) {
  return prayers && INDIVIDUAL_PRAYERS.every((p) => prayers[p.key]);
}

/* ── Compact inline checkbox component ── */
function SubCheckbox({ checked, label, onChange }) {
  return (
    <button
      className={`sub-checkbox ${checked ? 'checked' : ''}`}
      onClick={(e) => { e.stopPropagation(); onChange(); }}
    >
      <span className="sub-checkbox-box">{checked ? '✓' : ''}</span>
      <span className="sub-checkbox-label">{label}</span>
    </button>
  );
}

export default function DailyCheckIn({ entry, entries, onUpdate, selectedDate, isToday, onNavigateDate, onClearDay }) {
  const [showReflection, setShowReflection] = useState(false);
  const [prayerExpanded, setPrayerExpanded] = useState(false);
  const [quranExpanded, setQuranExpanded] = useState(false);
  const [adhkarExpanded, setAdhkarExpanded] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const isFirstRender = useRef(true);

  const prayers = entry.prayers || {
    fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false,
  };

  const prayerDetails = entry.prayerDetails || {
    fajr: { jamaa: false, nafila: false },
    dhuhr: { jamaa: false, nafila: false },
    asr: { jamaa: false, nafila: false },
    maghrib: { jamaa: false, nafila: false },
    isha: { jamaa: false, nafila: false },
  };

  const adhkarDetails = entry.adhkarDetails || {
    morning: false, evening: false, duaa: false,
  };

  const score = HABITS.reduce((sum, h) => sum + (entry[h.key] ? 1 : 0), 0);
  const percentage = (score / 5) * 100;
  const completedPrayerCount = INDIVIDUAL_PRAYERS.filter((p) => prayers[p.key]).length;
  const isSubmitted = !!entry.submitted;

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

  /* ── Streak widget data ── */
  const streakData = useMemo(() => {
    const todayYmd = getTodayYMD();
    // Build 5 boxes: -3, -2, -1, 0(selected), +1 relative to selectedDate
    const boxes = [];
    for (let i = -3; i <= 1; i++) {
      const ymd = addDaysYMD(selectedDate, i);
      const dt = parseYMDToLocalNoon(ymd);
      const hijriDay = formatHijriDayOnly(ymd);
      const weekdayIdx = dt.getDay(); // 0=Sun
      const dayEntry = entries[ymd];
      const submitted = dayEntry?.submitted || false;
      const isTodayBox = ymd === todayYmd;
      const isSelected = i === 0;
      boxes.push({ ymd, hijriDay, weekdayInitial: WEEKDAY_INITIALS[weekdayIdx], submitted, isTodayBox, isSelected });
    }
    // Compute streak: consecutive submitted days ending at today (or selectedDate)
    let streak = 0;
    let cur = selectedDate;
    for (let i = 0; i < 365; i++) {
      const e = entries[cur];
      if (e?.submitted) {
        streak++;
        cur = addDaysYMD(cur, -1);
      } else {
        break;
      }
    }
    return { boxes, streak };
  }, [selectedDate, entries]);

  // Toggle prayer main row: toggles all 5 prayers together
  function togglePrayerMain() {
    const allDone = allPrayersDone(prayers);
    const newVal = !allDone;
    const newPrayers = {};
    const newDetails = { ...prayerDetails };
    INDIVIDUAL_PRAYERS.forEach((p) => {
      newPrayers[p.key] = newVal;
      if (!newVal) {
        newDetails[p.key] = { jamaa: false, nafila: false };
      }
    });
    onUpdate({
      ...entry,
      prayer: newVal,
      prayers: newPrayers,
      prayerDetails: newDetails,
    });
    if (!allDone) {
      setPrayerExpanded(false);
    }
  }

  // Toggle a single prayer
  function toggleIndividualPrayer(prayerKey) {
    const newPrayers = { ...prayers, [prayerKey]: !prayers[prayerKey] };
    const newDetails = { ...prayerDetails };
    if (!newPrayers[prayerKey]) {
      newDetails[prayerKey] = { jamaa: false, nafila: false };
    }
    const allDone = INDIVIDUAL_PRAYERS.every((p) => newPrayers[p.key]);
    onUpdate({
      ...entry,
      prayer: allDone,
      prayers: newPrayers,
      prayerDetails: newDetails,
    });
  }

  // Toggle a prayer sub-checkbox (jamaa / nafila)
  function togglePrayerSub(prayerKey, subKey) {
    // For asr, never allow nafila
    if (prayerKey === 'asr' && subKey === 'nafila') return;
    const oldSub = prayerDetails[prayerKey] || { jamaa: false, nafila: false };
    const newSubVal = !oldSub[subKey];
    const newDetails = {
      ...prayerDetails,
      [prayerKey]: { ...oldSub, [subKey]: newSubVal },
    };
    const newPrayers = { ...prayers };
    // If turning a sub ON, auto-enable the prayer
    if (newSubVal && !newPrayers[prayerKey]) {
      newPrayers[prayerKey] = true;
    }
    const allDone = INDIVIDUAL_PRAYERS.every((p) => newPrayers[p.key]);
    onUpdate({
      ...entry,
      prayer: allDone,
      prayers: newPrayers,
      prayerDetails: newDetails,
    });
  }

  // Toggle adhkar sub-item
  function toggleAdhkarSub(subKey) {
    const newAdhkar = { ...adhkarDetails, [subKey]: !adhkarDetails[subKey] };
    const parentDone = ADHKAR_SUBS.some((s) => newAdhkar[s.key]);
    onUpdate({
      ...entry,
      dhikr: parentDone,
      adhkarDetails: newAdhkar,
    });
  }

  // Toggle non-prayer, non-dhikr habits
  function toggleHabit(key) {
    const updated = { ...entry, [key]: !entry[key] };
    if (key === 'quran' && !updated.quran) {
      updated.quranPages = null;
      setQuranExpanded(false);
    }
    if (key === 'dhikr' && !updated.dhikr) {
      updated.adhkarDetails = { morning: false, evening: false, duaa: false };
      setAdhkarExpanded(false);
    }
    onUpdate(updated);
  }

  // Quran pages: typing handler
  function handleQuranPages(value) {
    const raw = value === '' ? null : parseInt(value) || 0;
    const pages = raw === null ? null : Math.min(1000, Math.max(0, raw));
    const updated = { ...entry, quranPages: pages };
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

  // Submit / unsubmit day
  function submitDay() {
    onUpdate({ ...entry, submitted: true });
  }
  function unsubmitDay() {
    onUpdate({ ...entry, submitted: false });
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

  // Hijri date
  const hijriDate = formatHijriFromYMD(selectedDate);

  // Gregorian date
  const dateNoon = parseYMDToLocalNoon(selectedDate);
  const gregorianDate = dateNoon.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Count active adhkar subs
  const adhkarActiveCount = ADHKAR_SUBS.filter((s) => adhkarDetails[s.key]).length;

  // Expandable helpers
  function isExpandable(key) {
    return key === 'prayer' || key === 'quran' || key === 'dhikr';
  }
  function isExpanded(key) {
    if (key === 'prayer') return prayerExpanded;
    if (key === 'quran') return quranExpanded;
    if (key === 'dhikr') return adhkarExpanded;
    return false;
  }
  function toggleExpand(key) {
    if (key === 'prayer') setPrayerExpanded((prev) => !prev);
    else if (key === 'quran') setQuranExpanded((prev) => !prev);
    else if (key === 'dhikr') setAdhkarExpanded((prev) => !prev);
  }

  return (
    <div>
      {/* Date Selector */}
      <div className="date-selector">
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
        <button
          className="date-arrow"
          onClick={() => onNavigateDate(addDaysYMD(selectedDate, +1))}
        >
          ←
        </button>
      </div>

      {/* ── Streak Strip ── */}
      <div className="streak-strip">
        <div className="streak-boxes">
          {streakData.boxes.map((box) => (
            <button
              key={box.ymd}
              className={`streak-box${box.submitted ? ' submitted' : ''}${box.isTodayBox ? ' today' : ''}${box.isSelected ? ' selected' : ''}`}
              onClick={() => onNavigateDate(box.ymd)}
            >
              <span className="streak-box-day">{box.hijriDay}</span>
              <span className="streak-box-wd">{box.weekdayInitial}</span>
            </button>
          ))}
        </div>
        {streakData.streak > 0 && (
          <div className="streak-label">
            سلسلة الاعتماد: {toArabicNumeral(streakData.streak)} {streakData.streak === 1 ? 'يوم' : 'أيام'}
          </div>
        )}
      </div>

      {/* Habits Card */}
      <div className={`card card-compact${isSubmitted ? ' card-submitted' : ''}`}>
        <div className="habits-list">
          {HABITS.map((habit) => (
            <div key={habit.key}>
              {/* Main habit row */}
              <div
                className={`habit-row ${entry[habit.key] ? 'completed' : ''} ${habit.key === 'prayer' ? 'prayer-main' : ''}`}
                onClick={() => {
                  if (isExpandable(habit.key)) {
                    toggleExpand(habit.key);
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
                    {habit.key === 'dhikr' && adhkarActiveCount > 0 && (
                      <span className="prayer-count">
                        {' '}({toArabicNumeral(adhkarActiveCount)}/{toArabicNumeral(3)})
                      </span>
                    )}
                  </span>
                </div>
                <div className="habit-row-actions">
                  {habit.key === 'charity' && (
                    <a
                      className="donate-link"
                      href={EHSAN_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      تبرع مباشر ↗
                    </a>
                  )}
                  {isExpandable(habit.key) && (
                    <span className={`prayer-chevron ${isExpanded(habit.key) ? 'expanded' : ''}`}>
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

              {/* Prayer expansion: 5 individual prayers with checkbox subs */}
              {habit.key === 'prayer' && prayerExpanded && (
                <div className="prayer-expansion">
                  {INDIVIDUAL_PRAYERS.map((p) => (
                    <div
                      key={p.key}
                      className={`prayer-mini-row ${prayers[p.key] ? 'completed' : ''}`}
                      onClick={() => toggleIndividualPrayer(p.key)}
                    >
                      <span className="prayer-mini-name">{p.name}</span>
                      <div className="prayer-mini-actions">
                        <SubCheckbox
                          checked={!!prayerDetails[p.key]?.jamaa}
                          label="جماعة"
                          onChange={() => togglePrayerSub(p.key, 'jamaa')}
                        />
                        {/* No nafila for Asr */}
                        {p.key !== 'asr' && (
                          <SubCheckbox
                            checked={!!prayerDetails[p.key]?.nafila}
                            label="نافلة"
                            onChange={() => togglePrayerSub(p.key, 'nafila')}
                          />
                        )}
                        <div className={`prayer-mini-toggle ${prayers[p.key] ? 'on' : ''}`}>
                          <div className="prayer-mini-toggle-knob" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quran expansion */}
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

              {/* Adhkar expansion: checkbox sub-items */}
              {habit.key === 'dhikr' && adhkarExpanded && (
                <div className="prayer-expansion">
                  <div className="adhkar-chips-grid">
                    {ADHKAR_SUBS.map((sub) => (
                      <SubCheckbox
                        key={sub.key}
                        checked={adhkarDetails[sub.key]}
                        label={sub.name}
                        onChange={() => toggleAdhkarSub(sub.key)}
                      />
                    ))}
                  </div>
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

      {/* ── Submit / Submitted Panel ── */}
      {isSubmitted ? (
        <div className="submitted-panel">
          <span className="submitted-text">تم اعتماد اليوم ✅ — الله يثبتك، كمل!</span>
          <button className="submitted-edit-btn" onClick={unsubmitDay}>تعديل</button>
        </div>
      ) : (
        <button className="btn btn-submit" onClick={submitDay}>
          اعتماد اليوم
        </button>
      )}

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

      {/* Auto-save notice */}
      <div className="auto-save-notice">يتم الحفظ تلقائياً على جهازك</div>

      {/* Save Toast */}
      {showSaveToast && (
        <div className="save-toast">✓ تم الحفظ</div>
      )}
    </div>
  );
}
