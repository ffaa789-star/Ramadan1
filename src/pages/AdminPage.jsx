import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toArabicNumeral } from '../dateUtils';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifTarget, setNotifTarget] = useState('all');
  const [sendingNotif, setSendingNotif] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    if (!supabase) { setLoading(false); return; }

    setLoading(true);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!profiles) { setLoading(false); return; }

    const { data: allEntries } = await supabase
      .from('daily_entries')
      .select('user_id, date_ymd, submitted');

    const entryMap = {};
    if (allEntries) {
      for (const e of allEntries) {
        if (!entryMap[e.user_id]) entryMap[e.user_id] = [];
        entryMap[e.user_id].push(e);
      }
    }

    const enriched = profiles.map((p) => {
      const userEntries = entryMap[p.id] || [];
      const submittedCount = userEntries.filter((e) => e.submitted).length;
      const totalEntries = userEntries.length;

      let streak = 0;
      const sorted = userEntries
        .filter((e) => e.submitted)
        .map((e) => e.date_ymd)
        .sort()
        .reverse();

      if (sorted.length > 0) {
        streak = 1;
        for (let i = 1; i < sorted.length; i++) {
          const prev = new Date(sorted[i - 1]);
          const curr = new Date(sorted[i]);
          const diff = (prev - curr) / (1000 * 60 * 60 * 24);
          if (diff === 1) streak++;
          else break;
        }
      }

      return {
        ...p,
        totalEntries,
        submittedCount,
        streak,
        maskedPhone: p.phone ? p.phone.slice(0, 4) + '****' + p.phone.slice(-2) : '—',
      };
    });

    setUsers(enriched);
    setLoading(false);
  }

  const filteredUsers = users.filter((u) => {
    if (filter === 'high-streak') return u.streak >= 3;
    if (filter === 'low-engagement') return u.submittedCount <= 2;
    if (filter === 'new') {
      const created = new Date(u.created_at);
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      return created >= threeDaysAgo;
    }
    return true;
  });

  async function sendNotification() {
    if (!supabase) return;
    if (!notifTitle.trim() || !notifBody.trim()) return;
    setSendingNotif(true);

    const targetUsers = notifTarget === 'all' ? users : filteredUsers;

    const rows = targetUsers.map((u) => ({
      user_id: u.id,
      title: notifTitle.trim(),
      body: notifBody.trim(),
      is_read: false,
    }));

    await supabase.from('notifications').insert(rows);

    setNotifTitle('');
    setNotifBody('');
    setSendingNotif(false);
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <span>جاري التحميل...</span>
      </div>
    );
  }

  // Show message when supabase is not configured
  if (!supabase) {
    return (
      <div className="admin-page">
        <h2 className="admin-title">لوحة الإدارة</h2>
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p>لوحة الإدارة غير متوفرة في الوضع المحلي</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h2 className="admin-title">لوحة الإدارة</h2>

      <div className="report-summary">
        <div className="report-stat-card">
          <span className="report-stat-num">{toArabicNumeral(users.length)}</span>
          <span className="report-stat-label">مستخدم</span>
        </div>
        <div className="report-stat-card">
          <span className="report-stat-num">
            {toArabicNumeral(users.filter((u) => u.submittedCount > 0).length)}
          </span>
          <span className="report-stat-label">نشط</span>
        </div>
      </div>

      <div className="admin-filters">
        {[
          { key: 'all', label: 'الكل' },
          { key: 'high-streak', label: 'سلسلة عالية' },
          { key: 'low-engagement', label: 'مشاركة منخفضة' },
          { key: 'new', label: 'جدد' },
        ].map((f) => (
          <button
            key={f.key}
            className={`admin-filter-btn${filter === f.key ? ' active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="card admin-users-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>الجوال</th>
              <th>أيام</th>
              <th>مُعتمد</th>
              <th>سلسلة</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id}>
                <td dir="ltr">{u.maskedPhone}</td>
                <td>{toArabicNumeral(u.totalEntries)}</td>
                <td>{toArabicNumeral(u.submittedCount)}</td>
                <td>{toArabicNumeral(u.streak)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <p className="admin-empty">لا يوجد مستخدمون بهذا الفلتر</p>
        )}
      </div>

      <div className="card admin-notif-card">
        <h3 className="report-section-title">إرسال إشعار</h3>
        <input
          className="admin-input"
          placeholder="عنوان الإشعار"
          value={notifTitle}
          onChange={(e) => setNotifTitle(e.target.value)}
        />
        <textarea
          className="admin-textarea"
          placeholder="نص الإشعار"
          value={notifBody}
          onChange={(e) => setNotifBody(e.target.value)}
        />
        <div className="admin-notif-actions">
          <select
            className="admin-select"
            value={notifTarget}
            onChange={(e) => setNotifTarget(e.target.value)}
          >
            <option value="all">جميع المستخدمين</option>
            <option value="filtered">المفلترين ({toArabicNumeral(filteredUsers.length)})</option>
          </select>
          <button
            className="btn btn-submit"
            onClick={sendNotification}
            disabled={sendingNotif || !notifTitle.trim() || !notifBody.trim()}
          >
            {sendingNotif ? 'جاري الإرسال...' : 'إرسال'}
          </button>
        </div>
      </div>
    </div>
  );
}
