import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) fetchProfile(s.user.id);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        if (s) fetchProfile(s.user.id);
        else {
          setProfile(null);
          setIsAdmin(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) {
      setProfile(data);
      setIsAdmin(!!data.is_admin);
    }
  }

  async function signInAnonymously(phone) {
    // Sign in anonymously
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    if (authError) throw authError;

    const userId = authData.user.id;

    // Create profile with phone
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        phone,
        display_name: phone,
      }, { onConflict: 'id' });

    if (profileError) throw profileError;

    await fetchProfile(userId);
    return userId;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
  }

  const loading = session === undefined;

  return (
    <AuthContext.Provider value={{
      session,
      profile,
      isAdmin,
      loading,
      signInAnonymously,
      signOut,
      userId: session?.user?.id || null,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
