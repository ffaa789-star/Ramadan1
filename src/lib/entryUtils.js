const INDIVIDUAL_PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export function emptyEntry() {
  return {
    prayer: false,
    prayers: {
      fajr: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false,
    },
    prayerDetails: {
      fajr: { jamaa: false, nafila: false },
      dhuhr: { jamaa: false, nafila: false },
      asr: { jamaa: false, nafila: false },
      maghrib: { jamaa: false, nafila: false },
      isha: { jamaa: false, nafila: false },
    },
    quran: false,
    quranPages: null,
    qiyam: false,
    charity: false,
    dhikr: false,
    adhkarDetails: { morning: false, evening: false, duaa: false },
    fasting: false,
    submitted: false,
    note: '',
  };
}

/** Migrate old entries that lack newer sub-objects */
export function migrateEntry(raw) {
  if (!raw) return null;
  const migrated = { ...raw };

  if (!migrated.prayers) {
    migrated.prayers = {
      fajr: !!migrated.prayer,
      dhuhr: !!migrated.prayer,
      asr: !!migrated.prayer,
      maghrib: !!migrated.prayer,
      isha: !!migrated.prayer,
    };
  }

  if (!migrated.prayerDetails) {
    migrated.prayerDetails = {
      fajr: { jamaa: false, nafila: false },
      dhuhr: { jamaa: false, nafila: false },
      asr: { jamaa: false, nafila: false },
      maghrib: { jamaa: false, nafila: false },
      isha: { jamaa: false, nafila: false },
    };
  } else {
    const pd = migrated.prayerDetails;
    for (const k of INDIVIDUAL_PRAYERS) {
      if (pd[k] && 'sunnah' in pd[k] && !('nafila' in pd[k])) {
        pd[k] = { jamaa: pd[k].jamaa || false, nafila: pd[k].sunnah || false };
      } else if (pd[k] && !('nafila' in pd[k])) {
        pd[k] = { jamaa: pd[k].jamaa || false, nafila: false };
      }
    }
    if (pd.asr) pd.asr.nafila = false;
  }

  if (!migrated.adhkarDetails) {
    migrated.adhkarDetails = { morning: false, evening: false, duaa: false };
  }

  if (migrated.fasting === undefined) {
    migrated.fasting = false;
  }

  if (migrated.submitted === undefined) {
    migrated.submitted = false;
  }

  return migrated;
}

/** Convert a local entry object to a flat DB row shape */
export function entryToRow(entry, userId, dateYmd) {
  return {
    user_id: userId,
    date_ymd: dateYmd,
    prayer: entry.prayer,
    prayers: entry.prayers,
    prayer_details: entry.prayerDetails,
    quran: entry.quran,
    quran_pages: entry.quranPages,
    qiyam: entry.qiyam,
    charity: entry.charity,
    dhikr: entry.dhikr,
    adhkar_details: entry.adhkarDetails,
    fasting: entry.fasting,
    submitted: entry.submitted,
    note: entry.note || '',
  };
}

/** Convert a DB row back to local entry shape */
export function rowToEntry(row) {
  return {
    prayer: row.prayer,
    prayers: row.prayers || {
      fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false,
    },
    prayerDetails: row.prayer_details || {
      fajr: { jamaa: false, nafila: false },
      dhuhr: { jamaa: false, nafila: false },
      asr: { jamaa: false, nafila: false },
      maghrib: { jamaa: false, nafila: false },
      isha: { jamaa: false, nafila: false },
    },
    quran: row.quran,
    quranPages: row.quran_pages,
    qiyam: row.qiyam,
    charity: row.charity,
    dhikr: row.dhikr,
    adhkarDetails: row.adhkar_details || { morning: false, evening: false, duaa: false },
    fasting: row.fasting ?? false,
    submitted: row.submitted,
    note: row.note || '',
  };
}
