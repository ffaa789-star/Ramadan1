import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { emptyEntry, migrateEntry, entryToRow, rowToEntry } from '../lib/entryUtils';

const LOCAL_STORAGE_KEY = 'ramadan-companion';
const MIGRATED_KEY = 'ramadan-migrated-to-supabase';

function loadLocalEntries() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const entries = parsed.entries || {};
      const migrated = {};
      for (const key in entries) {
        migrated[key] = migrateEntry(entries[key]);
      }
      return migrated;
    }
  } catch {
    // ignore
  }
  return {};
}

function saveLocalEntries(entries) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ entries }));
  } catch { /* ignore */ }
}

export default function useEntries() {
  const { userId } = useAuth();
  const [entries, setEntries] = useState({});
  const [loading, setLoading] = useState(true);
  const hasMigrated = useRef(false);

  useEffect(() => {
    // ── Local-only mode (no supabase or no userId) ──
    if (!supabase || !userId) {
      // Load from localStorage so the app works without backend
      const local = loadLocalEntries();
      setEntries(local);
      setLoading(false);
      return;
    }

    // ── Supabase mode ──
    async function init() {
      setLoading(true);

      // One-time localStorage → Supabase migration
      const alreadyMigrated = localStorage.getItem(MIGRATED_KEY);
      if (!alreadyMigrated && !hasMigrated.current) {
        hasMigrated.current = true;
        const localEntries = loadLocalEntries();
        const dateKeys = Object.keys(localEntries);
        if (dateKeys.length > 0) {
          const rows = dateKeys.map((ymd) => entryToRow(localEntries[ymd], userId, ymd));
          await supabase.from('daily_entries').upsert(rows, { onConflict: 'user_id,date_ymd' });
          localStorage.setItem(MIGRATED_KEY, 'true');
        }
      }

      // Fetch from Supabase
      const { data } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('user_id', userId);

      const mapped = {};
      if (data) {
        for (const row of data) {
          mapped[row.date_ymd] = migrateEntry(rowToEntry(row));
        }
      }
      setEntries(mapped);
      setLoading(false);
    }

    init();
  }, [userId]);

  const getEntry = useCallback(
    (dateYmd) => entries[dateYmd] || emptyEntry(),
    [entries]
  );

  const updateEntry = useCallback(
    async (dateYmd, updated) => {
      // Optimistic local update
      setEntries((prev) => {
        const next = { ...prev, [dateYmd]: updated };
        saveLocalEntries(next);
        return next;
      });

      // Write-through to Supabase (only when available)
      if (supabase && userId) {
        const row = entryToRow(updated, userId, dateYmd);
        await supabase
          .from('daily_entries')
          .upsert(row, { onConflict: 'user_id,date_ymd' });
      }
    },
    [userId]
  );

  const clearEntry = useCallback(
    async (dateYmd) => {
      setEntries((prev) => {
        const next = { ...prev };
        delete next[dateYmd];
        saveLocalEntries(next);
        return next;
      });

      if (supabase && userId) {
        await supabase
          .from('daily_entries')
          .delete()
          .eq('user_id', userId)
          .eq('date_ymd', dateYmd);
      }
    },
    [userId]
  );

  return { entries, getEntry, updateEntry, clearEntry, loading };
}
