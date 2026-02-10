import { useMemo } from 'react';
import {
  getTodayYMD,
  toArabicNumeral,
  formatHijriMonthYear,
  getHijriParts,
  buildHijriMonthDays,
  findHijriMonthStart,
  addDaysYMD,
  parseYMDToLocalNoon,
} from '../dateUtils';

/* Saturday-first weekday headers */
const WEEKDAYS = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

const HABIT_KEYS = ['prayer', 'quran', 'qiyam', 'charity', 'dhikr'];

function getScore(entry) {
  if (!entry) return 0;
  return HABIT_KEYS.reduce((sum, k) => sum + (entry[k] ? 1 : 0), 0);
}

/**
 * Convert JS getDay() (0=Sunday) to Saturday-first index.
 * Saturday=0, Sunday=1, Monday=2, ... Friday=6
 */
function saturdayFirstIndex(jsDay) {
  return (jsDay + 1) % 7;
}

export default function Calendar({ entries, selectedDate, onSelectDate, calendarAnchor, onChangeAnchor }) {
  const todayStr = getTodayYMD();

  /* ── Build the Hijri month grid from anchor ── */
  const hijriDays = useMemo(() => buildHijriMonthDays(calendarAnchor), [calendarAnchor]);

  /* Hijri month/year info from the first day of the Hijri month */
  const hijriHeader = formatHijriMonthYear(hijriDays[0]);
  const { hMonth: displayedHijriMonth } = getHijriParts(hijriDays[0]);
  const isRamadanMonth = displayedHijriMonth === 9;

  /* Gregorian range for subtitle: e.g. "مارس – أبريل ٢٠٢٥" */
  const firstGreg = parseYMDToLocalNoon(hijriDays[0]);
  const lastGreg = parseYMDToLocalNoon(hijriDays[hijriDays.length - 1]);
  const gregSubtitle = (() => {
    const fmtMonth = (dt) => dt.toLocaleDateString('ar-EG', { month: 'long' });
    const fmtYear = (dt) => toArabicNumeral(dt.getFullYear());
    if (firstGreg.getMonth() === lastGreg.getMonth()) {
      return `${fmtMonth(firstGreg)} ${fmtYear(firstGreg)}`;
    }
    if (firstGreg.getFullYear() === lastGreg.getFullYear()) {
      return `${fmtMonth(firstGreg)} – ${fmtMonth(lastGreg)} ${fmtYear(firstGreg)}`;
    }
    return `${fmtMonth(firstGreg)} ${fmtYear(firstGreg)} – ${fmtMonth(lastGreg)} ${fmtYear(lastGreg)}`;
  })();

  /* ── Leading blanks for Saturday-first grid ── */
  const firstDayJs = parseYMDToLocalNoon(hijriDays[0]).getDay(); // 0=Sun
  const leadingBlanks = saturdayFirstIndex(firstDayJs);

  const cells = [];
  for (let i = 0; i < leadingBlanks; i++) {
    cells.push(null);
  }
  for (const ymd of hijriDays) {
    cells.push(ymd);
  }

  /* ── Navigation: jump to prev/next Hijri month ── */
  function prevHijriMonth() {
    // Go 1 day before the start of current Hijri month → lands in previous Hijri month
    const startOfCurrent = findHijriMonthStart(calendarAnchor);
    const dayBefore = addDaysYMD(startOfCurrent, -1);
    onChangeAnchor(dayBefore);
  }

  function nextHijriMonth() {
    // Go 1 day after the last day of current Hijri month → lands in next Hijri month
    const lastDay = hijriDays[hijriDays.length - 1];
    const dayAfter = addDaysYMD(lastDay, 1);
    onChangeAnchor(dayAfter);
  }

  function jumpToToday() {
    onChangeAnchor(todayStr);
    onSelectDate(todayStr);
  }

  return (
    <div className="card">
      {/* Calendar Header */}
      <div className="calendar-header">
        {/* RTL: right side = forward (next), left side = backward (prev) */}
        <div className="calendar-nav">
          <button className="calendar-nav-btn" onClick={prevHijriMonth} title="الشهر السابق">→</button>
        </div>
        <div className="calendar-month-info">
          <div className="calendar-month-hijri">{hijriHeader}</div>
          <div className="calendar-month-gregorian">{gregSubtitle}</div>
        </div>
        <div className="calendar-nav">
          <button className="calendar-nav-btn" onClick={nextHijriMonth} title="الشهر التالي">←</button>
        </div>
      </div>

      {/* Weekday Headers — Saturday first */}
      <div className="calendar-weekdays">
        {WEEKDAYS.map((day) => (
          <div key={day} className="calendar-weekday">{day}</div>
        ))}
      </div>

      {/* Day Grid */}
      <div className="calendar-grid">
        {cells.map((dateStr, idx) => {
          if (dateStr === null) {
            return <div key={`empty-${idx}`} className="calendar-day empty" />;
          }

          const { hDay, hMonth } = getHijriParts(dateStr);
          const gregDate = parseYMDToLocalNoon(dateStr);
          const gregDay = gregDate.getDate();

          const dayIsRamadan = hMonth === 9;
          const entry = entries[dateStr];
          const score = getScore(entry);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;

          let className = 'calendar-day';
          if (isToday) className += ' today';
          if (isSelected) className += ' selected';
          if (dayIsRamadan) className += ' is-ramadan';

          return (
            <button
              key={dateStr}
              className={className}
              onClick={() => onSelectDate(dateStr)}
            >
              {/* BIG: Hijri day */}
              <span className="calendar-day-hijri-num">
                {toArabicNumeral(hDay)}
              </span>
              {/* SMALL: Gregorian day */}
              <span className="calendar-day-greg">
                {gregDay}
              </span>
              {dayIsRamadan && isRamadanMonth && (
                <span className="ramadan-tag">رمضان</span>
              )}
              {score > 0 && (
                <>
                  <div className="calendar-day-dots">
                    {HABIT_KEYS.map((k) =>
                      entry && entry[k] ? (
                        <span key={k} className="calendar-day-dot" />
                      ) : null
                    )}
                  </div>
                  <div className="calendar-day-progress">
                    <div
                      className="calendar-day-progress-fill"
                      style={{ width: `${(score / 5) * 100}%` }}
                    />
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Jump to Today */}
      <button className="jump-today-btn" onClick={jumpToToday}>
        الانتقال لليوم
      </button>
    </div>
  );
}
