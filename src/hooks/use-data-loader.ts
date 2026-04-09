import { useEffect, useState } from 'react';
import { store } from '@/lib/store';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export function useDataLoader(authUser: SupabaseUser | null) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    store.loadFromSupabase(authUser.id)
      .then(() => setLoading(false))
      .catch(err => {
        console.error('Failed to load data:', err);
        setError('Failed to load data');
        setLoading(false);
      });
  }, [authUser?.id]);

  return { loading, error };
}
