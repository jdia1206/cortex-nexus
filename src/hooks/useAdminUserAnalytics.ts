import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LoginSession {
  id: string;
  user_id: string;
  user_email: string;
  tenant_id: string | null;
  logged_in_at: string;
  logged_out_at: string | null;
  ip_address: string | null;
  browser: string | null;
  os: string | null;
  device_type: string | null;
  country: string | null;
  city: string | null;
}

export function useAdminUserAnalytics() {
  return useQuery({
    queryKey: ['admin-user-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_login_sessions' as any)
        .select('*')
        .order('logged_in_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      const sessions = (data || []) as unknown as LoginSession[];

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const recentSessions = sessions.filter(
        (s) => new Date(s.logged_in_at) >= thirtyDaysAgo
      );

      // Total logins
      const totalLoginsAllTime = sessions.length;
      const totalLogins30d = recentSessions.length;

      // Unique users
      const uniqueUsers30d = new Set(recentSessions.map((s) => s.user_id)).size;
      const avgSessionsPerUser = uniqueUsers30d > 0 ? totalLogins30d / uniqueUsers30d : 0;

      // Daily login trend (last 30 days)
      const dailyTrend: Record<string, number> = {};
      recentSessions.forEach((s) => {
        const day = s.logged_in_at.substring(0, 10);
        dailyTrend[day] = (dailyTrend[day] || 0) + 1;
      });
      const loginTrend = Object.entries(dailyTrend)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Device breakdown
      const deviceCounts: Record<string, number> = {};
      sessions.forEach((s) => {
        const d = s.device_type || 'unknown';
        deviceCounts[d] = (deviceCounts[d] || 0) + 1;
      });
      const deviceBreakdown = Object.entries(deviceCounts).map(([name, value]) => ({ name, value }));

      // Browser breakdown
      const browserCounts: Record<string, number> = {};
      sessions.forEach((s) => {
        const b = s.browser || 'unknown';
        browserCounts[b] = (browserCounts[b] || 0) + 1;
      });
      const browserBreakdown = Object.entries(browserCounts).map(([name, value]) => ({ name, value }));

      // Country breakdown
      const countryCounts: Record<string, number> = {};
      sessions.forEach((s) => {
        const c = s.country || 'Unknown';
        countryCounts[c] = (countryCounts[c] || 0) + 1;
      });
      const countryBreakdown = Object.entries(countryCounts)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count);

      // Peak hours
      const hourCounts: Record<number, number> = {};
      sessions.forEach((s) => {
        const hour = new Date(s.logged_in_at).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
      const peakHours = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, '0')}:00`,
        count: hourCounts[i] || 0,
      }));

      // Most active users
      const userCounts: Record<string, { email: string; count: number; lastSeen: string; device: string }> = {};
      sessions.forEach((s) => {
        if (!userCounts[s.user_id]) {
          userCounts[s.user_id] = {
            email: s.user_email,
            count: 0,
            lastSeen: s.logged_in_at,
            device: s.device_type || 'unknown',
          };
        }
        userCounts[s.user_id].count++;
        if (s.logged_in_at > userCounts[s.user_id].lastSeen) {
          userCounts[s.user_id].lastSeen = s.logged_in_at;
          userCounts[s.user_id].device = s.device_type || 'unknown';
        }
      });
      const activeUsers = Object.entries(userCounts)
        .map(([userId, data]) => ({ userId, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      return {
        totalLoginsAllTime,
        totalLogins30d,
        uniqueUsers30d,
        avgSessionsPerUser,
        loginTrend,
        deviceBreakdown,
        browserBreakdown,
        countryBreakdown,
        peakHours,
        activeUsers,
        recentSessions: sessions.slice(0, 50),
      };
    },
  });
}
