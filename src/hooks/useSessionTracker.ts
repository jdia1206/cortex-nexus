import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

function parseUserAgent(ua: string) {
  let browser = 'Unknown';
  let os = 'Unknown';
  let deviceType = 'desktop';

  // Browser detection
  if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('OPR/') || ua.includes('Opera/')) browser = 'Opera';
  else if (ua.includes('Chrome/') && !ua.includes('Edg/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';

  // OS detection
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux') && !ua.includes('Android')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  // Device type detection
  if (ua.includes('Mobile') || ua.includes('iPhone') || ua.includes('Android')) {
    deviceType = ua.includes('Tablet') || ua.includes('iPad') ? 'tablet' : 'mobile';
  }

  return { browser, os, deviceType };
}

async function fetchGeoData() {
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return { ip: null, country: null, city: null };
    const data = await res.json();
    return {
      ip: data.ip as string | null,
      country: data.country_name as string | null,
      city: data.city as string | null,
    };
  } catch {
    return { ip: null, country: null, city: null };
  }
}

export function useSessionTracker() {
  const currentSessionId = useRef<string | null>(null);

  const trackLogin = useCallback(async (userId: string, email: string, tenantId?: string) => {
    try {
      const ua = navigator.userAgent;
      const { browser, os, deviceType } = parseUserAgent(ua);
      const geo = await fetchGeoData();

      const { data, error } = await supabase
        .from('user_login_sessions' as any)
        .insert({
          user_id: userId,
          user_email: email,
          tenant_id: tenantId || null,
          ip_address: geo.ip,
          user_agent: ua,
          browser,
          os,
          device_type: deviceType,
          country: geo.country,
          city: geo.city,
        } as any)
        .select('id')
        .single();

      if (error) {
        console.error('Failed to track login session:', error);
        return;
      }

      currentSessionId.current = (data as any)?.id || null;
    } catch (err) {
      console.error('Session tracking error:', err);
    }
  }, []);

  const trackLogout = useCallback(async () => {
    if (!currentSessionId.current) return;
    try {
      await supabase
        .from('user_login_sessions' as any)
        .update({ logged_out_at: new Date().toISOString() } as any)
        .eq('id', currentSessionId.current);
      currentSessionId.current = null;
    } catch (err) {
      console.error('Logout tracking error:', err);
    }
  }, []);

  return { trackLogin, trackLogout };
}
