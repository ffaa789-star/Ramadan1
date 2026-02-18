import { useNavigate } from 'react-router-dom';

const FEATURES = [
  { icon: '🕌', text: 'الصلوات (مع الجماعة والنافلة)' },
  { icon: '📖', text: 'ورد القرآن' },
  { icon: '📿', text: 'الأذكار' },
  { icon: '🌃', text: 'القيام' },
  { icon: '🍽️', text: 'الصيام والصدقة' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();

  return (
    <div className="onboarding">
      <div className="onboarding-card">
        <div className="onboarding-icon">🌙</div>
        <h1 className="onboarding-title">رفيق رمضان</h1>
        <p className="onboarding-subtitle">
          متابعة يومية بسيطة تساعدك تثبت على العبادات خلال الشهر
        </p>

        <ul className="onboarding-features">
          {FEATURES.map((f) => (
            <li key={f.text} className="onboarding-feature">
              <span className="onboarding-feature-icon">{f.icon}</span>
              <span className="onboarding-feature-text">{f.text}</span>
            </li>
          ))}
        </ul>

        <button
          className="btn btn-submit onboarding-btn"
          onClick={() => navigate('/daily', { replace: true })}
        >
          ابدأ رحلتك
        </button>

        <p className="onboarding-note">
          بياناتك محفوظة في جهازك فقط — هدفنا الاستمرارية لا التعقيد
        </p>
      </div>
    </div>
  );
}
