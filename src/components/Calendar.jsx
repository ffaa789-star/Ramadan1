import {
  getTodayYMD,
  pad2,
  toArabicNumeral,
  formatHijriDayOnly,
  formatHijriMonthYear,
} from '../dateUtils';

/* Sunday-first weekday headers (full Arabic names) */
const WEEKDAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const HABIT_KEYS = ['prayer', 'quran', 'qiyam', 'charity', 'dhikr'];

const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

function getScore(entry) {
  if (!entry) return 0;
  return HABIT_KEYS.reduce((sum, k) => sum + (entry[k] ? 1 : 0), 0);
}

export default function Calendar({ entries, selectedDate, onSelectDate, calendarMonth, onChangeMonth }) {
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();

  const todayStr = getTodayYMD();

  /* ── Grid boundaries (Gregorian month) ── */
  const firstDayOfMonth = new Date(year, month, 1);
  const leadingDays = firstDayOfMonth.getDay(); // Sunday = 0 ✓
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < leadingDays; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  /* ── Month header: Hijri (from mid-month for accuracy) + Gregorian ── */
  const midMonthYMD = `${year}-${pad2(month + 1)}-15`;
  const hijriHeader = formatHijriMonthYear(midMonthYMD);
  const gregorianHeader = `${MONTHS_AR[month]} ${toArabicNumeral(year)}`;

  function prevMonth() {
    onChangeMonth(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    onChangeMonth(new Date(year, month + 1, 1));
  }
  function jumpToToday() {
    const today = new Date();
    onChangeMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    onSelectDate(todayStr);
  }

  return (
    <div className="card">
      {/* Calendar Header */}
      <div className="calendar-header">
        <div className="calendar-nav">
          <button className="calendar-nav-btn" onClick={nextMonth}>←</button>
        </div>
        <div className="calendar-month-info">
          {hijriHeader && <div className="calendar-month-hijri">{hijriHeader}</div>}
          <div className="calendar-month-gregorian">{gregorianHeader}</div>
        </div>
        <div className="calendar-nav">
          <button className="calendar-nav-btn" onClick={prevMonth}>→</button>
        </div>
      </div>

      {/* Weekday Headers — Sunday first */}
      <div className="calendar-weekdays">
        {WEEKDAYS.map((day) => (
          <div key={day} className="calendar-weekday">{day}</div>
        ))}
      </div>

      {/* Day Grid */}
      <div className="calendar-grid">
        {cells.map((gregDay, idx) => {
          if (gregDay === null) {
            return <div key={`empty-${idx}`} className="calendar-day empty" />;
          }

          /* Build the Gregorian YMD string for this cell */
          const dateStr = `${year}-${pad2(month + 1)}-${pad2(gregDay)}`;

          /* Compute Hijri day label (display-only) */
          const hijriDay = formatHijriDayOnly(dateStr);

          const entry = entries[dateStr];
          const score = getScore(entry);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;

          let className = 'calendar-day';
          if (isToday) className += ' today';
          if (isSelected) className += ' selected';

          return (
            <button
              key={dateStr}
              className={className}
              onClick={() => onSelectDate(dateStr)}
            >
              <span className="calendar-day-number">
                {toArabicNumeral(gregDay)}
              </span>
              <span className="calendar-day-hijri">
                {hijriDay}
              </span>
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
