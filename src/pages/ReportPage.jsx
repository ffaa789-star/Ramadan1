import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTodayYMD, toArabicNumeral, buildHijriMonthDays, formatHijriMonthYear } from '../dateUtils';
import HabitTrackerGrid from '../components/HabitTrackerGrid';
import { resetTour } from '../components/GuidedTour';
import useEntries from '../hooks/useEntries';

const HABIT_KEYS = [
  { key: 'prayer', name: 'الصلاة', icon: '🕌' },
  { key: 'quran', name: 'القرآن', icon: '📖' },
  { key: 'fasting', name: 'الصيام', icon: '🍽️' },
  { key: 'qiyam', name: 'قيام الليل', icon: '🌃' },
  { key: 'charity', name: 'الصدقة', icon: '🤲' },
  { key: 'dhikr', name: 'الأذكار', icon: '📿' },
];

const EXPANDABLE_KEYS = ['prayer', 'dhikr'];

export default function ReportPage() {
  const { entries, loading } = useEntries();
  const [selectedDate, setSelectedDate] = useState(getTodayYMD);
  const [expandedHabit, setExpandedHabit] = useState(null);
  const [showCompliance, setShowCompliance] = useState(false);
  const navigate = useNavigate();

  function handleRestartTour() {
    resetTour();
    navigate('/daily');
  }

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

  return (
    <div className="report-page">
      <div className="report-title-row">
        <h2 className="report-title">تقرير {monthTitle}</h2>
        <button className="tour-reopen-btn" onClick={handleRestartTour}>؟ إعادة الجولة</button>
      </div>

      {/* ── KPIs ── */}
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

      {/* ── A: Tracker grid — immediately below KPIs ── */}
      <HabitTrackerGrid
        entries={entries}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        expandedHabit={expandedHabit}
        expandableKeys={EXPANDABLE_KEYS}
        onToggleExpand={toggleExpand}
      />

      {/* ── B: Compliance chart — collapsed by default ── */}
      <div className="card report-habits-card">
        <div
          className="report-section-toggle"
          onClick={() => setShowCompliance(!showCompliance)}
        >
          <span className={`report-toggle-icon${showCompliance ? ' open' : ''}`}>‹</span>
          <h3 className="report-section-title">نسبة الالتزام بالعادات</h3>
        </div>
        {showCompliance && (
          <div className="report-compliance-body">
            {stats.habitStats.map((h) => (
              <div key={h.key} className="report-habit-row">
                <span className="report-habit-label">{h.icon} {h.name}</span>
                <div className="report-habit-bar-track">
                  <div className="report-habit-bar-fill" style={{ width: `${h.pct}%` }} />
                </div>
                <span className="report-habit-pct" dir="ltr">{toArabicNumeral(h.pct)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Best / Weakest habits — compact blocks ── */}
      {stats.strongest && stats.strongest.pct > 0 && (
        <div className="card report-best-card">
          <span className="report-insight-title">أفضل عادة 👍</span>
          <span className="report-insight-body">{stats.strongest.icon} <strong>{stats.strongest.name}</strong> — ثابت أغلب الأيام</span>
        </div>
      )}

      {stats.weakest && stats.daysTracked > 0 && stats.weakest.pct < 100 && (
        <div className="card report-weak-card">
          <span className="report-insight-title">تحتاج تركيز ⚡</span>
          <span className="report-insight-body">{stats.weakest.icon} <strong>{stats.weakest.name}</strong> — ركّز عليها أكثر</span>
        </div>
      )}

      {stats.daysTracked === 0 && (
        <div className="card report-insights-card">
          <p className="report-insight">لا توجد بيانات لهذا الشهر بعد.</p>
        </div>
      )}

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
