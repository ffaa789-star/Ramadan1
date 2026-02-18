import { useState, useEffect, useRef } from 'react';
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
  { key: 'prayer', name: 'الصلاة', icon: '🕌', expandable: true },
  { key: 'quran', name: 'القرآن', icon: '📖', expandable: true },
  { key: 'fasting', name: 'الصيام', icon: '🍽️' },
  { key: 'qiyam', name: 'قيام الليل', icon: '🌃' },
  { key: 'charity', name: 'الصدقة', icon: '🤲' },
  { key: 'dhikr', name: 'الأذكار', icon: '📿', expandable: true },
];

const EHSAN_LINK = 'https://ehsan.sa/campaign/7116894CC2';

export default function DailyCheckIn({
  entry, entries, onUpdate, selectedDate, isToday, onNavigateDate, onClearDay,
  tourExpandPrayer,
}) {
  const [expanded, setExpanded] = useState(null); // only one at a time
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
  const prayerCount = INDIVIDUAL_PRAYERS.filter((p) => prayers[p.key]).length;
  const adhkarCount = ADHKAR_SUBS.filter((s) => adhkarDetails[s.key]).length;
  const isSubmitted = !!entry.submitted;
  const locked = isSubmitted && !editing;

  useEffect(() => {
    setEditing(false);
    setExpanded(null);
  }, [selectedDate]);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setShowSaveToast(true);
    const timer = setTimeout(() => setShowSaveToast(false), 800);
    return () => clearTimeout(timer);
  }, [entry]);

  // Tour: auto-expand prayer when requested
  useEffect(() => {
    if (tourExpandPrayer) setExpanded('prayer');
  }, [tourExpandPrayer]);

  /* ── Handlers ── */
  function toggle(key) {
    if (locked) return;
    const u = { ...entry, [key]: !entry[key] };
    if (key === 'quran' && !u.quran) u.quranPages = null;
    onUpdate(u);
  }

  function togglePrayer(pk) {
    if (locked) return;
    const np = { ...prayers, [pk]: !prayers[pk] };
    const nd = { ...prayerDetails };
    if (!np[pk]) nd[pk] = { jamaa: false, nafila: false };
    onUpdate({ ...entry, prayers: np, prayerDetails: nd });
  }

  function togglePrayerSub(pk, sk) {
    if (locked) return;
    if (pk === 'asr' && sk === 'nafila') return;
    const old = prayerDetails[pk] || { jamaa: false, nafila: false };
    onUpdate({ ...entry, prayerDetails: { ...prayerDetails, [pk]: { ...old, [sk]: !old[sk] } } });
  }

  function toggleAdhkar(sk) {
    if (locked) return;
    onUpdate({ ...entry, adhkarDetails: { ...adhkarDetails, [sk]: !adhkarDetails[sk] } });
  }

  function stepQuran(d) {
    if (locked) return;
    const cur = entry.quranPages ?? 0;
    const next = Math.min(1000, Math.max(0, cur + d));
    const u = { ...entry, quranPages: next === 0 ? null : next };
    if (next > 0) u.quran = true;
    onUpdate(u);
  }

  function handleQuranInput(v) {
    if (locked) return;
    const raw = v === '' ? null : parseInt(v) || 0;
    const pages = raw === null ? null : Math.min(1000, Math.max(0, raw));
    const u = { ...entry, quranPages: pages };
    if (pages !== null && pages > 0) u.quran = true;
    onUpdate(u);
  }

  function submitDay() { onUpdate({ ...entry, submitted: true }); setEditing(false); }

  function doExpand(key) {
    if (locked) return;
    setExpanded(expanded === key ? null : key);
  }

  // Build sub-label for each expandable habit
  function subLabel(key) {
    if (key === 'prayer') return `${toArabicNumeral(prayerCount)} / ٥`;
    if (key === 'quran' && entry.quranPages > 0) return `${toArabicNumeral(entry.quranPages)} ص`;
    if (key === 'dhikr' && adhkarCount > 0) return `${toArabicNumeral(adhkarCount)} / ٣`;
    return null;
  }

  const todayYMD = getTodayYMD();
  const isFuture = selectedDate > todayYMD;

  let dayState = 'today';
  if (isSubmitted && !editing) dayState = 'approved';
  else if (isSubmitted && editing) dayState = 'editing';
  else if (isFuture) dayState = 'future';
  else if (!isToday) dayState = 'past';

  const hijriDate = formatHijriFromYMD(selectedDate);

  return (
    <div className="cl">
      {/* ── Date nav ── */}
      <div className="cl-date">
        <button className="cl-arrow" onClick={() => onNavigateDate(addDaysYMD(selectedDate, -1))}>→</button>
        <div className="cl-date-center">
          <span className="cl-date-text">{hijriDate}</span>
        </div>
        <button className="cl-arrow" onClick={() => onNavigateDate(addDaysYMD(selectedDate, +1))}>←</button>
      </div>

      {/* ── Status strip — ALWAYS 32px ── */}
      <div className={`cl-strip cl-strip-${dayState}`}>
        {dayState === 'today' && <span>اليوم</span>}
        {dayState === 'past' && (
          <>
            <span>يوم سابق</span>
            <button className="cl-strip-btn" onClick={() => onNavigateDate(null)}>العودة لليوم</button>
          </>
        )}
        {dayState === 'future' && (
          <>
            <span>يوم قادم</span>
            <button className="cl-strip-btn" onClick={() => onNavigateDate(null)}>العودة لليوم</button>
          </>
        )}
        {dayState === 'approved' && (
          <>
            <span>تم اعتماد اليوم ✔</span>
            <button className="cl-strip-btn" onClick={() => setEditing(true)}>تعديل</button>
          </>
        )}
        {dayState === 'editing' && (
          <>
            <span>وضع التعديل</span>
            <button className="cl-strip-btn cl-strip-save" onClick={submitDay}>حفظ</button>
          </>
        )}
      </div>

      {/* ── Flat habit list — paper checklist ── */}
      <div className={`cl-list${dayState === 'approved' ? ' cl-list-faded' : ''}`} data-tour="daily-list">
        {HABITS.map((h, i) => {
          const done = !!entry[h.key];
          const isOpen = expanded === h.key;
          const sl = subLabel(h.key);

          return (
            <div key={h.key}>
              {i > 0 && <div className="cl-sep" />}

              {/* Main row — same structure for ALL habits */}
              <div className={`cl-row${done ? ' cl-done' : ''}`}>
                {/* Checkbox — tap to toggle completion */}
                <button
                  className={`cl-check${done ? ' cl-checked' : ''}`}
                  onClick={() => {
                    if (locked) return;
                    if (h.key === 'prayer') toggle('prayer');
                    else if (h.key === 'dhikr') toggle('dhikr');
                    else toggle(h.key);
                  }}
                  disabled={locked}
                  {...(h.key === 'prayer' ? { 'data-tour': 'habit-toggle-prayer' } : {})}
                >
                  {done && '✓'}
                </button>

                {/* Icon + name + sub info — tap to expand if expandable */}
                <div
                  className="cl-label"
                  onClick={() => h.expandable ? doExpand(h.key) : null}
                >
                  <span className="cl-icon">{h.icon}</span>
                  <span className="cl-name">{h.name}</span>
                  {sl && <span className="cl-detail" dir="ltr">{sl}</span>}
                  {h.key === 'charity' && (
                    <a className="cl-donate" href={EHSAN_LINK} target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}>تبرع ↗</a>
                  )}
                </div>

                {/* Expand arrow (only for expandable) */}
                {h.expandable && (
                  <button
                    className="cl-expand-btn"
                    onClick={() => doExpand(h.key)}
                    disabled={locked}
                    {...(h.key === 'prayer' ? { 'data-tour': 'habit-expand-prayer' } : {})}
                  >
                    <span className={`cl-caret${isOpen ? ' open' : ''}`}>‹</span>
                  </button>
                )}
              </div>

              {/* ── Prayer sub-list ── */}
              {h.key === 'prayer' && isOpen && !locked && (
                <div className="cl-sub">
                  {INDIVIDUAL_PRAYERS.map((p) => (
                    <div key={p.key} className="cl-sub-row" onClick={() => togglePrayer(p.key)}>
                      <button className={`cl-check cl-check-sm${prayers[p.key] ? ' cl-checked' : ''}`}>
                        {prayers[p.key] && '✓'}
                      </button>
                      <span className="cl-sub-name">{p.name}</span>
                      <div className="cl-tags">
                        <button
                          className={`cl-tag${prayerDetails[p.key]?.jamaa ? ' on' : ''}`}
                          onClick={(e) => { e.stopPropagation(); togglePrayerSub(p.key, 'jamaa'); }}
                        >جماعة</button>
                        {p.key !== 'asr' && (
                          <button
                            className={`cl-tag${prayerDetails[p.key]?.nafila ? ' on' : ''}`}
                            onClick={(e) => { e.stopPropagation(); togglePrayerSub(p.key, 'nafila'); }}
                          >نافلة</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Quran sub ── */}
              {h.key === 'quran' && isOpen && !locked && (
                <div className="cl-sub">
                  <div className="cl-quran-row">
                    <span className="cl-sub-name">عدد الصفحات</span>
                    <div className="quran-stepper">
                      <button className="quran-stepper-btn" onClick={() => stepQuran(-1)}
                        disabled={(entry.quranPages ?? 0) <= 0}>−</button>
                      <input type="number" min="0" max="1000" placeholder="٠"
                        value={entry.quranPages ?? ''} onChange={(e) => handleQuranInput(e.target.value)} />
                      <button className="quran-stepper-btn" onClick={() => stepQuran(+1)}
                        disabled={(entry.quranPages ?? 0) >= 1000}>+</button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Adhkar sub ── */}
              {h.key === 'dhikr' && isOpen && !locked && (
                <div className="cl-sub">
                  {ADHKAR_SUBS.map((s) => (
                    <div key={s.key} className="cl-sub-row" onClick={() => toggleAdhkar(s.key)}>
                      <button className={`cl-check cl-check-sm${adhkarDetails[s.key] ? ' cl-checked' : ''}`}>
                        {adhkarDetails[s.key] && '✓'}
                      </button>
                      <span className="cl-sub-name">{s.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Progress — thin bar, no card ── */}
      <div className="cl-progress">
        <div className="cl-bar">
          <div className="cl-fill" style={{ width: `${(score / 6) * 100}%` }} />
        </div>
        <span className="cl-score" dir="ltr">{toArabicNumeral(score)} / ٦</span>
      </div>

      {/* ── Action slot — ALWAYS 44px ── */}
      <div className="cl-action">
        {dayState === 'approved'
          ? <span className="cl-action-empty" />
          : <button className="cl-approve" onClick={submitDay} data-tour="submit-button">تأكيد الإنجاز</button>
        }
      </div>

      {/* Clear — minimal, only if needed */}
      {!locked && score > 0 && (
        <button className="cl-clear" onClick={onClearDay}>مسح</button>
      )}

      {showSaveToast && <div className="save-toast">✓ تم الحفظ</div>}
    </div>
  );
}
