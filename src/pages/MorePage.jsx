import { useAuth } from '../contexts/AuthContext';

export default function MorePage() {
  const { profile, signOut } = useAuth();

  function shareWhatsApp() {
    const text = `رفيق رمضان 🌙 — سجّل عباداتك اليومية بسهولة: ${window.location.origin}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.origin);
  }

  return (
    <div className="more-page">
      <div className="card more-card">
        <h2 className="more-heading">الحساب</h2>
        {profile && (
          <div className="more-profile">
            <span className="more-phone">{profile.phone}</span>
          </div>
        )}
        <button className="btn btn-secondary more-btn" onClick={signOut}>
          تسجيل الخروج
        </button>
      </div>

      <div className="card more-card">
        <h2 className="more-heading">مشاركة</h2>
        <button className="btn btn-whatsapp more-btn" onClick={shareWhatsApp}>
          مشاركة عبر واتساب
        </button>
        <button className="btn btn-secondary more-btn" onClick={copyLink}>
          نسخ الرابط
        </button>
      </div>
    </div>
  );
}
