import { useNavigate } from 'react-router-dom';

const FEATURES = [
  { icon: '🕌', name: 'الصلوات' },
  { icon: '📖', name: 'القرآن' },
  { icon: '📿', name: 'الأذكار' },
  { icon: '🍽️', name: 'الصيام' },
  { icon: '🌃', name: 'قيام الليل' },
  { icon: '🤲', name: 'الصدقة' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();

  return (
    <div className="ob">
      {/* ── Moon ── */}
      <div className="ob-moon">🌙</div>

      {/* ── Title ── */}
      <h1 className="ob-title">رفيق رمضان</h1>
      <p className="ob-subtitle">يساعدك تلتزم وتستمر… يومًا بعد يوم</p>

      {/* ── Description ── */}
      <div className="ob-card">
        <p className="ob-desc">
          نبدأ رمضان بحماس، لكن الصعوبة في الاستمرار.
          <br />
          رفيق رمضان ينظّم يومك ويعطيك رؤية واضحة لتقدّمك.
        </p>

        {/* ── Feature pills ── */}
        <div className="ob-features">
          {FEATURES.map((f) => (
            <span key={f.name} className="ob-pill">
              <span className="ob-pill-icon">{f.icon}</span>
              {f.name}
            </span>
          ))}
        </div>
      </div>

      {/* ── Value propositions ── */}
      <div className="ob-values">
        <div className="ob-value">
          <span className="ob-value-icon">📋</span>
          <span className="ob-value-text">تابع تقدّمك يوميًا</span>
        </div>
        <div className="ob-value">
          <span className="ob-value-icon">📊</span>
          <span className="ob-value-text">راجع أداءك نهاية الشهر</span>
        </div>
        <div className="ob-value">
          <span className="ob-value-icon">💪</span>
          <span className="ob-value-text">ابنِ عادة تستمر بعد رمضان</span>
        </div>
      </div>

      {/* ── CTA ── */}
      <button
        className="ob-cta"
        onClick={() => navigate('/daily', { replace: true })}
      >
        ابدأ رحلتك الآن
      </button>

      {/* ── Privacy note ── */}
      <p className="ob-privacy">بياناتك على جهازك فقط — لا حساب ولا تسجيل</p>
    </div>
  );
}
