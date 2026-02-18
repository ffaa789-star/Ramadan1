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
  const [prayerExpanded, setPrayerExpanded] = useState(false);
  const [quranExpanded, setQuranExpanded] = useState(false);
  const [adhkarExpanded, setAdhkarExpanded] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [editing, setEditing] = useState(false);
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
  const locked = isSubmitted && !editing;
  const adhkarActiveCount = ADHKAR_SUBS.filter((s) => adhkarDetails[s.key]).length;

  // Reset editing + collapse expansions when navigating days
  useEffect(() => {
    setEditing(false);
    setPrayerExpanded(false);
    setQuranExpanded(false);
    setAdhkarExpanded(false);
  }, [selectedDate]);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setShowSaveToast(true);
    const timer = setTimeout(() => setShowSaveToast(false), 800);
    return () => clearTimeout(timer);
  }, [entry]);

  /* ── Streak count ── */
  const streakCount = useMemo(() => {
    let streak = 0;
    let cur = selectedDate;
    for (let i = 0; i < 365; i++) {
      if (entries[cur]?.submitted) { streak++; cur = addDaysYMD(cur, -1); }
      else break;
    }
    return streak;
  }, [selectedDate, entries]);

  /* ── All handlers guarded by locked ── */

  function togglePrayerMain() {
    if (locked) return;
    onUpdate({ ...entry, prayer: !entry.prayer });
  }

  function toggleIndividualPrayer(prayerKey) {
    if (locked) return;
    const newPrayers = { ...prayers, [prayerKey]: !prayers[prayerKey] };
    const newDetails = { ...prayerDetails };
    if (!newPrayers[prayerKey]) newDetails[prayerKey] = { jamaa: false, nafila: false };
    onUpdate({ ...entry, prayers: newPrayers, prayerDetails: newDetails });
  }

  function togglePrayerSub(prayerKey, subKey) {
    if (locked) return;
    if (prayerKey === 'asr' && subKey === 'nafila') return;
    const oldSub = prayerDetails[prayerKey] || { jamaa: false, nafila: false };
    const newDetails = { ...prayerDetails, [prayerKey]: { ...oldSub, [subKey]: !oldSub[subKey] } };
    onUpdate({ ...entry, prayerDetails: newDetails });
  }

  function toggleAdhkarParent() {
    if (locked) return;
    onUpdate({ ...entry, dhikr: !entry.dhikr });
  }

  function toggleAdhkarSub(subKey) {
    if (locked) return;
    onUpdate({ ...entry, adhkarDetails: { ...adhkarDetails, [subKey]: !adhkarDetails[subKey] } });
  }

  function toggleHabit(key) {
    if (locked) return;
    const updated = { ...entry, [key]: !entry[key] };
    if (key === 'quran' && !updated.quran) { updated.quranPages = null; setQuranExpanded(false); }
    onUpdate(updated);
  }

  function handleQuranPages(value) {
    if (locked) return;
    const raw = value === '' ? null : parseInt(value) || 0;
    const pages = raw === null ? null : Math.min(1000, Math.max(0, raw));
    const updated = { ...entry, quranPages: pages };
    if (pages !== null && pages > 0) updated.quran = true;
    onUpdate(updated);
  }

  function stepQuranPages(delta) {
    if (locked) return;
    const current = entry.quranPages ?? 0;
    const next = Math.min(1000, Math.max(0, current + delta));
    const updated = { ...entry, quranPages: next === 0 ? null : next };
    if (next > 0) updated.quran = true;
    onUpdate(updated);
  }

  function submitDay() { onUpdate({ ...entry, submitted: true }); setEditing(false); }
  function startEditing() { setEditing(true); }

  function isExpandable(key) { return key === 'prayer' || key === 'quran' || key === 'dhikr'; }
  function isExpanded(key) {
    if (key === 'prayer') return prayerExpanded;
    if (key === 'quran') return quranExpanded;
    if (key === 'dhikr') return adhkarExpanded;
    return false;
  }
  function toggleExpand(key) {
    if (locked) return;
    if (key === 'prayer') setPrayerExpanded((p) => !p);
    else if (key === 'quran') setQuranExpanded((p) => !p);
    else if (key === 'dhikr') setAdhkarExpanded((p) => !p);
  }

  const hijriDate = formatHijriFromYMD(selectedDate);

  /*
   * STATE LOGIC:
   * - "today"     = isToday && !isSubmitted
   * - "past"      = !isToday && !isSubmitted   → muted, label "يوم سابق"
   * - "approved"  = isSubmitted && !editing     → locked, green border, "تم اعتماد اليوم ✔"
   * - "editing"   = isSubmitted && editing      → unlocked, amber indicator
   */

  // Determine the state label for the FIXED-HEIGHT status slot
  let dayState = 'today';
  if (isSubmitted && !editing) dayState = 'approved';
  else if (isSubmitted && editing) dayState = 'editing';
  else if (!isToday) dayState = 'past';

  return (
    <div className={`ck${dayState === 'approved' ? ' ck-approved' : ''}${dayState === 'past' ? ' ck-past' : ''}`}>

      {/* ── SLOT 1: Date navigation bar — ALWAYS 44px ── */}
      <div className="ck-date-bar">
        <button className="ck-arrow" onClick={() => onNavigateDate(addDaysYMD(selectedDate, -1))}>→</button>
        <div className="ck-date-center">
          <span className="ck-date-text">{hijriDate}</span>
          {streakCount > 0 && (
            <span className="ck-streak-inline">🔥 {toArabicNumeral(streakCount)}</span>
          )}
        </div>
        <button className="ck-arrow" onClick={() => onNavigateDate(addDaysYMD(selectedDate, +1))}>←</button>
      </div>

      {/* ── SLOT 2: Status bar — ALWAYS 36px, only appearance changes ── */}
      <div className={`ck-status ck-status-${dayState}`}>
        {dayState === 'today' && (
          <span className="ck-status-label">📅 اليوم</span>
        )}
        {dayState === 'past' && (
          <>
            <span className="ck-status-label">يوم سابق</span>
            <button className="ck-status-action" onClick={() => onNavigateDate(null)}>العودة لليوم</button>
          </>
        )}
        {dayState === 'approved' && (
          <>
            <span className="ck-status-label">تم اعتماد اليوم ✔</span>
            <button className="ck-status-action" onClick={startEditing}>تعديل</button>
          </>
        )}
        {dayState === 'editing' && (
          <>
            <span className="ck-status-label">✏️ وضع التعديل</span>
            <button className="ck-status-action ck-status-save" onClick={submitDay}>حفظ</button>
          </>
        )}
      </div>

      {/* ── SLOT 3: Habits card — ONE card, fixed structure, calm ── */}
      <div className={`card ck-card${dayState === 'approved' ? ' ck-card-approved' : ''}`}>
        {HABITS.map((habit, idx) => {
          const done = !!entry[habit.key];
          const expandable = isExpandable(habit.key);
          const expanded = isExpanded(habit.key);

          return (
            <div key={habit.key} className="ck-item-wrap">
              {idx > 0 && <div className="ck-divider" />}

              <div
                className={`ck-row${done ? ' done' : ''}`}
                onClick={() => {
                  if (locked) return;
                  if (expandable) toggleExpand(habit.key);
                  else toggleHabit(habit.key);
                }}
              >
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

                <div
                  className={`ck-toggle ${done ? 'on' : ''}${locked ? ' disabled' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (locked) return;
                    if (habit.key === 'prayer') togglePrayerMain();
                    else if (habit.key === 'dhikr') toggleAdhkarParent();
                    else toggleHabit(habit.key);
                  }}
                >
                  <div className="ck-toggle-knob" />
                </div>
              </div>

              {/* Prayer expansion */}
              {habit.key === 'prayer' && expanded && !locked && (
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
              {habit.key === 'quran' && expanded && !locked && (
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
              {habit.key === 'dhikr' && expanded && !locked && (
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

        {/* Progress bar */}
        <div className="ck-progress">
          <div className="ck-progress-track">
            <div className="ck-progress-fill" style={{ width: `${percentage}%` }} />
          </div>
          <span className="ck-progress-txt">{PROGRESS_MESSAGES[score]}</span>
        </div>
      </div>

      {/* ── SLOT 4: Action bar — ALWAYS 48px height, content changes by state ── */}
      <div className="ck-action-slot">
        {dayState === 'approved' ? (
          /* Approved: empty placeholder keeps same height */
          <span className="ck-action-placeholder" />
        ) : (
          <button className="ck-submit-btn" onClick={submitDay}>
            اعتماد اليوم
          </button>
        )}
      </div>

      {/* ── Footer: clear button (only when not locked, non-intrusive) ── */}
      {!locked && score > 0 && (
        <div className="ck-footer">
          <button className="ck-footer-btn danger" onClick={onClearDay}>مسح اليوم</button>
        </div>
      )}

      {showSaveToast && <div className="save-toast">✓ تم الحفظ</div>}
    </div>
  );
}
