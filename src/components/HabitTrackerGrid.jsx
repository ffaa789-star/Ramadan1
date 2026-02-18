import { useMemo } from 'react';
import {
  buildHijriMonthDays,
  getHijriParts,
  formatHijriDayOnly,
  toArabicNumeral,
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

export default function HabitTrackerGrid({ entries, selectedDate, onSelectDate }) {
  const todayYmd = getTodayYMD();

  const monthDays = useMemo(() => buildHijriMonthDays(selectedDate), [selectedDate]);

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
            {HABITS.map((habit) => (
              <tr key={habit.key}>
                <td className="habit-grid-label">
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
