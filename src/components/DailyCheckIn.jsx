import { useState, useEffect, useRef, useMemo } from 'react';
import {
  addDaysYMD,
  getTodayYMD,
  formatHijriFromYMD,
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
  { key: 'fasting', name: 'الصيام', icon: '🍽️' },
  { key: 'qiyam', name: 'قيام الليل', icon: '🌃' },
  { key: 'charity', name: 'الصدقة', icon: '🤲' },
  { key: 'dhikr', name: 'الأذكار', icon: '📿' },
];

const PROGRESS_MESSAGES = [
  'ابدأ يومك بعبادة 💫',
  'خطوة أولى مباركة',
  'أحسنت، واصل!',
  'ما شاء الله!',
  'بارك الله فيك!',
  'تبقى القليل، أكمل!',
  'يوم مكتمل، تقبّل الله منك ✨',
];

const EHSAN_LINK = 'https://ehsan.sa/campaign/7116894CC2';

export default function DailyCheckIn({
  entry, entries, onUpdate, selectedDate, isToday, onNavigateDate, onClearDay,
}) {
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
  const percentage = (score / 6) * 100;
  const completedPrayerCount = INDIVIDUAL_PRAYERS.filter((p) => prayers[p.key]).length;
  const isSubmitted = !!entry.submitted;
  const adhkarActiveCount = ADHKAR_SUBS.filter((s) => adhkarDetails[s.key]).length;

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setShowSaveToast(true);
    const timer = setTimeout(() => setShowSaveToast(false), 800);
    return () => clearTimeout(timer);
  }, [entry]);

  /* ── Streak count (no boxes/strip) ── */
  const streakCount = useMemo(() => {
    let streak = 0;
    let cur = selectedDate;
    for (let i = 0; i < 365; i++) {
      if (entries[cur]?.submitted) { streak++; cur = addDaysYMD(cur, -1); }
      else break;
    }
    return streak;
  }, [selectedDate, entries]);

  /* ── Action handlers ── */

  // Parent prayer toggles independently — does NOT wipe subs
  function togglePrayerMain() {
    const newVal = !entry.prayer;
    onUpdate({ ...entry, prayer: newVal });
  }

  // Toggling individual prayer is just a detail — does NOT auto-complete parent "الصلاة"
  function toggleIndividualPrayer(prayerKey) {
    const newPrayers = { ...prayers, [prayerKey]: !prayers[prayerKey] };
    const newDetails = { ...prayerDetails };
    if (!newPrayers[prayerKey]) newDetails[prayerKey] = { jamaa: false, nafila: false };
    onUpdate({ ...entry, prayers: newPrayers, prayerDetails: newDetails });
  }

  // Prayer sub-details (jamaa/nafila) — just details, do NOT auto-complete anything
  function togglePrayerSub(prayerKey, subKey) {
    if (prayerKey === 'asr' && subKey === 'nafila') return;
    const oldSub = prayerDetails[prayerKey] || { jamaa: false, nafila: false };
    const newSubVal = !oldSub[subKey];
    const newDetails = { ...prayerDetails, [prayerKey]: { ...oldSub, [subKey]: newSubVal } };
    onUpdate({ ...entry, prayerDetails: newDetails });
  }

  // Parent adhkar toggles independently — does NOT wipe subs
  function toggleAdhkarParent() {
    const newVal = !entry.dhikr;
    onUpdate({ ...entry, dhikr: newVal });
  }

  // Toggling adhkar sub is just a detail — does NOT auto-complete parent "الأذكار"
  function toggleAdhkarSub(subKey) {
    const newAdhkar = { ...adhkarDetails, [subKey]: !adhkarDetails[subKey] };
    onUpdate({ ...entry, adhkarDetails: newAdhkar });
  }

  function toggleHabit(key) {
    const updated = { ...entry, [key]: !entry[key] };
    if (key === 'quran' && !updated.quran) { updated.quranPages = null; setQuranExpanded(false); }
    onUpdate(updated);
  }

  function handleQuranPages(value) {
    const raw = value === '' ? null : parseInt(value) || 0;
    const pages = raw === null ? null : Math.min(1000, Math.max(0, raw));
    const updated = { ...entry, quranPages: pages };
    if (pages !== null && pages > 0) updated.quran = true;
    onUpdate(updated);
  }

  function stepQuranPages(delta) {
    const current = entry.quranPages ?? 0;
    const next = Math.min(1000, Math.max(0, current + delta));
    const updated = { ...entry, quranPages: next === 0 ? null : next };
    if (next > 0) updated.quran = true;
    onUpdate(updated);
  }

  function handleNote(value) { onUpdate({ ...entry, note: value }); }
  function submitDay() { onUpdate({ ...entry, submitted: true }); }
  function unsubmitDay() { onUpdate({ ...entry, submitted: false }); }

  function isExpandable(key) { return key === 'prayer' || key === 'quran' || key === 'dhikr'; }
  function isExpanded(key) {
    if (key === 'prayer') return prayerExpanded;
    if (key === 'quran') return quranExpanded;
    if (key === 'dhikr') return adhkarExpanded;
    return false;
  }
  function toggleExpand(key) {
    if (key === 'prayer') setPrayerExpanded((p) => !p);
    else if (key === 'quran') setQuranExpanded((p) => !p);
    else if (key === 'dhikr') setAdhkarExpanded((p) => !p);
  }

  const hijriDate = formatHijriFromYMD(selectedDate);

  return (
    <div className="ck">
      {/* ── Date bar ── */}
      <div className="ck-date-bar">
        <button className="ck-arrow" onClick={() => onNavigateDate(addDaysYMD(selectedDate, -1))}>→</button>
        <div className="ck-date-center">
          <span className="ck-date-text">{hijriDate}</span>
          {!isToday && (
            <button className="ck-today-btn" onClick={() => onNavigateDate(null)}>اليوم</button>
          )}
        </div>
        <button className="ck-arrow" onClick={() => onNavigateDate(addDaysYMD(selectedDate, +1))}>←</button>
      </div>

      {/* ── Streak text (no strip/dots) ── */}
      {streakCount > 0 && (
        <div className="ck-streak-text">
          🔥 {toArabicNumeral(streakCount)} يوم متتابع
        </div>
      )}

      {/* ── Habit list card — fixed order (HABITS array, no sorting) ── */}
      <div className={`card ck-card${isSubmitted ? ' card-submitted' : ''}`}>
        {HABITS.map((habit) => {
          const done = !!entry[habit.key];
          const expandable = isExpandable(habit.key);
          const expanded = isExpanded(habit.key);

          return (
            <div key={habit.key} className="ck-item-wrap">
              {/* Main row — icon + name on right, toggle switch on left */}
              <div
                className={`ck-row${done ? ' done' : ''}`}
                onClick={() => {
                  if (expandable) toggleExpand(habit.key);
                  else toggleHabit(habit.key);
                }}
              >
                {/* Right side: icon + name + sub-count + chevron */}
                <span className="ck-icon">{habit.icon}</span>
                <span className="ck-name">
                  {habit.name}
                  {habit.key === 'prayer' && <span className="ck-sub-count"> {toArabicNumeral(completedPrayerCount)}/٥</span>}
                  {habit.key === 'quran' && entry.quranPages > 0 && <span className="ck-sub-count"> {toArabicNumeral(entry.quranPages)} ص</span>}
                  {habit.key === 'dhikr' && adhkarActiveCount > 0 && <span className="ck-sub-count"> {toArabicNumeral(adhkarActiveCount)}/٣</span>}
                </span>

                {expandable && (
                  <span className={`ck-chevron ${expanded ? 'open' : ''}`}>‹</span>
                )}

                {habit.key === 'charity' && (
                  <a className="donate-link" href={EHSAN_LINK} target="_blank" rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}>تبرع ↗</a>
                )}

                {/* Left side: toggle switch */}
                <div
                  className={`ck-toggle ${done ? 'on' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (habit.key === 'prayer') togglePrayerMain();
                    else if (habit.key === 'dhikr') toggleAdhkarParent();
                    else toggleHabit(habit.key);
                  }}
                >
                  <div className="ck-toggle-knob" />
                </div>
              </div>

              {/* Prayer expansion */}
              {habit.key === 'prayer' && expanded && (
                <div className="ck-expand">
                  {INDIVIDUAL_PRAYERS.map((p) => (
                    <div key={p.key} className={`ck-prayer-row${prayers[p.key] ? ' done' : ''}`}
                      onClick={() => toggleIndividualPrayer(p.key)}>
                      <div className={`ck-mini-check ${prayers[p.key] ? 'on' : ''}`}
                        onClick={(e) => { e.stopPropagation(); toggleIndividualPrayer(p.key); }}>
                        {prayers[p.key] && '✓'}
                      </div>
                      <span className="ck-prayer-name">{p.name}</span>
                      <div className="ck-chips">
                        <button className={`ck-chip${prayerDetails[p.key]?.jamaa ? ' active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); togglePrayerSub(p.key, 'jamaa'); }}>جماعة</button>
                        {p.key !== 'asr' && (
                          <button className={`ck-chip${prayerDetails[p.key]?.nafila ? ' active' : ''}`}
                            onClick={(e) => { e.stopPropagation(); togglePrayerSub(p.key, 'nafila'); }}>نافلة</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quran expansion */}
              {habit.key === 'quran' && expanded && (
                <div className="ck-expand">
                  <div className="quran-pages-input" style={{ marginTop: 0 }}>
                    <div className="quran-stepper">
                      <button className="quran-stepper-btn" onClick={(e) => { e.stopPropagation(); stepQuranPages(-1); }}
                        disabled={(entry.quranPages ?? 0) <= 0}>−</button>
                      <input type="number" min="0" max="1000" placeholder="٠"
                        value={entry.quranPages ?? ''} onChange={(e) => handleQuranPages(e.target.value)}
                        onClick={(e) => e.stopPropagation()} />
                      <button className="quran-stepper-btn" onClick={(e) => { e.stopPropagation(); stepQuranPages(+1); }}
                        disabled={(entry.quranPages ?? 0) >= 1000}>+</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Adhkar expansion */}
              {habit.key === 'dhikr' && expanded && (
                <div className="ck-expand">
                  <div className="ck-adhkar-row">
                    {ADHKAR_SUBS.map((sub) => (
                      <button key={sub.key}
                        className={`ck-chip ck-chip-lg${adhkarDetails[sub.key] ? ' active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); toggleAdhkarSub(sub.key); }}>
                        {adhkarDetails[sub.key] && <span className="ck-chip-tick">✓ </span>}
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Progress bar with label */}
        <div className="ck-progress">
          <div className="ck-progress-label">الإنجاز اليومي</div>
          <div className="ck-progress-track">
            <div className="ck-progress-fill" style={{ width: `${percentage}%` }} />
          </div>
          <span className="ck-progress-txt">{PROGRESS_MESSAGES[score]}</span>
        </div>
      </div>

      {/* Submit / submitted */}
      {isSubmitted ? (
        <div className="submitted-panel">
          <span className="submitted-text">تم الاعتماد ✅ — الله يثبتك!</span>
          <button className="submitted-edit-btn" onClick={unsubmitDay}>تعديل</button>
        </div>
      ) : (
        <button className="btn btn-submit" onClick={submitDay}>اعتماد اليوم</button>
      )}

      {/* Reflection */}
      {(!showReflection && !entry.note) ? (
        <button className="reflection-toggle-btn" onClick={() => setShowReflection(true)} style={{ marginTop: 8 }}>
          ✏️ تأمل
        </button>
      ) : (
        <textarea className="reflection-textarea" placeholder="تأمل اليوم..."
          value={entry.note || ''} onChange={(e) => handleNote(e.target.value)}
          autoFocus={showReflection && !entry.note} style={{ marginTop: 8, minHeight: 60 }} />
      )}

      {/* Footer actions */}
      <div className="ck-footer">
        <button className="ck-footer-btn danger" onClick={onClearDay}>مسح</button>
      </div>

      {showSaveToast && <div className="save-toast">✓ تم الحفظ</div>}
    </div>
  );
}
