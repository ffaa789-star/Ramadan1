import { useState, useEffect, useRef } from 'react';
import { toArabicNumeral } from '../dateUtils';

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
  { key: 'prayer', name: 'الصلاة', icon: '🕌', desc: 'الصلوات الخمس' },
  { key: 'quran', name: 'القرآن', icon: '📖', desc: 'ورد القرآن' },
  { key: 'dhikr', name: 'الأذكار', icon: '📿', desc: 'الأذكار والدعاء' },
  { key: 'qiyam', name: 'القيام', icon: '🌃', desc: 'قيام الليل' },
  { key: 'fasting', name: 'الصيام', icon: '🍽️', desc: 'صيام اليوم' },
  { key: 'charity', name: 'الصدقة', icon: '🤲', desc: 'صدقة اليوم' },
];

const EHSAN_LINK = 'https://ehsan.sa/campaign/7116894CC2';

function allPrayersDone(prayers) {
  return prayers && INDIVIDUAL_PRAYERS.every((p) => prayers[p.key]);
}

export default function DailyCheckIn({ entry, onUpdate, onClearDay }) {
  const [expandedCard, setExpandedCard] = useState(null);
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
  const allComplete = score === 6;
  const completedPrayerCount = INDIVIDUAL_PRAYERS.filter((p) => prayers[p.key]).length;
  const adhkarActiveCount = ADHKAR_SUBS.filter((s) => adhkarDetails[s.key]).length;

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setShowSaveToast(true);
    const timer = setTimeout(() => setShowSaveToast(false), 800);
    return () => clearTimeout(timer);
  }, [entry]);

  /* ── Action handlers ── */
  function toggleCardExpand(key) {
    setExpandedCard((prev) => (prev === key ? null : key));
  }

  function toggleHabitDone(key, e) {
    e.stopPropagation();
    if (key === 'prayer') {
      togglePrayerMain();
    } else if (key === 'dhikr') {
      const newVal = !entry.dhikr;
      const newAdhkar = newVal
        ? { morning: true, evening: true, duaa: true }
        : { morning: false, evening: false, duaa: false };
      onUpdate({ ...entry, dhikr: newVal, adhkarDetails: newAdhkar });
    } else if (key === 'quran') {
      const updated = { ...entry, quran: !entry.quran };
      if (!updated.quran) updated.quranPages = null;
      onUpdate(updated);
    } else {
      onUpdate({ ...entry, [key]: !entry[key] });
    }
  }

  function handleCardTap(key) {
    const expandable = key === 'prayer' || key === 'quran' || key === 'dhikr';
    if (expandable) {
      toggleCardExpand(key);
    } else {
      // Simple toggle for non-expandable
      onUpdate({ ...entry, [key]: !entry[key] });
    }
  }

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

  function submitDay() { onUpdate({ ...entry, submitted: true }); }
  function unsubmitDay() { onUpdate({ ...entry, submitted: false }); }

  function getSubLabel(key) {
    if (key === 'prayer') return `${toArabicNumeral(completedPrayerCount)}/٥`;
    if (key === 'quran' && entry.quranPages > 0) return `${toArabicNumeral(entry.quranPages)} صفحة`;
    if (key === 'dhikr' && adhkarActiveCount > 0) return `${toArabicNumeral(adhkarActiveCount)}/٣`;
    return null;
  }

  const isSubmitted = !!entry.submitted;

  return (
    <div className="ritual">
      {/* ── Habit cards ── */}
      <div className="ritual-cards">
        {HABITS.map((habit) => {
          const done = !!entry[habit.key];
          const expanded = expandedCard === habit.key;
          const expandable = habit.key === 'prayer' || habit.key === 'quran' || habit.key === 'dhikr';
          const subLabel = getSubLabel(habit.key);

          return (
            <div
              key={habit.key}
              className={`ritual-card${done ? ' ritual-card-done' : ''}${expanded ? ' ritual-card-expanded' : ''}`}
              onClick={() => handleCardTap(habit.key)}
            >
              {/* Card main content */}
              <div className="ritual-card-main">
                <div className="ritual-card-icon-wrap">
                  <span className="ritual-card-icon">{habit.icon}</span>
                  {done && <span className="ritual-card-check">✓</span>}
                </div>

                <div className="ritual-card-text">
                  <span className="ritual-card-name">{habit.name}</span>
                  {done && <span className="ritual-card-status">تم</span>}
                  {!done && subLabel && <span className="ritual-card-sub">{subLabel}</span>}
                  {done && subLabel && <span className="ritual-card-sub done">{subLabel}</span>}
                </div>

                <div className="ritual-card-actions">
                  {habit.key === 'charity' && (
                    <a
                      className="ritual-donate-link"
                      href={EHSAN_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      تبرع
                    </a>
                  )}
                  {expandable && (
                    <span className={`ritual-card-chevron${expanded ? ' open' : ''}`}>‹</span>
                  )}
                </div>
              </div>

              {/* ── Prayer expansion ── */}
              {habit.key === 'prayer' && expanded && (
                <div className="ritual-expand" onClick={(e) => e.stopPropagation()}>
                  {INDIVIDUAL_PRAYERS.map((p) => (
                    <div
                      key={p.key}
                      className={`ritual-prayer-row${prayers[p.key] ? ' done' : ''}`}
                      onClick={() => toggleIndividualPrayer(p.key)}
                    >
                      <div className={`ritual-mini-check${prayers[p.key] ? ' on' : ''}`}>
                        {prayers[p.key] && '✓'}
                      </div>
                      <span className="ritual-prayer-name">{p.name}</span>
                      <div className="ritual-chips">
                        <button
                          className={`ritual-chip${prayerDetails[p.key]?.jamaa ? ' active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); togglePrayerSub(p.key, 'jamaa'); }}
                        >
                          جماعة
                        </button>
                        {p.key !== 'asr' && (
                          <button
                            className={`ritual-chip${prayerDetails[p.key]?.nafila ? ' active' : ''}`}
                            onClick={(e) => { e.stopPropagation(); togglePrayerSub(p.key, 'nafila'); }}
                          >
                            نافلة
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Quran expansion ── */}
              {habit.key === 'quran' && expanded && (
                <div className="ritual-expand" onClick={(e) => e.stopPropagation()}>
                  <div className="ritual-quran-stepper">
                    <button
                      className="ritual-stepper-btn"
                      onClick={() => stepQuranPages(-1)}
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
                    />
                    <button
                      className="ritual-stepper-btn"
                      onClick={() => stepQuranPages(+1)}
                      disabled={(entry.quranPages ?? 0) >= 1000}
                    >
                      +
                    </button>
                    <span className="ritual-stepper-label">صفحة</span>
                  </div>
                </div>
              )}

              {/* ── Adhkar expansion ── */}
              {habit.key === 'dhikr' && expanded && (
                <div className="ritual-expand" onClick={(e) => e.stopPropagation()}>
                  <div className="ritual-adhkar-row">
                    {ADHKAR_SUBS.map((sub) => (
                      <button
                        key={sub.key}
                        className={`ritual-chip ritual-chip-lg${adhkarDetails[sub.key] ? ' active' : ''}`}
                        onClick={() => toggleAdhkarSub(sub.key)}
                      >
                        {adhkarDetails[sub.key] && <span className="ritual-chip-tick">✓ </span>}
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Completion celebration ── */}
      {allComplete && (
        <div className="ritual-celebration">
          <div className="ritual-celebration-icon">🎉</div>
          <div className="ritual-celebration-title">اليوم مكتمل</div>
          <div className="ritual-celebration-sub">تقبّل الله منك</div>
        </div>
      )}

      {/* ── Submit / Submitted ── */}
      {isSubmitted ? (
        <div className="ritual-submitted">
          <span className="ritual-submitted-text">تم الاعتماد ✅</span>
          <button className="ritual-submitted-edit" onClick={unsubmitDay}>تعديل</button>
        </div>
      ) : (
        <button className="ritual-submit-btn" onClick={submitDay}>
          اعتماد اليوم
        </button>
      )}

      {/* ── Reflection (optional) ── */}
      <Reflection entry={entry} onUpdate={onUpdate} />

      {/* ── Clear ── */}
      <div className="ritual-footer">
        <button className="ritual-clear-btn" onClick={onClearDay}>مسح اليوم</button>
      </div>

      {showSaveToast && <div className="save-toast">✓ تم الحفظ</div>}
    </div>
  );
}

/* ── Reflection sub-component ── */
function Reflection({ entry, onUpdate }) {
  const [open, setOpen] = useState(false);

  function handleNote(value) {
    onUpdate({ ...entry, note: value });
  }

  if (!open && !entry.note) {
    return (
      <button className="ritual-reflection-toggle" onClick={() => setOpen(true)}>
        ✏️ أضف تأملاً
      </button>
    );
  }

  return (
    <textarea
      className="ritual-reflection-input"
      placeholder="تأمل اليوم..."
      value={entry.note || ''}
      onChange={(e) => handleNote(e.target.value)}
      autoFocus={open && !entry.note}
    />
  );
}
