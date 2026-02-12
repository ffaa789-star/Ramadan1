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
  { key: 'charity', name: 'الصدقة', icon: '🤲' },
  { key: 'dhikr', name: 'الأذكار', icon: '📿' },
];

/* Classic mode uses longer names */
const HABITS_CLASSIC_NAMES = {
  prayer: 'الصلاة',
  quran: 'القرآن',
  qiyam: 'قيام الليل',
  charity: 'التبرع أو فعل الخير',
  dhikr: 'الأذكار والدعاء',
};

const PROGRESS_MESSAGES = [
  'ابدأ يومك بعبادة 💫',
  'خطوة أولى مباركة',
  'أحسنت، واصل!',
  'ما شاء الله، نصف الطريق!',
  'بارك الله فيك، تبقى القليل',
  'يوم مكتمل، تقبّل الله منك ✨',
];

const EHSAN_LINK = 'https://ehsan.sa/campaign/7116894CC2';
const WEEKDAY_INITIALS = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];

function allPrayersDone(prayers) {
  return prayers && INDIVIDUAL_PRAYERS.every((p) => prayers[p.key]);
}

/* ── Reusable sub-checkbox (used in classic mode for adhkar) ── */
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

export default function DailyCheckIn({
  entry, entries, onUpdate, selectedDate, isToday,
  onNavigateDate, onClearDay, uiVersion, onToggleUi,
}) {
  const isCompact = uiVersion === 'compact';
  const [showReflection, setShowReflection] = useState(false);
  const [prayerExpanded, setPrayerExpanded] = useState(false);
  const [quranExpanded, setQuranExpanded] = useState(false);
  const [adhkarExpanded, setAdhkarExpanded] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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
  const adhkarActiveCount = ADHKAR_SUBS.filter((s) => adhkarDetails[s.key]).length;

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setShowSaveToast(true);
    const timer = setTimeout(() => setShowSaveToast(false), 800);
    return () => clearTimeout(timer);
  }, [entry]);

  /* ── Streak data ── */
  const streakData = useMemo(() => {
    const todayYmd = getTodayYMD();
    const boxes = [];
    for (let i = -3; i <= 1; i++) {
      const ymd = addDaysYMD(selectedDate, i);
      const dt = parseYMDToLocalNoon(ymd);
      const hijriDay = formatHijriDayOnly(ymd);
      const weekdayIdx = dt.getDay();
      const dayEntry = entries[ymd];
      boxes.push({
        ymd,
        hijriDay,
        weekdayInitial: WEEKDAY_INITIALS[weekdayIdx],
        submitted: dayEntry?.submitted || false,
        isTodayBox: ymd === todayYmd,
        isSelected: i === 0,
      });
    }
    let streak = 0;
    let cur = selectedDate;
    for (let i = 0; i < 365; i++) {
      if (entries[cur]?.submitted) { streak++; cur = addDaysYMD(cur, -1); }
      else break;
    }
    return { boxes, streak };
  }, [selectedDate, entries]);

  /* ── Action handlers (shared by both modes) ── */
  function togglePrayerMain() {
    const allDone = allPrayersDone(prayers);
    const newVal = !allDone;
    const newPrayers = {};
    const newDetails = { ...prayerDetails };
    INDIVIDUAL_PRAYERS.forEach((p) => {
      newPrayers[p.key] = newVal;
      if (!newVal) newDetails[p.key] = { jamaa: false, nafila: false };
    });
    onUpdate({ ...entry, prayer: newVal, prayers: newPrayers, prayerDetails: newDetails });
    if (!allDone) setPrayerExpanded(false);
  }

  function toggleIndividualPrayer(prayerKey) {
    const newPrayers = { ...prayers, [prayerKey]: !prayers[prayerKey] };
    const newDetails = { ...prayerDetails };
    if (!newPrayers[prayerKey]) newDetails[prayerKey] = { jamaa: false, nafila: false };
    const allDone = INDIVIDUAL_PRAYERS.every((p) => newPrayers[p.key]);
    onUpdate({ ...entry, prayer: allDone, prayers: newPrayers, prayerDetails: newDetails });
  }

  function togglePrayerSub(prayerKey, subKey) {
    if (prayerKey === 'asr' && subKey === 'nafila') return;
    const oldSub = prayerDetails[prayerKey] || { jamaa: false, nafila: false };
    const newSubVal = !oldSub[subKey];
    const newDetails = { ...prayerDetails, [prayerKey]: { ...oldSub, [subKey]: newSubVal } };
    const newPrayers = { ...prayers };
    if (newSubVal && !newPrayers[prayerKey]) newPrayers[prayerKey] = true;
    const allDone = INDIVIDUAL_PRAYERS.every((p) => newPrayers[p.key]);
    onUpdate({ ...entry, prayer: allDone, prayers: newPrayers, prayerDetails: newDetails });
  }

  function toggleAdhkarSub(subKey) {
    const newAdhkar = { ...adhkarDetails, [subKey]: !adhkarDetails[subKey] };
    const parentDone = ADHKAR_SUBS.some((s) => newAdhkar[s.key]);
    onUpdate({ ...entry, dhikr: parentDone, adhkarDetails: newAdhkar });
  }

  function toggleHabit(key) {
    const updated = { ...entry, [key]: !entry[key] };
    if (key === 'quran' && !updated.quran) { updated.quranPages = null; setQuranExpanded(false); }
    if (key === 'dhikr' && !updated.dhikr) { updated.adhkarDetails = { morning: false, evening: false, duaa: false }; setAdhkarExpanded(false); }
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

  function shareWhatsApp() {
    const text = `رفيق رمضان 🌙 — سجّل عباداتك اليومية بسهولة: ${window.location.origin}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }
  function copyLink() {
    navigator.clipboard.writeText(window.location.origin).then(() => {
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 800);
    });
  }

  const hijriDate = formatHijriFromYMD(selectedDate);
  const dateNoon = parseYMDToLocalNoon(selectedDate);
  const gregorianDate = dateNoon.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

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

  /* ========================================================================
   * COMPACT MODE
   * ====================================================================== */
  if (isCompact) {
    return (
      <div className="ck">
        {/* ── Slim date bar: arrows + one-line date + streak dots ── */}
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

        {/* ── Streak dots row ── */}
        <div className="ck-streak-row">
          <div className="ck-streak-dots">
            {streakData.boxes.map((box) => (
              <button
                key={box.ymd}
                className={`ck-dot${box.submitted ? ' done' : ''}${box.isTodayBox ? ' today' : ''}${box.isSelected ? ' sel' : ''}`}
                onClick={() => onNavigateDate(box.ymd)}
                title={box.hijriDay}
              >
                <span className="ck-dot-num">{box.hijriDay}</span>
              </button>
            ))}
          </div>
          {streakData.streak > 0 && (
            <span className="ck-streak-count">🔥 {toArabicNumeral(streakData.streak)}</span>
          )}
        </div>

        {/* ── Checklist card ── */}
        <div className={`card ck-card${isSubmitted ? ' card-submitted' : ''}`}>
          {HABITS.map((habit) => {
            const done = !!entry[habit.key];
            const expandable = isExpandable(habit.key);
            const expanded = isExpanded(habit.key);

            return (
              <div key={habit.key} className="ck-item-wrap">
                {/* Main row */}
                <div
                  className={`ck-row${done ? ' done' : ''}`}
                  onClick={() => {
                    if (expandable) toggleExpand(habit.key);
                    else toggleHabit(habit.key);
                  }}
                >
                  {/* Checkbox box */}
                  <div
                    className={`ck-check ${done ? 'on' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (habit.key === 'prayer') togglePrayerMain();
                      else toggleHabit(habit.key);
                    }}
                  >
                    {done && '✓'}
                  </div>

                  <span className="ck-icon">{habit.icon}</span>
                  <span className="ck-name">
                    {habit.name}
                    {habit.key === 'prayer' && <span className="ck-sub-count"> {toArabicNumeral(completedPrayerCount)}/٥</span>}
                    {habit.key === 'quran' && entry.quranPages > 0 && <span className="ck-sub-count"> {toArabicNumeral(entry.quranPages)} ص</span>}
                    {habit.key === 'dhikr' && adhkarActiveCount > 0 && <span className="ck-sub-count"> {toArabicNumeral(adhkarActiveCount)}/٣</span>}
                  </span>

                  <div className="ck-row-end">
                    {habit.key === 'charity' && (
                      <a className="donate-link" href={EHSAN_LINK} target="_blank" rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}>تبرع ↗</a>
                    )}
                    {expandable && (
                      <span className={`ck-chevron ${expanded ? 'open' : ''}`}>‹</span>
                    )}
                  </div>
                </div>

                {/* Prayer expansion — pill chips, NOT checkboxes */}
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

                {/* Adhkar expansion — pill chips */}
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

          {/* Compact progress bar */}
          <div className="ck-progress">
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

        {/* Reflection — collapsed by default */}
        {(!showReflection && !entry.note) ? (
          <button className="reflection-toggle-btn" onClick={() => setShowReflection(true)} style={{ marginTop: 8 }}>
            ✏️ تأمل
          </button>
        ) : (
          <textarea className="reflection-textarea" placeholder="تأمل اليوم..."
            value={entry.note || ''} onChange={(e) => handleNote(e.target.value)}
            autoFocus={showReflection && !entry.note} style={{ marginTop: 8, minHeight: 60 }} />
        )}

        {/* Footer: share + actions + settings */}
        <div className="ck-footer">
          <button className="ck-footer-btn" onClick={shareWhatsApp}>واتساب</button>
          <button className="ck-footer-btn" onClick={copyLink}>نسخ</button>
          {!isToday && <button className="ck-footer-btn" onClick={() => onNavigateDate(null)}>اليوم</button>}
          <button className="ck-footer-btn danger" onClick={onClearDay}>مسح</button>
          <button className="ck-footer-btn" onClick={() => setShowSettings((s) => !s)}>⚙</button>
        </div>

        {showSettings && (
          <div className="ck-settings">
            <span className="ck-settings-label">التصميم:</span>
            <button className="ck-settings-btn active">مضغوط</button>
            <button className="ck-settings-btn" onClick={onToggleUi}>كلاسيكي</button>
          </div>
        )}

        <div className="auto-save-notice">يتم الحفظ تلقائياً على جهازك</div>
        {showSaveToast && <div className="save-toast">✓ تم الحفظ</div>}
      </div>
    );
  }

  /* ========================================================================
   * CLASSIC MODE — identical to previous design
   * ====================================================================== */
  return (
    <div>
      {/* Date Selector */}
      <div className="date-selector">
        <button className="date-arrow" onClick={() => onNavigateDate(addDaysYMD(selectedDate, -1))}>→</button>
        <div className="date-display">
          {hijriDate && <div className="date-hijri">{hijriDate}</div>}
          <div className="date-gregorian">{gregorianDate}</div>
          {isToday && <span className="date-today-badge">اليوم</span>}
        </div>
        <button className="date-arrow" onClick={() => onNavigateDate(addDaysYMD(selectedDate, +1))}>←</button>
      </div>

      {/* Streak Strip */}
      <div className="streak-strip">
        <div className="streak-boxes">
          {streakData.boxes.map((box) => (
            <button key={box.ymd}
              className={`streak-box${box.submitted ? ' submitted' : ''}${box.isTodayBox ? ' today' : ''}${box.isSelected ? ' selected' : ''}`}
              onClick={() => onNavigateDate(box.ymd)}>
              <span className="streak-box-day">{box.hijriDay}</span>
              <span className="streak-box-wd">{box.weekdayInitial}</span>
            </button>
          ))}
        </div>
        {streakData.streak > 0 && (
          <div className="streak-label">سلسلة الاعتماد: {toArabicNumeral(streakData.streak)} {streakData.streak === 1 ? 'يوم' : 'أيام'}</div>
        )}
      </div>

      {/* Habits Card */}
      <div className={`card card-compact${isSubmitted ? ' card-submitted' : ''}`}>
        <div className="habits-list">
          {HABITS.map((habit) => (
            <div key={habit.key}>
              <div
                className={`habit-row ${entry[habit.key] ? 'completed' : ''} ${habit.key === 'prayer' ? 'prayer-main' : ''}`}
                onClick={() => { if (isExpandable(habit.key)) toggleExpand(habit.key); else toggleHabit(habit.key); }}
              >
                <div className="habit-info">
                  <span className="habit-icon">{habit.icon}</span>
                  <span className="habit-name">
                    {HABITS_CLASSIC_NAMES[habit.key] || habit.name}
                    {habit.key === 'prayer' && <span className="prayer-count"> ({toArabicNumeral(completedPrayerCount)}/{toArabicNumeral(5)})</span>}
                    {habit.key === 'quran' && entry.quranPages > 0 && <span className="prayer-count"> ({toArabicNumeral(entry.quranPages)} صفحة)</span>}
                    {habit.key === 'dhikr' && adhkarActiveCount > 0 && <span className="prayer-count"> ({toArabicNumeral(adhkarActiveCount)}/{toArabicNumeral(3)})</span>}
                  </span>
                </div>
                <div className="habit-row-actions">
                  {habit.key === 'charity' && (
                    <a className="donate-link" href={EHSAN_LINK} target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}>تبرع مباشر ↗</a>
                  )}
                  {isExpandable(habit.key) && (
                    <span className={`prayer-chevron ${isExpanded(habit.key) ? 'expanded' : ''}`}>‹</span>
                  )}
                  <div className={`habit-toggle ${entry[habit.key] ? 'on' : ''}`}
                    onClick={(e) => { e.stopPropagation(); if (habit.key === 'prayer') togglePrayerMain(); else toggleHabit(habit.key); }}>
                    <div className="habit-toggle-knob" />
                  </div>
                </div>
              </div>

              {/* Prayer expansion — pill chips in classic too */}
              {habit.key === 'prayer' && prayerExpanded && (
                <div className="prayer-expansion">
                  {INDIVIDUAL_PRAYERS.map((p) => (
                    <div key={p.key} className={`prayer-mini-row ${prayers[p.key] ? 'completed' : ''}`}
                      onClick={() => toggleIndividualPrayer(p.key)}>
                      <span className="prayer-mini-name">{p.name}</span>
                      <div className="prayer-mini-actions">
                        <button className={`ck-chip${prayerDetails[p.key]?.jamaa ? ' active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); togglePrayerSub(p.key, 'jamaa'); }}>جماعة</button>
                        {p.key !== 'asr' && (
                          <button className={`ck-chip${prayerDetails[p.key]?.nafila ? ' active' : ''}`}
                            onClick={(e) => { e.stopPropagation(); togglePrayerSub(p.key, 'nafila'); }}>نافلة</button>
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
                      <button className="quran-stepper-btn" onClick={(e) => { e.stopPropagation(); stepQuranPages(-1); }}
                        disabled={(entry.quranPages ?? 0) <= 0}>−</button>
                      <input type="number" min="0" max="1000" placeholder="٠" value={entry.quranPages ?? ''}
                        onChange={(e) => handleQuranPages(e.target.value)} onClick={(e) => e.stopPropagation()} />
                      <button className="quran-stepper-btn" onClick={(e) => { e.stopPropagation(); stepQuranPages(+1); }}
                        disabled={(entry.quranPages ?? 0) >= 1000}>+</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Adhkar expansion — sub checkboxes in classic */}
              {habit.key === 'dhikr' && adhkarExpanded && (
                <div className="prayer-expansion">
                  <div className="adhkar-chips-grid">
                    {ADHKAR_SUBS.map((sub) => (
                      <SubCheckbox key={sub.key} checked={adhkarDetails[sub.key]} label={sub.name}
                        onChange={() => toggleAdhkarSub(sub.key)} />
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
            <span className="progress-score">{toArabicNumeral(score)} / {toArabicNumeral(5)}</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${percentage}%` }} />
          </div>
          <div className="progress-message">{PROGRESS_MESSAGES[score]}</div>
        </div>
      </div>

      {/* Submit */}
      {isSubmitted ? (
        <div className="submitted-panel">
          <span className="submitted-text">تم اعتماد اليوم ✅ — الله يثبتك، كمل!</span>
          <button className="submitted-edit-btn" onClick={unsubmitDay}>تعديل</button>
        </div>
      ) : (
        <button className="btn btn-submit" onClick={submitDay}>اعتماد اليوم</button>
      )}

      {/* Reflection */}
      <div className="reflection-section">
        {!showReflection && !entry.note ? (
          <button className="reflection-toggle-btn" onClick={() => setShowReflection(true)}>✏️ إضافة تأمل</button>
        ) : (
          <textarea className="reflection-textarea" placeholder="ما أكثر شيء أثر في قلبك اليوم؟"
            value={entry.note || ''} onChange={(e) => handleNote(e.target.value)}
            autoFocus={showReflection && !entry.note} />
        )}
      </div>

      {/* Sharing */}
      <div className="sharing-section">
        <button className="btn btn-whatsapp" onClick={shareWhatsApp}>مشاركة التطبيق عبر واتساب</button>
        <button className="btn btn-secondary" onClick={copyLink}>نسخ رابط التطبيق</button>
      </div>

      {/* Actions */}
      <div className="actions-row">
        {!isToday && <button className="btn btn-secondary" onClick={() => onNavigateDate(null)}>الانتقال لليوم</button>}
        <button className="btn btn-danger" onClick={onClearDay}>مسح بيانات اليوم</button>
      </div>

      {/* Settings toggle */}
      <div className="ck-settings" style={{ marginTop: 12 }}>
        <span className="ck-settings-label">التصميم:</span>
        <button className="ck-settings-btn active">كلاسيكي</button>
        <button className="ck-settings-btn" onClick={onToggleUi}>مضغوط</button>
      </div>

      <div className="auto-save-notice">يتم الحفظ تلقائياً على جهازك</div>
      {showSaveToast && <div className="save-toast">✓ تم الحفظ</div>}
    </div>
  );
}
