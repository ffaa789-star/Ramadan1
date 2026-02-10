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

/* ── Hijri structured parts (Umm Al-Qura) ── */

/**
 * Get structured Hijri parts { hDay, hMonth, hYear } for a Gregorian YMD.
 * Uses 'en-SA-u-ca-islamic-umalqura' with formatToParts for numeric values.
 */
export function getHijriParts(ymd) {
  try {
    const dt = parseYMDToLocalNoon(ymd);
    const parts = new Intl.DateTimeFormat('en-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    }).formatToParts(dt);
    const dayPart = parts.find((p) => p.type === 'day');
    const monthPart = parts.find((p) => p.type === 'month');
    const yearPart = parts.find((p) => p.type === 'year');
    return {
      hDay: dayPart ? parseInt(dayPart.value, 10) : 1,
      hMonth: monthPart ? parseInt(monthPart.value, 10) : 1,
      hYear: yearPart ? parseInt(yearPart.value, 10) : 1446,
    };
  } catch {
    return { hDay: 1, hMonth: 1, hYear: 1446 };
  }
}

/**
 * Get the Hijri month number (1-12) for a Gregorian "YYYY-MM-DD" string.
 */
export function getHijriMonth(ymd) {
  return getHijriParts(ymd).hMonth;
}

/**
 * Check if a Gregorian "YYYY-MM-DD" falls in Hijri Ramadan (month 9).
 */
export function isRamadan(ymd) {
  return getHijriMonth(ymd) === 9;
}

/**
 * Walk backward from anchorYmd until we find Hijri day == 1.
 * Returns the Gregorian YMD of the first day of that Hijri month.
 * Safety: max 35 steps to avoid infinite loops.
 */
export function findHijriMonthStart(anchorYmd) {
  let cur = anchorYmd;
  for (let i = 0; i < 35; i++) {
    const { hDay } = getHijriParts(cur);
    if (hDay === 1) return cur;
    cur = addDaysYMD(cur, -1);
  }
  return cur; // fallback
}

/**
 * Build array of Gregorian YMD strings for ONE complete Hijri month
 * containing anchorYmd. Walks to month start, then forward until
 * the Hijri month changes.
 * Returns: string[] of 29 or 30 Gregorian "YYYY-MM-DD" entries.
 */
export function buildHijriMonthDays(anchorYmd) {
  const startYmd = findHijriMonthStart(anchorYmd);
  const { hMonth, hYear } = getHijriParts(startYmd);

  const days = [startYmd];
  let cur = startYmd;
  for (let i = 0; i < 35; i++) {
    cur = addDaysYMD(cur, 1);
    const parts = getHijriParts(cur);
    if (parts.hMonth !== hMonth || parts.hYear !== hYear) break;
    days.push(cur);
  }
  return days;
}
