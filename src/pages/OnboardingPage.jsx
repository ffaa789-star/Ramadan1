import { useNavigate } from 'react-router-dom';

export default function OnboardingPage() {
  const navigate = useNavigate();

  return (
    <div className="onboarding">
      <div className="onboarding-card">
        <div className="onboarding-moon">🌙</div>

        <h1 className="onboarding-title">رفيق رمضان</h1>

        <p className="onboarding-tagline">
          مكان بسيط تختم فيه يومك في رمضان
        </p>

        <p className="onboarding-desc">
          سجّل عباداتك بهدوء، وتابع مسيرتك يوم بيوم.
        </p>

        <button
          className="onboarding-cta"
          onClick={() => navigate('/daily', { replace: true })}
        >
          ابدأ
        </button>

        <p className="onboarding-privacy">
          بياناتك على جهازك فقط — لا حساب ولا تسجيل
        </p>
      </div>
    </div>
  );
}
