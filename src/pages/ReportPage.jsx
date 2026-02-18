import { useState, useMemo } from 'react';
import { getTodayYMD, toArabicNumeral, buildHijriMonthDays, formatHijriMonthYear } from '../dateUtils';
import HabitTrackerGrid from '../components/HabitTrackerGrid';
import useEntries from '../hooks/useEntries';

const HABIT_KEYS = [
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
  { key: 'morning', name: 'أذكار الصباح' },
  { key: 'evening', name: 'أذكار المساء' },
  { key: 'duaa', name: 'الدعاء' },
];

export default function ReportPage() {
  const { entries, loading } = useEntries();
  const [selectedDate, setSelectedDate] = useState(getTodayYMD);
  const [expandedHabit, setExpandedHabit] = useState(null);

  const monthDays = useMemo(() => buildHijriMonthDays(selectedDate), [selectedDate]);
  const monthTitle = formatHijriMonthYear(monthDays[0]);

  const stats = useMemo(() => {
    const daysWithData = monthDays.filter((ymd) => entries[ymd]);
    const submittedDays = monthDays.filter((ymd) => entries[ymd]?.submitted);

    const habitStats = HABIT_KEYS.map((h) => {
      const count = daysWithData.filter((ymd) => entries[ymd]?.[h.key]).length;
      const pct = daysWithData.length > 0 ? Math.round((count / daysWithData.length) * 100) : 0;
      return { ...h, count, pct };
    });

    // Prayer sub-stats
    const prayerSubStats = PRAYER_SUBS.map((p) => {
      const count = daysWithData.filter((ymd) => entries[ymd]?.prayers?.[p.key]).length;
      const pct = daysWithData.length > 0 ? Math.round((count / daysWithData.length) * 100) : 0;
      return { ...p, count, pct };
    });

    // Adhkar sub-stats
    const adhkarSubStats = ADHKAR_SUBS.map((a) => {
      const count = daysWithData.filter((ymd) => entries[ymd]?.adhkarDetails?.[a.key]).length;
      const pct = daysWithData.length > 0 ? Math.round((count / daysWithData.length) * 100) : 0;
      return { ...a, count, pct };
    });

    let bestStreak = 0;
    let currentStreak = 0;
    for (const ymd of monthDays) {
      if (entries[ymd]?.submitted) {
        currentStreak++;
        if (currentStreak > bestStreak) bestStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
    }

    const sorted = [...habitStats].sort((a, b) => b.pct - a.pct);
    const strongest = sorted[0];
    const weakest = sorted[sorted.length - 1];

    return {
      totalDays: monthDays.length,
      daysTracked: daysWithData.length,
      submittedDays: submittedDays.length,
      bestStreak,
      habitStats,
      prayerSubStats,
      adhkarSubStats,
      strongest,
      weakest,
    };
  }, [entries, monthDays]);

  function toggleExpand(key) {
    setExpandedHabit(expandedHabit === key ? null : key);
  }

  function shareWhatsApp() {
    const text = `رفيق رمضان 🌙 — سجّل عباداتك اليومية بسهولة: ${window.location.origin}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.origin);
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <span>جاري التحميل...</span>
      </div>
    );
  }

  // Determine which habits are expandable
  const expandableKeys = ['prayer', 'dhikr'];

  return (
    <div className="report-page">
      <h2 className="report-title">تقرير {monthTitle}</h2>

      <div className="report-summary">
        <div className="report-stat-card">
          <span className="report-stat-num">{toArabicNumeral(stats.submittedDays)}</span>
          <span className="report-stat-label">يوم مُعتمد</span>
        </div>
        <div className="report-stat-card">
          <span className="report-stat-num">{toArabicNumeral(stats.bestStreak)}</span>
          <span className="report-stat-label">أطول سلسلة</span>
        </div>
        <div className="report-stat-card">
          <span className="report-stat-num">{toArabicNumeral(stats.daysTracked)}</span>
          <span className="report-stat-label">يوم مسجّل</span>
        </div>
      </div>

      {/* ── Habit breakdown with expandable sub-habits ── */}
      <div className="card report-habits-card">
        <h3 className="report-section-title">نسبة الالتزام بالعادات</h3>
        {stats.habitStats.map((h) => {
          const isExpandable = expandableKeys.includes(h.key);
          const isOpen = expandedHabit === h.key;

          return (
            <div key={h.key}>
              <div
                className={`report-habit-row${isExpandable ? ' report-habit-expandable' : ''}`}
                onClick={() => isExpandable && toggleExpand(h.key)}
              >
                {isExpandable && (
                  <span className={`report-expand-icon${isOpen ? ' open' : ''}`}>‹</span>
                )}
                <span className="report-habit-label">{h.icon} {h.name}</span>
                <div className="report-habit-bar-track">
                  <div className="report-habit-bar-fill" style={{ width: `${h.pct}%` }} />
                </div>
                <span className="report-habit-pct" dir="ltr">{toArabicNumeral(h.pct)}%</span>
              </div>

              {/* Sub-habits expansion */}
              {h.key === 'prayer' && isOpen && (
                <div className="report-sub-list">
                  {stats.prayerSubStats.map((p) => (
                    <div key={p.key} className="report-sub-row">
                      <span className="report-sub-name">{p.name}</span>
                      <div className="report-habit-bar-track report-sub-bar">
                        <div className="report-habit-bar-fill" style={{ width: `${p.pct}%` }} />
                      </div>
                      <span className="report-sub-pct" dir="ltr">{toArabicNumeral(p.pct)}%</span>
                    </div>
                  ))}
                </div>
              )}

              {h.key === 'dhikr' && isOpen && (
                <div className="report-sub-list">
                  {stats.adhkarSubStats.map((a) => (
                    <div key={a.key} className="report-sub-row">
                      <span className="report-sub-name">{a.name}</span>
                      <div className="report-habit-bar-track report-sub-bar">
                        <div className="report-habit-bar-fill" style={{ width: `${a.pct}%` }} />
                      </div>
                      <span className="report-sub-pct" dir="ltr">{toArabicNumeral(a.pct)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Best habit ── */}
      {stats.strongest && stats.strongest.pct > 0 && (
        <div className="card report-best-card">
          <div className="report-best-label">أفضل عادة لديك</div>
          <div className="report-best-value">
            {stats.strongest.icon} أقوى عادة: <strong>{stats.strongest.name}</strong> — استمر 👌
          </div>
        </div>
      )}

      {/* ── Weakest habit ── */}
      {stats.weakest && stats.daysTracked > 0 && stats.weakest.pct < 100 && (
        <div className="card report-weak-card">
          <div className="report-weak-label">أقل عادة تحتاج اهتمام</div>
          <div className="report-weak-value">
            {stats.weakest.icon} تحتاج تركيز أكثر على: <strong>{stats.weakest.name}</strong>
          </div>
        </div>
      )}

      {stats.daysTracked === 0 && (
        <div className="card report-insights-card">
          <p className="report-insight">لا توجد بيانات لهذا الشهر بعد.</p>
        </div>
      )}

      {/* ── Horizontal month tracker grid ── */}
      <HabitTrackerGrid
        entries={entries}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {/* ── Share & About ── */}
      <div className="card report-share-card">
        <h3 className="report-section-title">مشاركة</h3>
        <div className="report-share-btns">
          <button className="btn btn-whatsapp" onClick={shareWhatsApp}>مشاركة عبر واتساب</button>
          <button className="btn btn-secondary" onClick={copyLink}>نسخ الرابط</button>
        </div>
      </div>

      <div className="card report-about-card">
        <h3 className="report-section-title">عن التطبيق</h3>
        <p className="report-about-text">
          رفيق رمضان — تطبيق لتتبع عباداتك اليومية في شهر رمضان المبارك.
        </p>
        <p className="report-about-text">
          بياناتك محفوظة محليًا على جهازك فقط.
        </p>
      </div>
    </div>
  );
}
