/* ── Timezone-safe Gregorian date helpers ──
 *  ALL storage & navigation uses "YYYY-MM-DD" Gregorian strings.
 *  Hijri is DISPLAY-ONLY via Intl with Umm Al-Qura calendar.
 */

export function pad2(n) {
  return String(n).padStart(2, '0');
}

/** Parse "YYYY-MM-DD" → local Date at noon (avoids midnight TZ shift) */
export function parseYMDToLocalNoon(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setHours(12, 0, 0, 0);
  return dt;
}

/** Format any Date → "YYYY-MM-DD" using local fields (never toISOString) */
export function formatYMD(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Convert any Date to a noon-anchored YMD string */
export function ymdFromDateLocalNoon(dt) {
  const d = new Date(dt);
  d.setHours(12, 0, 0, 0);
  return formatYMD(d);
}

/** Add/subtract days from a YMD string, returns new YMD string */
export function addDaysYMD(ymd, deltaDays) {
  const dt = parseYMDToLocalNoon(ymd);
  dt.setDate(dt.getDate() + deltaDays);
  return formatYMD(dt);
}

/** Today as "YYYY-MM-DD" */
export function getTodayYMD() {
  return formatYMD(new Date());
}

/* ── Hijri display helpers (Umm Al-Qura, display-only) ── */

/** Full Hijri with weekday: "الثلاثاء، ١٢ رمضان ١٤٤٦ هـ" */
export function formatHijriFromYMD(ymd) {
  try {
    const dt = parseYMDToLocalNoon(ymd);
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(dt);
  } catch {
    return '';
  }
}

/** Hijri day number only: "١٢" */
export function formatHijriDayOnly(ymd) {
  try {
    const dt = parseYMDToLocalNoon(ymd);
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
    }).format(dt);
  } catch {
    return '';
  }
}

/** Hijri month + year: "رمضان ١٤٤٦ هـ" */
export function formatHijriMonthYear(ymd) {
  try {
    const dt = parseYMDToLocalNoon(ymd);
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      month: 'long',
      year: 'numeric',
    }).format(dt);
  } catch {
    return '';
  }
}

/** Convert number to Arabic-Indic numerals: 12 → "١٢" */
export function toArabicNumeral(num) {
  const digits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num)
    .split('')
    .map((ch) => digits[parseInt(ch)] ?? ch)
    .join('');
}
