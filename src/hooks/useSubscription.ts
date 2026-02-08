import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useSubscription() {
  const { profile } = useAuth();

  const query = useQuery({
    queryKey: ['subscription', profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, subscription_plans(name, price_monthly)')
        .eq('tenant_id', profile!.tenant_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  const planName = query.data?.subscription_plans?.name?.toLowerCase() ?? 'free';
  const isPremium = planName === 'pro' || planName === 'enterprise';

  return {
    subscription: query.data,
    planName,
    isPremium,
    isLoading: query.isLoading,
  };
}
