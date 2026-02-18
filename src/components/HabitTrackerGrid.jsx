import { useMemo, Fragment } from 'react';
import {
  buildHijriMonthDays,
  formatHijriDayOnly,
  getTodayYMD,
} from '../dateUtils';

const HABITS = [
  { key: 'prayer', name: 'الصلاة', icon: '🕌' },
  { key: 'quran', name: 'القرآن', icon: '📖' },
  { key: 'fasting', name: 'الصيام', icon: '🍽️' },
  { key: 'qiyam', name: 'قيام الليل', icon: '🌃' },
  { key: 'charity', name: 'الصدقة', icon: '🤲' },
  { key: 'dhikr', name: 'الأذكار', icon: '📿' },
];

const PRAYER_SUBS = [
  { key: 'fajr', name: 'الفجر' },
  { key: 'dhuhr', name: 'الظهر' },
  { key: 'asr', name: 'العصر' },
  { key: 'maghrib', name: 'المغرب' },
  { key: 'isha', name: 'العشاء' },
];

const ADHKAR_SUBS = [
  { key: 'morning', name: 'الصباح' },
  { key: 'evening', name: 'المساء' },
  { key: 'duaa', name: 'الدعاء' },
];

export default function HabitTrackerGrid({
  entries,
  selectedDate,
  onSelectDate,
  expandedHabit,
  expandableKeys,
  onToggleExpand,
}) {
  const todayYmd = getTodayYMD();
  const monthDays = useMemo(() => buildHijriMonthDays(selectedDate), [selectedDate]);

  // Determine which sub-rows to render for expanded habit
  const subRows = expandedHabit === 'prayer' ? PRAYER_SUBS
    : expandedHabit === 'dhikr' ? ADHKAR_SUBS
    : null;

  // Helper: check if a sub-item is done for a given day
  function isSubDone(ymd, parentKey, subKey) {
    const dayEntry = entries[ymd];
    if (!dayEntry) return false;
    if (parentKey === 'prayer') return !!dayEntry.prayers?.[subKey];
    if (parentKey === 'dhikr') return !!dayEntry.adhkarDetails?.[subKey];
    return false;
  }

  return (
    <div className="habit-grid-wrap">
      <h3 className="habit-grid-title">متتبع العادات</h3>
      <div className="habit-grid-scroll">
        <table className="habit-grid">
          <thead>
            <tr>
              <th className="habit-grid-corner" />
              {monthDays.map((ymd) => {
                const hijriDay = formatHijriDayOnly(ymd);
                const isToday = ymd === todayYmd;
                const isSel = ymd === selectedDate;
                return (
                  <th
                    key={ymd}
                    className={`habit-grid-day-header${isToday ? ' today' : ''}${isSel ? ' sel' : ''}`}
                    onClick={() => onSelectDate(ymd)}
                  >
                    {hijriDay}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {HABITS.map((habit) => {
              const isExpandable = expandableKeys?.includes(habit.key);
              const isOpen = expandedHabit === habit.key;

              return (
                <Fragment key={habit.key}>
                  {/* Main habit row */}
                  <tr>
                    <td
                      className={`habit-grid-label${isExpandable ? ' habit-grid-label-expandable' : ''}`}
                      onClick={() => isExpandable && onToggleExpand?.(habit.key)}
                    >
                      {isExpandable && (
                        <span className={`habit-grid-chevron${isOpen ? ' open' : ''}`}>‹</span>
                      )}
                      <span className="habit-grid-icon">{habit.icon}</span>
                      <span className="habit-grid-name">{habit.name}</span>
                    </td>
                    {monthDays.map((ymd) => {
                      const dayEntry = entries[ymd];
                      const done = dayEntry ? !!dayEntry[habit.key] : false;
                      const isSel = ymd === selectedDate;
                      return (
                        <td
                          key={ymd}
                          className={`habit-grid-cell${done ? ' done' : ''}${isSel ? ' sel' : ''}`}
                          onClick={() => onSelectDate(ymd)}
                        >
                          {done ? '✓' : ''}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Sub-rows — only when this habit is expanded */}
                  {isOpen && subRows && subRows.map((sub) => (
                    <tr key={`${habit.key}-${sub.key}`} className="habit-grid-sub-row">
                      <td className="habit-grid-label habit-grid-sub-label">
                        <span className="habit-grid-sub-name">{sub.name}</span>
                      </td>
                      {monthDays.map((ymd) => {
                        const done = isSubDone(ymd, habit.key, sub.key);
                        const isSel = ymd === selectedDate;
                        return (
                          <td
                            key={ymd}
                            className={`habit-grid-cell habit-grid-sub-cell${done ? ' done' : ''}${isSel ? ' sel' : ''}`}
                            onClick={() => onSelectDate(ymd)}
                          >
                            {done ? '✓' : ''}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

